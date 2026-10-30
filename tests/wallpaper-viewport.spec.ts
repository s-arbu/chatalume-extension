import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';

for (const site of TARGET_SITES) {
  test(`${site.name}: wallpaper fits the chat pane as navigation changes`, async ({ extensionContext }) => {
    const pane = site.name === 'Gemini' ? 'bard-sidenav-content' : 'main';
    await extensionContext.route(`${site.url}/**`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><style>
      body{margin:0}aside{position:fixed;left:0;top:0;bottom:0;width:288px;background:#eee;transition:width 180ms linear}
      ${pane}{display:block;position:fixed;left:288px;right:0;top:0;bottom:0;transition:left 180ms linear}
      body.collapsed aside{width:64px}body.collapsed ${pane}{left:64px}body.hidden aside{display:none}body.hidden ${pane}{left:0}
      body.mobile aside{width:288px;z-index:10}body.mobile ${pane}{left:0}
    </style></head><body><aside>Navigation</aside><${pane}><button id="collapse" onclick="document.body.classList.toggle('collapsed')">Collapse sidebar</button><button id="hide" onclick="document.body.classList.toggle('hidden')">Hide sidebar</button><button id="mobile" onclick="document.body.classList.toggle('mobile')">Mobile drawer</button><p>Chat area</p></${pane}></body></html>` }));
    const settings = await openSettings(extensionContext);
    await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
    const page = await extensionContext.newPage(); await page.setViewportSize({ width: 1280, height: 800 }); await page.goto(site.url);
    const overlay = page.locator('#llm-wallpaper-overlay');
    async function fits(left: number, right = page.viewportSize()!.width) {
      await expect.poll(async () => {
        const box = await overlay.boundingBox();
        return !!box && Math.abs(box.x - left) < 1 && Math.abs(box.width - (right - left)) < 1 && box.y === 0 && box.height === page.viewportSize()!.height;
      }).toBe(true);
    }
    await fits(288);
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click(); await fits(64);
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click(); await fits(288);
    await page.setViewportSize({ width: 1100, height: 700 }); await fits(288);
    await settings.getByLabel('Image fit', { exact: true }).selectOption('contain');
    await expect(overlay).toHaveCSS('background-size', '100% 100%, contain'); await fits(288);
    await page.getByRole('button', { name: 'Hide sidebar', exact: true }).click(); await fits(0);
    await page.getByRole('button', { name: 'Hide sidebar', exact: true }).click(); await fits(288);
    await page.getByRole('button', { name: 'Mobile drawer', exact: true }).click(); await fits(0);
    await page.getByRole('button', { name: 'Mobile drawer', exact: true }).focus();
    await page.getByRole('button', { name: 'Mobile drawer', exact: true }).press('Enter'); await fits(288);
    // A replaced layout pane must not leave an observed, detached node in charge.
    await page.locator(pane).evaluate(el => { const next = el.cloneNode(true) as HTMLElement; next.style.left = '220px'; el.replaceWith(next); });
    await fits(220);
    await settings.getByLabel('Enable wallpaper', { exact: true }).uncheck(); await expect(overlay).toHaveCount(0);
    await page.locator(pane).evaluate(el => { (el as HTMLElement).style.left = '180px'; });
    await settings.getByLabel('Enable wallpaper', { exact: true }).check(); await fits(180);
    // Position-only transitions keep width constant, so ResizeObserver alone is insufficient.
    await page.locator(pane).evaluate(el => { (el as HTMLElement).style.cssText += ';width:700px;right:auto;transition:transform 300ms linear'; }); await fits(180, 880);
    const drift = await page.locator(pane).evaluate(async el => {
      const overlay = document.querySelector('#llm-wallpaper-overlay')!;
      (el as HTMLElement).style.transform = 'translateX(100px)';
      const samples: number[] = [];
      await new Promise<void>(resolve => { function sample() { samples.push(Math.abs(el.getBoundingClientRect().left - overlay.getBoundingClientRect().left)); if (samples.length < 25) requestAnimationFrame(sample); else resolve(); } requestAnimationFrame(sample); });
      return Math.max(...samples);
    });
    expect(drift).toBeLessThan(25); await fits(280, 980);
    // Missing/hidden layout evidence falls back to the window instead of a stale crop.
    await page.locator(pane).evaluate(el => { (el as HTMLElement).style.display = 'none'; }); await fits(0);
    await page.locator(pane).evaluate(el => { (el as HTMLElement).style.display = 'block'; }); await fits(280, 980);
    await page.locator(pane).evaluate(el => el.remove()); await fits(0);
  });
}
