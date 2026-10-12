export interface WallpaperSettings {
  imageDataUrl: string | null;
  fileName: string | null;
  opacity: number;
  blur: number;
  version: number;
}

const CURRENT_SETTINGS_VERSION = 1;

const DEFAULT_SETTINGS: WallpaperSettings = {
  imageDataUrl: null,
  fileName: null,
  opacity: 0.15,
  blur: 0,
  version: CURRENT_SETTINGS_VERSION
};

export function normalizeSettings(stored?: Partial<WallpaperSettings>): WallpaperSettings {
  const merged: WallpaperSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    version: CURRENT_SETTINGS_VERSION
  };

  if (typeof merged.opacity !== 'number' || !Number.isFinite(merged.opacity)) {
    merged.opacity = DEFAULT_SETTINGS.opacity;
  }

  if (typeof merged.blur !== 'number' || !Number.isFinite(merged.blur)) {
    merged.blur = DEFAULT_SETTINGS.blur;
  }

  merged.opacity = Math.max(0.05, Math.min(1, merged.opacity));
  merged.blur = Math.max(0, Math.min(20, merged.blur));

  if (typeof merged.imageDataUrl !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(merged.imageDataUrl)) {
    merged.imageDataUrl = DEFAULT_SETTINGS.imageDataUrl;
  }

  if (typeof merged.fileName !== 'string' && merged.fileName !== null) {
    merged.fileName = DEFAULT_SETTINGS.fileName;
  }

  return merged;
}

export async function getSettings(): Promise<WallpaperSettings> {
  const result = await chrome.storage.local.get('llm_wallpaper_settings');
  const stored = result.llm_wallpaper_settings as Partial<WallpaperSettings> | undefined;

  return normalizeSettings(stored);
}

export async function saveSettings(settings: Partial<WallpaperSettings>, signal?: AbortSignal): Promise<void> {
  // All settings tabs share this lock so read/merge/write cannot lose another save.
  await navigator.locks.request('llm_wallpaper_settings', { signal }, async () => {
    const current = await getSettings();
    const updated = normalizeSettings({
      ...current,
      ...settings,
      version: CURRENT_SETTINGS_VERSION
    });
    await chrome.storage.local.set({ llm_wallpaper_settings: updated });
  });
}
