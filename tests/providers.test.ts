/// <reference types="bun" />

import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, expect, test } from 'bun:test';
import { getProvider } from '../src/providers';
import { getSettings, saveSettings } from '../src/utils/storage';
import { compressImageToDataUrl } from '../src/utils/imageCompressor';
import { WALLPAPER_PRESETS } from '../src/wallpapers/presets';
import * as settingsStore from '../src/utils/storage';

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
  expect(settings.version).toBe(6);

  await saveSettings({ opacity: 0.9 });

  expect(stored.llm_wallpaper_settings.version).toBe(6);
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

test('legacy settings remain enabled without losing the image', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: {
    imageDataUrl: 'data:image/png;base64,legacy', fileName: 'legacy.png', opacity: 0.4, blur: 6, version: 1
  } })) as any;
  expect(await getSettings()).toMatchObject({ enabled: true, imageDataUrl: 'data:image/png;base64,legacy', fileName: 'legacy.png', opacity: 0.4, blur: 6, version: 6 });
});

test('normalizes settings before saving', async () => {
  let stored: any;
  globalThis.chrome.storage.local.set = (async (value: any) => { stored = value.llm_wallpaper_settings; }) as any;
  await saveSettings({ opacity: -1, blur: Infinity, imageDataUrl: 'not an image' });
  expect(stored).toMatchObject({ opacity: 0.05, blur: 0, imageDataUrl: null });
});

test('readability defaults preserve existing settings and clamp invalid input', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { dimming: 8, dimTone: 'unknown' } })) as any;
  expect(await getSettings()).toMatchObject({ dimming: 1, dimTone: 'dark' });
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { dimming: Infinity } })) as any;
  expect(await getSettings()).toMatchObject({ dimming: 0, dimTone: 'dark' });
});

test('unknown presets fall back to the retained custom upload', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { presetId: 'missing', imageDataUrl: 'data:image/png;base64,legacy', fileName: 'legacy.png' } })) as any;
  expect(await getSettings()).toMatchObject({ presetId: null, imageDataUrl: 'data:image/png;base64,legacy', fileName: 'legacy.png' });
});

test('placement normalizes fit and finite position limits', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { fit: 'stretch', positionX: -10, positionY: 150 } })) as any;
  expect(await getSettings()).toMatchObject({ fit: 'cover', positionX: 0, positionY: 100 });
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { positionX: Infinity, positionY: NaN } })) as any;
  expect(await getSettings()).toMatchObject({ fit: 'cover', positionX: 50, positionY: 50 });
});

test('provider overrides inherit invalid values and cannot replace the source', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: {
    enabled: true, opacity: 0.7, imageDataUrl: 'data:image/png;base64,legacy',
    providerOverrides: { chatgpt: { opacity: Infinity, blur: 8, imageDataUrl: 'bad' }, evil: { enabled: false } }
  } })) as any;
  const settings = await getSettings();
  expect((settingsStore as any).getEffectiveSettings?.(settings, 'chatgpt')).toMatchObject({ opacity: 0.7, blur: 8, imageDataUrl: 'data:image/png;base64,legacy' });
  expect((settings as any).providerOverrides).toEqual({ chatgpt: { blur: 8 } });
  expect((settingsStore as any).getEffectiveSettings?.({ ...settings, enabled: false }, 'chatgpt').enabled).toBe(false);
});

test('future settings versions are never silently overwritten', async () => {
  globalThis.chrome.storage.local.get = (async () => ({ llm_wallpaper_settings: { version: 99, imageDataUrl: 'data:image/png;base64,legacy' } })) as any;
  let wrote = false;
  globalThis.chrome.storage.local.set = (async () => { wrote = true; }) as any;
  await expect(saveSettings({ opacity: 0.5 })).rejects.toThrow('newer');
  expect(wrote).toBe(false);
});

test('bundled preset assets are self-contained and script-free', () => {
  for (const preset of WALLPAPER_PRESETS) {
    const svg = readFileSync(new URL(`../public/${preset.path}`, import.meta.url), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/<(?:script|foreignObject)\b|(?:href|src)=["'](?:https?:|\/\/)/i);
  }
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
