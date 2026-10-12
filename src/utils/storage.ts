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

function migrateSettings(stored?: Partial<WallpaperSettings>): WallpaperSettings {
  const merged: WallpaperSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    version: CURRENT_SETTINGS_VERSION
  };

  if (typeof merged.opacity !== 'number' || Number.isNaN(merged.opacity)) {
    merged.opacity = DEFAULT_SETTINGS.opacity;
  }

  if (typeof merged.blur !== 'number' || Number.isNaN(merged.blur)) {
    merged.blur = DEFAULT_SETTINGS.blur;
  }

  if (typeof merged.imageDataUrl !== 'string' && merged.imageDataUrl !== null) {
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

  return migrateSettings(stored);
}

export async function saveSettings(settings: Partial<WallpaperSettings>): Promise<void> {
  // All settings tabs share this lock so read/merge/write cannot lose another save.
  await navigator.locks.request('llm_wallpaper_settings', async () => {
    const current = await getSettings();
    const updated: WallpaperSettings = {
      ...current,
      ...settings,
      version: CURRENT_SETTINGS_VERSION
    };
    await chrome.storage.local.set({ llm_wallpaper_settings: updated });
  });
}
