import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';
import { openToolbar } from './toolbar-fixture';

for (const site of TARGET_SITES) for (const theme of ['light', 'dark'] as const) {
  test(`${site.name}: ${theme} native controls stay untreated while conversation comfort is enabled`, async ({ extensionContext }, testInfo) => {
    const provider = site.name.toLowerCase();
    const suggestion = provider === 'gemini' ? '<div class="suggestion-container"><button id="suggestion">Plan a focused afternoon</button></div>' : `<button id="suggestion" data-testid="${provider === 'claude' ? 'starter-prompt' : 'conversation-starter'}">Plan a focused afternoon</button>`;
    const composer = provider === 'gemini' ? '<div id="composer" class="text-input-field"><textarea aria-label="Message"></textarea></div>' : provider === 'claude' ? '<form id="composer"><div contenteditable="true" role="textbox" aria-label="Message"></div></form>' : '<div class="composer-parent"><form id="composer"><textarea aria-label="Message"></textarea></form></div>';
    await extensionContext.route(`${site.url}/**`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><style>:root{color-scheme:light dark}body{margin:0;font:16px/1.5 system-ui;color:light-dark(#18181b,#f4f4f5)}main{min-height:100vh;padding:80px 120px}button,textarea,[contenteditable]{font:inherit;color:inherit}#suggestion{padding:16px;border:1px solid #888;border-radius:8px;background:transparent}#composer{padding:16px;margin-top:24px;border-radius:12px;width:450px}textarea,[contenteditable]{min-height:48px;width:100%;background:transparent;border:0}dialog{background:#fff;color:#000}#messages{max-width:600px}#messages>*{display:block}</style><body><main>${suggestion}${composer}<div id="messages"></div><dialog open><p>Native dialog stays unchanged</p><button>Dialog action</button></dialog></main></body></html>` }));
    const settings = await openSettings(extensionContext);
    await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
    const page = await extensionContext.newPage(); await page.emulateMedia({ colorScheme: theme }); await page.goto(site.url);
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('opacity', '1');
    await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-ui');
    await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
    await expect(page.locator('#llm-reading-comfort .llm-comfort-region')).toHaveCount(0);
    for (const id of ['suggestion', 'composer']) await expect(page.locator(`#${id}`)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('dialog')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.locator('dialog').evaluate(el => (el as HTMLDialogElement).close());
    await page.screenshot({ path: testInfo.outputPath(`${provider}-${theme}-native-controls.png`) });
    await page.locator('#messages').evaluate((el, provider) => {
      const message = document.createElement(provider === 'gemini' ? 'model-response' : 'div');
      if (provider === 'claude') message.className = 'font-claude-response';
      if (provider === 'chatgpt') message.setAttribute('data-message-author-role', 'assistant');
      message.textContent = 'Start with one priority and take a short break.'; el.appendChild(message);
    }, provider);
    await expect(page.locator('#llm-reading-comfort .llm-comfort-region')).toHaveCount(1);
    for (const id of ['suggestion', 'composer']) {
      await expect(page.locator(`#${id}`)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator(`#${id}`)).toHaveCSS('backdrop-filter', 'none');
    }
    await settings.getByLabel('Reading comfort', { exact: true }).selectOption('off');
    await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-ui');
    await expect(page.locator('#llm-reading-comfort .llm-comfort-region')).toHaveCount(0);
    await settings.getByLabel('Reading comfort', { exact: true }).selectOption('soft');
    await settings.getByLabel('Enable wallpaper', { exact: true }).uncheck();
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-ui');
    await expect(page.locator('link[data-llm-wallpaper-comfort]')).toHaveCount(0);
  });
}

test('Editor reuse follows provider links, validates hashes, and keeps advanced controls optional', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext, false);
  await expect(settings.locator('#appearanceDetails')).not.toHaveAttribute('open');
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  for (const provider of ['claude', 'gemini'] as const) {
    const response = await settings.evaluate(providerId => chrome.runtime.sendMessage({ type: 'open-wallpaper-settings', providerId }), provider);
    expect(response.ok).toBe(true);
    await expect(settings).toHaveURL(new RegExp(`#provider=${provider}$`));
    await expect(settings.locator('#providerScope')).toHaveValue(provider);
  }
  expect(extensionContext.pages().filter(page => page.url().includes('/popup.html'))).toHaveLength(1);
  await settings.evaluate(() => { location.hash = 'provider=not-a-provider'; });
  await expect(settings.locator('#providerScope')).toHaveValue('global');
  expect((await settings.evaluate(() => chrome.runtime.sendMessage({ type: 'open-wallpaper-settings', providerId: 'https://example.test' }))).ok).toBe(false);
  await extensionContext.route('https://claude.ai/**', route => route.fulfill({ contentType: 'text/html', body: '<main>Example conversation</main>' }));
  const page = await extensionContext.newPage(); await page.goto('https://claude.ai');
  await page.getByRole('button', { name: 'Wallpaper quick controls' }).click();
  await expect(page.getByRole('button', { name: 'Reset this site’s effects' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit wallpaper', exact: true }).click();
  await expect(settings.locator('#providerScope')).toHaveValue('claude');
  expect(extensionContext.pages().filter(page => page.url().includes('/popup.html'))).toHaveLength(1);
  await page.bringToFront();
  const popup = await openToolbar(extensionContext);
  expect(await popup.evaluate("document.querySelectorAll('input[type=range]').length")).toBe(0);
  expect(await popup.evaluate("document.querySelector('#readingComfortInput').value")).toBe('soft');
  await popup.close();
});
