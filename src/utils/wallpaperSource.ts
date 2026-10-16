import { WALLPAPER_PRESETS } from '../wallpapers/presets';
import type { WallpaperSettings } from './storage';

export function resolveWallpaper(settings: WallpaperSettings): { url: string; label: string } | null {
  const preset = WALLPAPER_PRESETS.find((item) => item.id === settings.presetId);
  if (preset) return { url: chrome.runtime.getURL(preset.path), label: preset.title };
  if (settings.imageDataUrl) return { url: settings.imageDataUrl, label: settings.fileName || 'Selected wallpaper' };
  return null;
}
