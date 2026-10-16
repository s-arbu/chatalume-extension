import { openToolbar } from './toolbar-fixture';
import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';
import type { WallpaperSettings } from '../src/utils/storage';

const gifFile = { name: 'wallpaper.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64') };

test('Pause preserves the image and upload while paused stays paused', async ({ extensionContext }) => {
  await extensionContext.route('https://chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Conversation</main>' }));
  const settings = await openSettings(extensionContext);
  const page = await extensionContext.newPage();
  await page.goto('https://chatgpt.com');
  await settings.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await settings.getByRole('checkbox', { name: 'Enable wallpaper' }).uncheck();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await expect(page.locator('link[data-llm-wallpaper-provider]')).toHaveCount(0);
  await settings.locator('#imageInput').setInputFiles({ ...gifFile, name: 'paused.gif' });
  await expect(settings.locator('#fileNameDisplay')).toHaveText('paused.gif');
  await page.reload();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await settings.getByRole('checkbox', { name: 'Enable wallpaper' }).check();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /data:image\/gif/);
});

test('Reset effects preserves the selected image and paused state', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.locator('#fileNameDisplay')).toHaveText('wallpaper.gif');
  await page.getByRole('checkbox', { name: 'Enable wallpaper' }).uncheck();
  for (const [id, value] of [['opacityInput', '0.7'], ['blurInput', '9']]) {
    await page.locator(`#${id}`).evaluate((input: HTMLInputElement, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }, value);
  }
  await page.getByRole('button', { name: 'Reset effects', exact: true }).click();
  await expect(page.locator('#opacityInput')).toHaveValue('0.15');
  await expect(page.locator('#blurInput')).toHaveValue('0');
  await expect(page.getByRole('checkbox', { name: 'Enable wallpaper' })).not.toBeChecked();
  await expect(page.locator('#fileNameDisplay')).toHaveText('wallpaper.gif');
});

test('Readability blends the wallpaper without changing text and resets cleanly', async ({ extensionContext }) => {
  await extensionContext.route('https://chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main style="color: rgb(240, 240, 240)">Conversation</main>' }));
  const settings = await openSettings(extensionContext);
  const page = await extensionContext.newPage();
  await page.goto('https://chatgpt.com');
  await settings.locator('#imageInput').setInputFiles(gifFile);
  await settings.getByLabel('Blend strength').evaluate((input: HTMLInputElement) => { input.value = '0.5'; input.dispatchEvent(new Event('input')); });
  await settings.getByLabel('Blend tone').selectOption('light');
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /rgba\(255, 255, 255, 0.5\)/);
  await expect(page.locator('main')).toHaveCSS('color', 'rgb(240, 240, 240)');
  await settings.getByRole('button', { name: 'Reset effects', exact: true }).click();
  await expect(settings.getByLabel('Blend strength')).toHaveValue('0');
  await expect(settings.getByLabel('Blend tone')).toHaveValue('dark');
});

test('Placement controls only the image layer and reset restores cover and center', async ({ extensionContext }) => {
  await extensionContext.route('https://chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Conversation</main>' }));
  const settings = await openSettings(extensionContext);
  const page = await extensionContext.newPage();
  await page.goto('https://chatgpt.com');
  await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
  await settings.getByLabel('Image fit').selectOption('contain');
  for (const [label, value] of [['Horizontal position', '10'], ['Vertical position', '90']]) {
    await settings.getByLabel(label).evaluate((input: HTMLInputElement, value) => { input.value = value; input.dispatchEvent(new Event('input')); }, value);
  }
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-size', '100% 100%, contain');
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-position', '50% 50%, 10% 90%');
  await settings.getByRole('button', { name: 'Reset effects', exact: true }).click();
  await expect(settings.getByLabel('Image fit')).toHaveValue('cover');
  await expect(settings.getByLabel('Horizontal position')).toHaveValue('50');
  await expect(settings.getByLabel('Vertical position')).toHaveValue('50');
});

