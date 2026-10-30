import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';
import { openToolbar } from './toolbar-fixture';

for (const site of TARGET_SITES) test(`${site.name}: actual toolbar scopes everyday actions to the active provider`, async ({ extensionContext }) => {
  for (const target of TARGET_SITES) await extensionContext.route(`${target.url}/**`, route => route.fulfill({ contentType: 'text/html', body: '<main>Example chat</main>' }));
  const settings = await openSettings(extensionContext);
  await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
  const page = await extensionContext.newPage(); await page.goto(site.url);
  const other = await extensionContext.newPage(); await other.goto(TARGET_SITES.find(target => target.name !== site.name)!.url);
  await page.bringToFront();
  const popup = await openToolbar(extensionContext);
  await expect.poll(() => popup.evaluate("document.querySelector('#providerName')?.textContent")).toBe(site.name);
  expect(await popup.evaluate("document.querySelector('#advancedControls').open")).toBe(false);
  await expect.poll(() => popup.evaluate("['sitePauseBtn','resetEffectsBtn','globalPauseBtn','manageWallpaperBtn'].every(id => { const b = document.getElementById(id).getBoundingClientRect(); return b.bottom <= innerHeight && b.right <= innerWidth; })")).toBe(true);
  await popup.evaluate("document.querySelector('#sitePauseBtn').click()");
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await expect(other.locator('#llm-wallpaper-overlay')).toBeAttached();
  await popup.close(); await page.bringToFront();
  const reopened = await openToolbar(extensionContext);
  expect(await reopened.evaluate("document.querySelector('#sitePauseBtn').textContent")).toBe(`Resume on ${site.name}`);
  await reopened.evaluate("document.querySelector('#sitePauseBtn').click()");
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await reopened.evaluate("document.querySelector('#globalPauseBtn').click()");
  await expect(other.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await expect.poll(() => reopened.evaluate("document.querySelector('#sitePauseBtn').disabled")).toBe(true);
  expect(await reopened.evaluate("document.querySelector('#contextNotice').textContent")).toContain('everywhere');
  await reopened.evaluate("document.querySelector('#globalPauseBtn').click()");
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await reopened.evaluate("document.querySelector('#advancedControls').open = true; const input = document.querySelector('#blurInput'); input.value = '8'; input.dispatchEvent(new Event('input'))");
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('filter', 'blur(8px)');
  await expect(other.locator('#llm-wallpaper-overlay')).toHaveCSS('filter', 'blur(0px)');
  await reopened.evaluate("const comfortInput = document.querySelector('#readingComfortInput'); comfortInput.value = 'off'; comfortInput.dispatchEvent(new Event('change'))");
  await expect.poll(() => reopened.evaluate("chrome.storage.local.get('llm_wallpaper_settings').then(r => r.llm_wallpaper_settings.providerOverrides[document.querySelector('#providerScope').value].readingComfort)")).toBe('off');
  await reopened.evaluate("document.querySelector('#resetEffectsBtn').click()");
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('filter', 'blur(0px)');
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('Dusk');
  expect(await reopened.evaluate("chrome.storage.local.get('llm_wallpaper_settings').then(r => { const o = r.llm_wallpaper_settings.providerOverrides[document.querySelector('#providerScope').value]; return { enabled: o.enabled, readingComfort: o.readingComfort }; })")).toEqual({ enabled: true, readingComfort: 'off' });
  await reopened.evaluate("document.querySelector('#inheritBtn').click()");
  await expect.poll(() => reopened.evaluate("document.querySelector('#scopeNotice').textContent")).toContain('global');
  await reopened.close();
});

test('Unsupported and empty toolbar states offer setup without claiming site changes', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext);
  await extensionContext.route('https://example.test/**', route => route.fulfill({ contentType: 'text/html', body: '<main>Unsupported page</main>' }));
  const unsupported = await extensionContext.newPage(); await unsupported.goto('https://example.test'); await unsupported.bringToFront();
  const popup = await openToolbar(extensionContext);
  await expect.poll(() => popup.evaluate("document.querySelector('#providerName')?.textContent")).toBe('Open a supported chat');
  expect(await popup.evaluate("document.querySelector('#siteActions').hidden")).toBe(true);
  expect(await popup.evaluate("document.querySelector('#advancedControls').hidden")).toBe(true);
  expect(await popup.evaluate("document.querySelector('#contextNotice').textContent")).toContain('ChatGPT');
  expect(await popup.evaluate("document.querySelector('#manageWallpaperBtn').textContent")).toBe('Choose wallpaper');
  expect(await settings.evaluate(async () => (await chrome.tabs.getCurrent())?.active)).toBe(false);
  await popup.evaluate("document.querySelector('#manageWallpaperBtn').click()");
  await expect.poll(() => settings.evaluate(async () => (await chrome.tabs.getCurrent())?.active)).toBe(true);
});


test('Toolbar site action recovers from rejected saves and survives closing a pending popup', async ({ extensionContext }) => {
  await extensionContext.route('https://gemini.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<main>Example chat</main>' }));
  const settings = await openSettings(extensionContext);
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  const page = await extensionContext.newPage(); await page.goto('https://gemini.google.com'); await page.bringToFront();
  const popup = await openToolbar(extensionContext);
  const worker = extensionContext.serviceWorkers()[0]!;
  await worker.evaluate(() => {
    const set = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = (async () => { chrome.storage.local.set = set; throw new Error('Save rejected for test'); }) as any;
  });
  await popup.evaluate("document.querySelector('#sitePauseBtn').click()");
  await expect.poll(() => popup.evaluate("document.querySelector('#uploadError').textContent")).toContain('Save rejected for test');
  expect(await popup.evaluate("document.querySelector('#sitePauseBtn').textContent")).toBe('Pause on Gemini');
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await worker.evaluate(() => {
    const set = chrome.storage.local.set.bind(chrome.storage.local);
    (globalThis as any).saveCalls = 0;
    chrome.storage.local.set = (async (...args: any[]) => {
      (globalThis as any).saveCalls++;
      await new Promise<void>(resolve => { (globalThis as any).releaseSave = resolve; });
      chrome.storage.local.set = set;
      return set(...args as [any]);
    }) as any;
  });
  await popup.evaluate("document.querySelector('#sitePauseBtn').click()");
  await expect.poll(() => worker.evaluate(() => typeof (globalThis as any).releaseSave)).toBe('function');
  expect(await popup.evaluate("document.querySelector('#sitePauseBtn').getAttribute('aria-disabled')")).toBe('true');
  await popup.evaluate("document.querySelector('#sitePauseBtn').click(); document.querySelector('#globalPauseBtn').click()");
  expect(await worker.evaluate(() => (globalThis as any).saveCalls)).toBe(1);
  await popup.close();
  await worker.evaluate(() => (globalThis as any).releaseSave());
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await page.bringToFront();
  const reopened = await openToolbar(extensionContext);
  expect(await reopened.evaluate("document.querySelector('#sitePauseBtn').textContent")).toBe('Resume on Gemini');
  expect(await reopened.evaluate("document.querySelector('#globalPauseBtn').textContent")).toBe('Pause everywhere');
  await reopened.close();
});
