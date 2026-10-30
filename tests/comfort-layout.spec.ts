import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';

for (const site of TARGET_SITES) for (const theme of ['light', 'dark'] as const) {
  test(`${site.name}: localized ${theme} comfort starts with messages and leaves wallpaper gutters clear`, async ({ extensionContext }, testInfo) => {
    const message = site.name === 'Gemini' ? '<model-response>' : site.name === 'ChatGPT' ? '<div data-message-author-role="assistant">' : '<div class="font-claude-response">';
    const end = site.name === 'Gemini' ? '</model-response>' : '</div>';
    const wrapper = site.name === 'Gemini' ? 'class="conversation-container"' : site.name === 'ChatGPT' ? 'id="thread"' : 'data-testid="chat-container"';
    await extensionContext.route(`${site.url}/**`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><style>
      :root{color-scheme:light dark}body{margin:0;font:16px/1.6 system-ui;color:light-dark(#222,#eee)}aside{position:fixed;inset:0 auto 0 0;width:280px;background:light-dark(#f5f5f5,#252525)}
      main{margin-left:280px;min-height:100vh}body.collapsed aside{width:64px}body.collapsed main{margin-left:64px}
      .conversation-container,#thread,[data-testid="chat-container"]{width:100%;padding-top:100px}
      model-response,[data-message-author-role],.font-claude-response{display:block;width:100%}.prose{max-width:600px;margin:auto}p{margin:0 0 20px}pre{background:#353535;color:#eee;padding:12px;font:14px monospace}
      .text-input-field,.composer-parent,fieldset{position:fixed;bottom:30px;left:45%;width:40%}textarea{width:100%}
    </style></head><body><aside><button id="sidebar" onclick="document.body.classList.toggle('collapsed')">Toggle sidebar</button><button id="start">Start conversation</button><button id="new">New chat</button></aside><main><div ${wrapper}></div><div class="text-input-field composer-parent"><fieldset><textarea aria-label="Message"></textarea></fieldset></div></main><template id="response">${message}<div class="prose"><h2>A calmer conversation</h2><p>The wallpaper stays clear around the actual message. This paragraph wraps naturally in the reading column.</p><p>Only the text area receives a little blur and tint. The full-width wrapper is deliberately much wider.</p><pre><code>const wallpaper = 'visible';</code></pre></div>${end}</template><script>
      document.querySelector('#start').onclick=()=>document.querySelector('main > div').append(document.querySelector('template').content.cloneNode(true));
      document.querySelector('#new').onclick=()=>document.querySelector('main > div').replaceChildren();
    </script></body></html>` }));
    const settings = await openSettings(extensionContext);
    await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
    await settings.getByLabel('Opacity', { exact: true }).fill('1');
    const mode = settings.getByLabel('Reading comfort', { exact: true });
    const page = await extensionContext.newPage(); await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(site.url);
    const regions = page.locator('#llm-reading-comfort .llm-comfort-region');
    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
    await expect(regions).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
    await expect(mode.locator('option')).toHaveCount(2);
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Draft stays untreated');
    await expect(regions).toHaveCount(0);
    await page.getByRole('button', { name: 'Start conversation', exact: true }).click();
    await expect(regions).toHaveCount(1);
    await expect(regions.first()).toHaveCSS('backdrop-filter', 'blur(20px)');
    const native = await page.locator('pre').evaluate(el => ({ font: getComputedStyle(el).font, width: el.getBoundingClientRect().width, color: getComputedStyle(el).backgroundColor }));
    async function localized() {
      await expect.poll(async () => {
        const box = await regions.first().boundingBox(); const text = await page.locator('.prose').boundingBox();
        return !!box && !!text && box.width <= text.width + 80 && box.x >= text.x - 40 && box.x + box.width <= text.x + text.width + 40;
      }).toBe(true);
    }
    await localized();
    await page.getByRole('button', { name: 'Toggle sidebar', exact: true }).click(); await localized();
    await page.getByRole('button', { name: 'Toggle sidebar', exact: true }).click(); await localized();
    await page.screenshot({ path: testInfo.outputPath(`${site.name}-${theme}-localized.png`) });
    const quick = page.locator('#llm-wallpaper-controls').locator('#comfort');
    await quick.evaluate((el: HTMLSelectElement) => { el.value = 'off'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect(quick).toHaveValue('soft');
    const gutter = { x: 320, y: 140, width: 120, height: 180 };
    const clearWallpaper = await page.screenshot({ clip: gutter });
    await mode.selectOption('off'); await expect(regions).toHaveCount(0);
    expect((await page.screenshot({ clip: gutter })).equals(clearWallpaper)).toBe(true);
    expect(await page.locator('pre').evaluate(el => ({ font: getComputedStyle(el).font, width: el.getBoundingClientRect().width, color: getComputedStyle(el).backgroundColor }))).toEqual(native);
    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
    await mode.selectOption('soft'); await expect(regions).toHaveCount(1);
    await page.setViewportSize({ width: 1000, height: 700 }); await localized();
    // Text streaming can change glyph bounds without resizing the message wrapper.
    await page.locator('.prose').evaluate(el => { (el as HTMLElement).style.height = '300px'; el.replaceChildren(document.createTextNode('Short')); });
    await expect.poll(async () => (await regions.first().boundingBox())?.width ?? Infinity).toBeLessThan(200);
    await page.locator('.prose').evaluate(el => { el.firstChild!.nodeValue = 'Streaming text should grow the protected area while keeping the wallpaper gutters clear. '.repeat(4); });
    await expect.poll(async () => (await regions.first().boundingBox())?.width ?? 0).toBeGreaterThan(400);
    await page.locator('main > div').first().evaluate(el => { (el as HTMLElement).style.cssText += ';height:180px;overflow:auto;padding-top:0'; const prose = el.querySelector('.prose') as HTMLElement; prose.style.height = 'auto'; prose.firstChild!.nodeValue = 'A long response should never paint outside its scroll container. '.repeat(80); });
    async function clipped() {
      await expect.poll(async () => {
        const box = await regions.first().boundingBox(); const scroller = await page.locator('main > div').first().boundingBox();
        return !!box && !!scroller && box.y >= scroller.y - 1 && box.y + box.height <= scroller.y + scroller.height + 1;
      }).toBe(true);
    }
    await clipped();
    await page.locator('main > div').first().evaluate(el => { el.scrollTop = 130; }); await clipped();
    await page.getByRole('button', { name: 'New chat', exact: true }).click(); await expect(regions).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Another draft'); await expect(regions).toHaveCount(0);
  });
}