test('Provider overrides inherit, remain isolated, and respect global pause', async ({ extensionContext }) => {
  for (const url of ['https://chatgpt.com/**', 'https://claude.ai/**']) {
    await extensionContext.route(url, (route) => route.fulfill({ contentType: 'text/html', body: '<main>Conversation</main>' }));
  }
  const settings = await openSettings(extensionContext);
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  const chatgpt = await extensionContext.newPage(); await chatgpt.goto('https://chatgpt.com');
  const claude = await extensionContext.newPage(); await claude.goto('https://claude.ai');
  await settings.getByLabel('Settings scope').selectOption('chatgpt');
  await settings.getByLabel('Opacity', { exact: true }).evaluate((input: HTMLInputElement) => { input.value = '0.6'; input.dispatchEvent(new Event('input')); });
  await expect(chatgpt.locator('#llm-wallpaper-overlay')).toHaveCSS('opacity', '0.6');
  await expect(claude.locator('#llm-wallpaper-overlay')).toHaveCSS('opacity', '0.15');
  await settings.getByRole('button', { name: 'Use global settings', exact: true }).click();
  await expect(chatgpt.locator('#llm-wallpaper-overlay')).toHaveCSS('opacity', '0.15');
  await settings.getByLabel('Settings scope').selectOption('global');
  await settings.getByRole('checkbox', { name: 'Enable wallpaper' }).uncheck();
  await expect(chatgpt.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await expect(claude.locator('#llm-wallpaper-overlay')).toHaveCount(0);
});

test('Concurrent provider patches preserve independent nested edits', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  const results = await page.evaluate(async () => Promise.all([
    chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', providerId: 'chatgpt', patch: { opacity: 0.6 } }),
    chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', providerId: 'chatgpt', patch: { blur: 7 } }),
    chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', providerId: 'claude', patch: { opacity: 0.4 } })
  ]));
  expect(results.every((response) => response.ok)).toBe(true);
  const stored = await page.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings);
  expect((stored as any).providerOverrides).toEqual({ chatgpt: { opacity: 0.6, blur: 7 }, claude: { opacity: 0.4 } });
});

test('Offline presets retain the upload and Remove clears both sources', async ({ extensionContext }) => {
  await extensionContext.route('https://chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Conversation</main>' }));
  const settings = await openSettings(extensionContext);
  const page = await extensionContext.newPage();
  await page.goto('https://chatgpt.com');
  await settings.locator('#imageInput').setInputFiles(gifFile);
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await extensionContext.setOffline(true);
  await settings.getByRole('radio', { name: 'Dusk', exact: true }).check();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /wallpapers\/dusk.svg/);
  await expect(settings.getByRole('img', { name: 'Dusk', exact: true })).toBeVisible();
  expect(await settings.getByRole('img', { name: 'Dusk', exact: true }).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /wallpapers\/dusk.svg/);
  await settings.getByRole('radio', { name: 'Use my upload', exact: true }).check();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /data:image\/gif/);
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  await settings.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  const stored = await settings.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings);
  expect(stored.imageDataUrl).toBeNull();
  expect((stored as any).presetId).toBeNull();
});

test('Preview and save feedback follow committed changes in other settings tabs', async ({ extensionContext }) => {
  const first = await openSettings(extensionContext);
  const second = await openSettings(extensionContext);
  await first.locator('#imageInput').setInputFiles(gifFile);
  await expect(second.getByRole('img', { name: 'wallpaper.gif', exact: true })).toBeVisible();
  await first.getByRole('checkbox', { name: 'Enable wallpaper' }).uncheck();
  await expect(second.getByRole('checkbox', { name: 'Enable wallpaper' })).not.toBeChecked();
  await expect(first.getByRole('status', { name: 'Save status' })).toHaveText('Saved');
  await first.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
  await expect(second.locator('#wallpaperPreview')).toBeHidden();
});

test('Unavailable presets explain the fallback without losing the upload', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await page.evaluate(async () => {
    const stored = (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings;
    await chrome.storage.local.set({ llm_wallpaper_settings: { ...stored, presetId: 'missing' } });
  });
  await expect(page.getByRole('alert')).toContainText('Preset unavailable');
  await expect(page.getByRole('img', { name: 'wallpaper.gif', exact: true })).toBeVisible();
});

