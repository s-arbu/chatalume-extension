import { chromium, test as base, expect, type BrowserContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const authStatePath = resolve('playwright/.auth/storageState.json');
export const hasAuthState = existsSync(authStatePath);
const browserChannel = process.env.PLAYWRIGHT_CHANNEL === 'chrome' ? 'chrome' : undefined;

export const test = base.extend<{ extensionContext: BrowserContext }>({
  extensionContext: async ({}, use, testInfo) => {
    const userDataDir = await mkdtemp(resolve(tmpdir(), 'llm-wallpapers-'));
    const extensionPath = resolve('dist');
    const authState = hasAuthState && testInfo.file.endsWith('dom-check.spec.ts')
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

export { expect };

export const TARGET_SITES = [
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

export async function openSettings(context: BrowserContext) {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
  await expect(page.locator('#opacityInput')).toHaveValue('0.15');
  return page;
}

export async function enableWallpaper(context: BrowserContext) {
  const page = await openSettings(context);
  const response = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', patch: {
    imageDataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    fileName: 'wallpaper.gif', opacity: 0.15, blur: 0, enabled: true
  } }));
  expect(response.ok).toBe(true);
  await page.close();
}

