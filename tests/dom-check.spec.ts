import { chromium, test as base, expect, type BrowserContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { WallpaperSettings } from '../src/utils/storage';

const authStatePath = resolve('playwright/.auth/storageState.json');
const hasAuthState = existsSync(authStatePath);
const browserChannel = process.env.PLAYWRIGHT_CHANNEL === 'chrome' ? 'chrome' : undefined;

const test = base.extend<{ extensionContext: BrowserContext }>({
  extensionContext: async ({}, use) => {
    const userDataDir = await mkdtemp(resolve(tmpdir(), 'llm-wallpapers-'));
    const extensionPath = resolve('dist');
    const authState = hasAuthState
      ? JSON.parse(await readFile(authStatePath, 'utf8')) as {
          cookies?: Parameters<BrowserContext['addCookies']>[0];
          origins?: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
        }
      : undefined;
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: browserChannel ?? 'chromium',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    if (authState?.cookies) await context.addCookies(authState.cookies);
    if (authState?.origins) {
      await context.addInitScript(({ origins }) => {
        const storage = origins.find((entry) => entry.origin === window.location.origin)?.localStorage;
        if (!storage) return;
        for (const entry of storage) window.localStorage.setItem(entry.name, entry.value);
      }, { origins: authState.origins });
    }

    await use(context);
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
});

test.describe.configure({ mode: 'serial' });

const TARGET_SITES = [
  {
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    authenticatedUrl: 'https://chatgpt.com',
    selector: 'main, [role="main"], #__next'
  },
  {
    name: 'Claude',
    url: 'https://claude.ai',
    authenticatedUrl: 'https://claude.ai/new',
    selector: 'fieldset, [role="main"]'
  },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    authenticatedUrl: 'https://gemini.google.com/app',
    selector: 'chat-app, .conversation-container'
  }
];

async function openSettings(context: BrowserContext) {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
  await expect(page.locator('#opacityInput')).toHaveValue('0.15');
  return page;
}

async function enableWallpaper(context: BrowserContext) {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  await worker.evaluate(() => chrome.storage.local.set({ llm_wallpaper_settings: {
    imageDataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    fileName: 'wallpaper.gif', opacity: 0.15, blur: 0, version: 1
  } }));
}

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
  await page.keyboard.press('Tab');
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 });
  await page.keyboard.press('Enter');
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'wallpaper.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64') });
  await expect(page.getByRole('status')).toHaveText('wallpaper.gif');
  await expect(page.getByRole('slider', { name: 'Opacity', exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Blur Radius', exact: true })).toBeVisible();
});

for (const site of TARGET_SITES) {
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
    await settings.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
    await expect(page.locator('link[data-llm-wallpaper-provider]')).toHaveCount(0);
    await page.locator('main').evaluate((main) => main.appendChild(document.createElement('div')));
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await page.reload();
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await expect(page.locator('#llm-wallpaper-overlay')).toHaveCount(0);
  });
}

for (const site of TARGET_SITES) {
  test(`Check DOM structural stability for ${site.name}`, async ({ page }) => {
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });
    const targetElement = page.locator(site.selector).first();
    
    // Assert that key containers exist
    await expect(targetElement).toBeVisible({ timeout: 10000 });
  });

  test(`Loads wallpaper UI for ${site.name}`, async ({ extensionContext }) => {
    await enableWallpaper(extensionContext);
    const page = await extensionContext.newPage();
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached({ timeout: 10000 });
    await expect(
      page.locator(`link[data-llm-wallpaper-provider="${site.name.toLowerCase()}"]`)
    ).toBeAttached({ timeout: 10000 });

    const overlay = page.locator('#llm-wallpaper-overlay');
    await expect(overlay).toHaveCSS('opacity', '0.15');
    await expect(overlay).toHaveCSS('filter', 'blur(0px)');
  });

  test(`Checks authenticated route for ${site.name}`, async ({ extensionContext }) => {
    test.skip(!hasAuthState, 'Provide playwright/.auth/storageState.json to run authenticated checks');

    await enableWallpaper(extensionContext);

    const page = await extensionContext.newPage();
    await page.goto(site.authenticatedUrl, { waitUntil: 'domcontentloaded' });

    await expect(page).not.toHaveURL(/\/login|\/signin|\/auth\//, { timeout: 10000 });
    await expect(page.locator(site.selector).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached({ timeout: 10000 });
  });
}