test('Rejected effect writes report errors without losing the selected wallpaper', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.locator('#fileNameDisplay')).toHaveText('wallpaper.gif');
  await page.evaluate(() => { chrome.runtime.sendMessage = (async () => { throw new Error('Storage unavailable'); }) as any; });
  await page.getByRole('checkbox', { name: 'Enable wallpaper' }).click();
  await expect(page.getByRole('alert')).toContainText('Storage unavailable');
  await expect(page.getByRole('status', { name: 'Save status' })).not.toHaveText('Saved');
  await expect(page.getByRole('img', { name: 'wallpaper.gif', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Enable wallpaper' })).toBeChecked();
});

test('Worker rejects unknown and malformed settings patches', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  const responses = await page.evaluate(async () => Promise.all([
    chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', patch: { version: 999 } }),
    chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', patch: [] })
  ]));
  expect(responses.every((response) => response.ok === false)).toBe(true);
  await expect(page.getByRole('checkbox', { name: 'Enable wallpaper' })).toBeChecked();
});

test('A rejected upload can retry the same file', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.evaluate(() => {
    const send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = (async (...args: any[]) => {
      chrome.runtime.sendMessage = send;
      throw new Error('Storage unavailable');
    }) as any;
  });
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('alert')).toContainText('Storage unavailable');
  await expect(page.locator('#imageInput')).toHaveValue('');
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Saved');
});

test('Actual toolbar popup changes persist and opens full settings', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext);
  const popup = await openToolbar(extensionContext);
  expect(await popup.evaluate("chrome.extension.getViews({ type: 'popup' }).includes(window)")).toBe(true);
  await popup.evaluate("document.querySelector('#enabledInput').click()");
  await expect.poll(() => popup.evaluate("document.querySelector('#saveStatus').textContent")).toBe('Saved');
  await popup.close();
  await expect(settings.getByRole('checkbox', { name: 'Enable wallpaper' })).not.toBeChecked();
  const reopened = await openToolbar(extensionContext);
  expect(await reopened.evaluate("document.querySelector('#enabledInput').checked")).toBe(false);
  await reopened.evaluate("document.querySelector('#manageWallpaperBtn').click()");
  await expect.poll(() => extensionContext.pages().filter((page) => page.url().endsWith('/popup.html')).length).toBeGreaterThan(0);
});

test('Closing the actual popup during a save does not lose its final change', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext);
  const popup = await openToolbar(extensionContext);
  const worker = extensionContext.serviceWorkers()[0];
  await worker.evaluate(() => {
    const set = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = (async (...args: any[]) => {
      await new Promise<void>((resolve) => { (globalThis as any).releaseSave = resolve; });
      return set(...args as [any]);
    }) as any;
  });
  await popup.evaluate("document.querySelector('#enabledInput').click()");
  await expect.poll(() => worker.evaluate(() => typeof (globalThis as any).releaseSave)).toBe('function');
  await expect(settings.getByRole('checkbox', { name: 'Enable wallpaper' })).toBeChecked();
  await popup.close();
  expect(await worker.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings.enabled)).toBe(true);
  await worker.evaluate(() => (globalThis as any).releaseSave());
  await expect(settings.getByRole('checkbox', { name: 'Enable wallpaper' })).not.toBeChecked();
});

test('Latest upload wins when an earlier image finishes processing later', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  const png = await page.evaluate(() => document.createElement('canvas').toDataURL('image/png').split(',')[1]);
  await page.evaluate(() => {
    const create = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (file: File) => {
      const bitmap = await create(file);
      if (file.name === 'slow.png') await new Promise<void>((resolve) => { (window as any).finishUpload = resolve; });
      return bitmap;
    }) as typeof createImageBitmap;
    const read = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function (blob) {
      if (blob.type === 'image/webp') this.addEventListener('loadend', () => { (window as any).oldConversionFinished = true; });
      read.call(this, blob);
    };
  });
  await page.locator('#imageInput').setInputFiles({ name: 'slow.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect.poll(() => page.evaluate(() => typeof (window as any).finishUpload)).toBe('function');
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await page.evaluate(() => (window as any).finishUpload());
  await expect.poll(() => page.evaluate(() => (window as any).oldConversionFinished)).toBe(true);
  await page.evaluate(() => navigator.locks.request('llm_wallpaper_settings', () => {}));
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  const settings = await page.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings);
  expect(settings.fileName).toBe('wallpaper.gif');
  expect(settings.imageDataUrl).toMatch(/^data:image\/gif/);
});

