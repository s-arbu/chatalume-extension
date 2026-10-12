/// <reference types="bun" />

import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, expect, test } from 'bun:test';
import { getProvider } from '../src/providers';
import { getSettings, saveSettings } from '../src/utils/storage';
import { compressImageToDataUrl } from '../src/utils/imageCompressor';

const originalChrome = globalThis.chrome;
const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');

beforeEach(() => {
  // Bun has no Web Locks; cross-tab serialization is tested in Chromium.
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: (_name: string, _options: LockOptions, callback: () => Promise<void>) => callback() }
  });
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({}) as any,
        set: async () => undefined,
      }
    }
  } as any;
});

afterAll(() => {
  globalThis.chrome = originalChrome;
  if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
  else Reflect.deleteProperty(navigator, 'locks');
});

const claudeStylesheet = readFileSync(new URL('../public/providers/claude.css', import.meta.url), 'utf8');

test('selects ChatGPT for chatgpt.com pages', () => {
  const provider = getProvider(new URL('https://chatgpt.com/'));

  expect(provider?.id).toBe('chatgpt');
});

test('does not select ChatGPT authentication subdomains', () => {
  const provider = getProvider(new URL('https://auth.chatgpt.com/'));

  expect(provider).toBeUndefined();
});

test('does not select ChatGPT for lookalike domains', () => {
  const provider = getProvider(new URL('https://chatgpt.com.example.com/'));

  expect(provider).toBeUndefined();
});

test('selects Claude for claude.ai pages', () => {
  const provider = getProvider(new URL('https://claude.ai/'));

  expect(provider?.id).toBe('claude');
});

test('does not select Claude for lookalike domains', () => {
  const provider = getProvider(new URL('https://claude.ai.example.com/'));

  expect(provider).toBeUndefined();
});

test('Claude transparency rules only target the requested layers', () => {
  expect(claudeStylesheet).toContain('#root');
  expect(claudeStylesheet).toContain(':where([data-cds-dock-masked]) .in-data-cds-dock-masked\\:bg-page');
  expect(claudeStylesheet).toContain('.bg-surface-1');
  expect(claudeStylesheet).toContain('.bg-page');
  expect(claudeStylesheet).toContain('.page-fade-b');
  expect(claudeStylesheet).toContain('background-image: none !important');
  expect(claudeStylesheet).toContain('background-color: transparent !important');
  expect(claudeStylesheet).not.toContain('--cds-surface-1: transparent !important');
  expect(claudeStylesheet).not.toContain('--cds-surface-3: transparent !important');
  expect(claudeStylesheet).not.toContain('[class*="bg-bg-"]');
  expect(claudeStylesheet).not.toContain('.bg-surface-3');
});

test('normalizes a legacy settings version without losing the wallpaper', async () => {
  const stored = {
    llm_wallpaper_settings: {
      imageDataUrl: 'data:image/png;base64,legacy',
      fileName: 'legacy.png',
      opacity: 0.4,
      blur: 6,
      version: 0
    }
  };

  globalThis.chrome = {
    storage: {
      local: {
        get: async () => stored,
        set: async (value: any) => {
          Object.assign(stored, value);
        }
      }
    }
  } as any;

  const settings = await getSettings();

  expect(settings.imageDataUrl).toBe('data:image/png;base64,legacy');
  expect(settings.fileName).toBe('legacy.png');
  expect(settings.opacity).toBe(0.4);
  expect(settings.blur).toBe(6);
  expect(settings.version).toBe(1);

  await saveSettings({ opacity: 0.9 });

  expect(stored.llm_wallpaper_settings.version).toBe(1);
  expect(stored.llm_wallpaper_settings.opacity).toBe(0.9);
});

test('clamps stored effects and falls back for non-finite values', async () => {
  let stored: any = { opacity: -2, blur: 100 };
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: stored })) as any;
  expect(await getSettings()).toMatchObject({ opacity: 0.05, blur: 20 });
  stored = { opacity: Infinity, blur: NaN };
  expect(await getSettings()).toMatchObject({ opacity: 0.15, blur: 0 });
  stored = { opacity: 5, blur: -10, imageDataUrl: 'https://example.com/image.png' };
  expect(await getSettings()).toMatchObject({ opacity: 1, blur: 0, imageDataUrl: null });
});

test('normalizes settings before saving', async () => {
  let stored: any;
  globalThis.chrome.storage.local.set = (async (value: any) => { stored = value.llm_wallpaper_settings; }) as any;
  await saveSettings({ opacity: -1, blur: Infinity, imageDataUrl: 'not an image' });
  expect(stored).toMatchObject({ opacity: 0.05, blur: 0, imageDataUrl: null });
});

test('rejects oversized GIF uploads before reading them', async () => {
  const gif = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.gif', { type: 'image/gif' });
  await expect(compressImageToDataUrl(gif)).rejects.toThrow('10 MiB');
});

test('rejects files without an image MIME type', async () => {
  await expect(compressImageToDataUrl(new File(['text'], 'fake.gif', { type: 'text/plain' }))).rejects.toThrow('image file');
});

test('closes the bitmap when image encoding fails', async () => {
  const originalBitmap = globalThis.createImageBitmap;
  const originalCanvas = globalThis.OffscreenCanvas;
  let closed = false;
  globalThis.createImageBitmap = (async () => ({ width: 10, height: 10, close: () => { closed = true; } })) as any;
  globalThis.OffscreenCanvas = class {
    getContext() { return { drawImage() {} }; }
    async convertToBlob() { throw new Error('Encoding failed'); }
  } as any;
  try {
    await expect(compressImageToDataUrl(new File(['image'], 'image.png', { type: 'image/png' }))).rejects.toThrow('Encoding failed');
    expect(closed).toBe(true);
  } finally {
    globalThis.createImageBitmap = originalBitmap;
    globalThis.OffscreenCanvas = originalCanvas;
  }
});

test('preserves animated GIFs without converting them to webp', async () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  globalThis.createImageBitmap = (() => {
    throw new Error('GIF uploads should skip bitmap conversion');
  }) as typeof createImageBitmap;

  try {
    const gif = new File(['GIF89a'], 'animated.gif', { type: 'image/gif' });
    const dataUrl = await compressImageToDataUrl(gif);

    expect(dataUrl).toStartWith('data:image/gif');
  } finally {
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }
});
