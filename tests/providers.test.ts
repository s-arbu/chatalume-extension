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
    value: { request: (_name: string, callback: () => Promise<void>) => callback() }
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

test('selects ChatGPT for ChatGPT subdomains', () => {
  const provider = getProvider(new URL('https://auth.chatgpt.com/'));

  expect(provider?.id).toBe('chatgpt');
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

test('keeps legacy wallpaper settings across version bumps by migrating them forward', async () => {
  const stored = {
    llm_wallpaper_settings: {
      imageDataUrl: 'data:image/png;base64,legacy',
      fileName: 'legacy.png',
      opacity: 0.4,
      blur: 6,
      version: 1
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