test('Removing a wallpaper cancels an in-flight upload', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  const png = await page.evaluate(() => document.createElement('canvas').toDataURL('image/png').split(',')[1]);
  await page.evaluate(() => {
    const create = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (file: File) => {
      const bitmap = await create(file);
      const close = bitmap.close.bind(bitmap);
      bitmap.close = () => { close(); (window as any).bitmapClosed = true; };
      await new Promise<void>((resolve) => { (window as any).finishUpload = resolve; });
      return bitmap;
    }) as typeof createImageBitmap;
  });
  await page.locator('#imageInput').setInputFiles({ name: 'slow.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect.poll(() => page.evaluate(() => typeof (window as any).finishUpload)).toBe('function');
  await page.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
  await page.evaluate(() => (window as any).finishUpload());
  await expect.poll(() => page.evaluate(() => (window as any).bitmapClosed)).toBe(true);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('No file chosen');
  const settings = await page.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings);
  expect(settings.imageDataUrl).toBeNull();
});

test('Failed uploads keep the previous wallpaper and explain the error', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  await page.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await page.locator('#imageInput').setInputFiles({ name: 'large.gif', mimeType: 'image/gif', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toContainText('10 MiB');
  const settings = await page.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings);
  expect(settings.fileName).toBe('wallpaper.gif');
  expect(settings.imageDataUrl).toMatch(/^data:image\/gif/);
});

test('Storage-change events normalize effects before applying them', async ({ extensionContext }) => {
  await extensionContext.route('https://chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Conversation</main>' }));
  const settings = await openSettings(extensionContext);
  const page = await extensionContext.newPage();
  await page.goto('https://chatgpt.com');
  await settings.locator('#imageInput').setInputFiles(gifFile);
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await settings.evaluate(async () => {
    const stored = (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings;
    await chrome.storage.local.set({ llm_wallpaper_settings: { ...stored, opacity: -5, blur: 100 } });
  });
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('opacity', '0.05');
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('filter', 'blur(20px)');
});

test('Authentication subdomains are left untouched', async ({ extensionContext }) => {
  await extensionContext.route('https://auth.chatgpt.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Sign in</main>' }));
  const settings = await openSettings(extensionContext);
  await settings.locator('#imageInput').setInputFiles(gifFile);
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  const page = await extensionContext.newPage();
  await page.goto('https://auth.chatgpt.com');
  await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  await expect(page.locator('link[data-llm-wallpaper-provider]')).toHaveCount(0);
});

test('Local: overlapping saves in two settings tabs preserve both changes', async ({ extensionContext }) => {
  const first = await openSettings(extensionContext);
  const second = await openSettings(extensionContext);
  for (const page of [first, second]) {
    await page.evaluate(() => {
      const get = chrome.storage.local.get.bind(chrome.storage.local);
      chrome.storage.local.get = (async (...args: any[]) => {
        const snapshot = await (get as any)(...args);
        await new Promise((resolve) => setTimeout(resolve, 150));
        return snapshot;
      }) as typeof chrome.storage.local.get;
    });
  }
  await Promise.all([
    first.locator('#opacityInput').evaluate((input: HTMLInputElement) => {
      input.value = '0.8';
      input.dispatchEvent(new Event('input'));
    }),
    second.locator('#blurInput').evaluate((input: HTMLInputElement) => {
      input.value = '12';
      input.dispatchEvent(new Event('input'));
    })
  ]);
  await expect.poll(() => first.evaluate(async () => {
    const { llm_wallpaper_settings: settings } = await chrome.storage.local.get<{ llm_wallpaper_settings?: WallpaperSettings }>('llm_wallpaper_settings');
    return { opacity: settings?.opacity, blur: settings?.blur };
  })).toEqual({ opacity: 0.8, blur: 12 });
});

test('Local: keyboard users can upload and identify the controls', async ({ extensionContext }) => {
  const page = await openSettings(extensionContext);
  const choose = page.getByRole('button', { name: 'Choose File', exact: true });
  for (let step = 0; step < 10; step++) {
    await page.keyboard.press('Tab');
    if (await choose.evaluate((button) => button === document.activeElement)) break;
  }
  await expect(choose).toBeFocused();
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 });
  await page.keyboard.press('Enter');
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'wallpaper.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64') });
  await expect(page.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
  await expect(page.getByRole('slider', { name: 'Opacity', exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Blur Radius', exact: true })).toBeVisible();
});

for (const site of TARGET_SITES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${site.name}: upload, adjust, reload, and navigate in ${colorScheme} mode`, async ({ extensionContext }, testInfo) => {
      await extensionContext.route(`${site.url}/**`, (route) => route.fulfill({
        contentType: 'text/html',
        body: `<html><head><style>
          :root { color-scheme: light dark; }
          body, main { background: light-dark(rgb(245,245,245), rgb(25,25,25)); color: light-dark(rgb(20,20,20), rgb(240,240,240)); }
          input, dialog { background: light-dark(white, rgb(40,40,40)); color: inherit; }
          main { min-height: 80vh; }
        </style></head><body><main><p>Readable conversation</p><input aria-label="Message"><button onclick="document.querySelector('dialog').showModal()">Open menu</button><dialog>Readable menu</dialog></main></body></html>`
      }));
      const settings = await openSettings(extensionContext);
      const page = await extensionContext.newPage();
      await page.emulateMedia({ colorScheme });
      await page.goto(site.url);
      await settings.locator('#imageInput').setInputFiles(gifFile);
      await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('wallpaper.gif');
      for (const [id, value] of [['opacityInput', '0.4'], ['blurInput', '6']]) {
        await settings.locator(`#${id}`).evaluate((input: HTMLInputElement, value) => {
          input.value = value;
          input.dispatchEvent(new Event('input'));
        }, value);
      }
      const overlay = page.locator('#llm-wallpaper-overlay');
      await expect(overlay).toHaveCSS('opacity', '0.4');
      await expect(overlay).toHaveCSS('filter', 'blur(6px)');
      await page.reload();
      await expect(overlay).toHaveCSS('background-image', /data:image\/gif/);
      await expect(overlay).toHaveCSS('opacity', '0.4');
      await expect(overlay).toHaveCSS('filter', 'blur(6px)');
      await page.evaluate(() => { history.pushState({}, '', '/conversation-test'); document.querySelector('main')!.appendChild(document.createElement('p')); });
      await expect(overlay).toHaveCount(1);
      await expect(page.getByText('Readable conversation', { exact: true })).toHaveCSS('color', colorScheme === 'light' ? 'rgb(20, 20, 20)' : 'rgb(240, 240, 240)');
      await page.getByRole('textbox', { name: 'Message' }).fill('Test message');
      await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('Test message');
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCSS('background-color', colorScheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(40, 40, 40)');
      await page.screenshot({ path: testInfo.outputPath(`${site.name}-${colorScheme}.png`) });
      await page.getByRole('dialog').evaluate((dialog: HTMLDialogElement) => dialog.close());
      await settings.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
      await expect(overlay).toHaveCount(0);
    });
  }
  test(`Local: ${site.name} restores native styling after removal`, async ({ extensionContext }) => {
    await extensionContext.route(`${site.url}/**`, (route) => route.fulfill({
      contentType: 'text/html',
      body: '<html><head><style>body, main { background-color: rgb(12, 34, 56); }</style></head><body><main>Conversation</main></body></html>'
    }));
    const settings = await openSettings(extensionContext);
    const page = await extensionContext.newPage();
    await page.goto(site.url);
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
    await settings.locator('#imageInput').setInputFiles({ name: 'wallpaper.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64') });
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /data:image\/gif/);
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    // Active wallpapers still recover when a provider replaces injected nodes.
    await page.locator('#llm-wallpaper-overlay').evaluate((overlay) => overlay.remove());
    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
    await settings.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
    await expect(page.locator('link[data-llm-wallpaper-provider]')).toHaveCount(0);
    await page.locator('main').evaluate((main) => main.appendChild(document.createElement('div')));
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await page.reload();
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  });
}

