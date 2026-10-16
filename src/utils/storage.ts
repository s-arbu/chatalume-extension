import { WALLPAPER_PRESETS } from '../wallpapers/presets';
import { PROVIDER_IDS, type ProviderId } from '../providers/types';

export type ProviderOverrides = Partial<Pick<WallpaperSettings, 'enabled' | keyof typeof DEFAULT_EFFECTS>>;

export interface WallpaperSettings {
  imageDataUrl: string | null;
  fileName: string | null;
  opacity: number;
  blur: number;
  version: number;
  enabled: boolean;
  dimming: number;
  dimTone: 'dark' | 'light';
  presetId: string | null;
  fit: 'cover' | 'contain';
  positionX: number;
  positionY: number;
  providerOverrides: Partial<Record<ProviderId, ProviderOverrides>>;
}

const CURRENT_SETTINGS_VERSION = 6;

export const DEFAULT_EFFECTS = { opacity: 0.15, blur: 0, dimming: 0, dimTone: 'dark' as const, fit: 'cover' as const, positionX: 50, positionY: 50 };

const DEFAULT_SETTINGS: WallpaperSettings = {
  imageDataUrl: null,
  fileName: null,
  ...DEFAULT_EFFECTS,
  enabled: true,
  presetId: null,
  providerOverrides: {},
  version: CURRENT_SETTINGS_VERSION
};

function normalizeProviderOverride(value: unknown): ProviderOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: ProviderOverrides = {};
  const limits = { opacity: [0.05, 1], blur: [0, 20], dimming: [0, 1], positionX: [0, 100], positionY: [0, 100] } as const;
  for (const field of Object.keys(limits) as Array<keyof typeof limits>) {
    const number = raw[field];
    if (typeof number === 'number' && Number.isFinite(number)) {
      const clamped = Math.max(limits[field][0], Math.min(limits[field][1], number));
      result[field] = field.startsWith('position') ? Math.round(clamped) : clamped;
    }
  }
  if (typeof raw.enabled === 'boolean') result.enabled = raw.enabled;
  if (raw.dimTone === 'dark' || raw.dimTone === 'light') result.dimTone = raw.dimTone;
  if (raw.fit === 'cover' || raw.fit === 'contain') result.fit = raw.fit;
  return result;
}

export function normalizeSettings(stored?: Partial<WallpaperSettings>): WallpaperSettings {
  const merged: WallpaperSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    version: CURRENT_SETTINGS_VERSION
  };
  if (typeof merged.enabled !== 'boolean') merged.enabled = true;

  if (typeof merged.opacity !== 'number' || !Number.isFinite(merged.opacity)) {
    merged.opacity = DEFAULT_SETTINGS.opacity;
  }

  if (typeof merged.blur !== 'number' || !Number.isFinite(merged.blur)) {
    merged.blur = DEFAULT_SETTINGS.blur;
  }

  merged.opacity = Math.max(0.05, Math.min(1, merged.opacity));
  merged.blur = Math.max(0, Math.min(20, merged.blur));
  merged.dimming = typeof merged.dimming === 'number' && Number.isFinite(merged.dimming) ? Math.max(0, Math.min(1, merged.dimming)) : 0;
  if (merged.dimTone !== 'dark' && merged.dimTone !== 'light') merged.dimTone = 'dark';
  if (!WALLPAPER_PRESETS.some((preset) => preset.id === merged.presetId)) merged.presetId = null;
  if (merged.fit !== 'cover' && merged.fit !== 'contain') merged.fit = 'cover';
  for (const field of ['positionX', 'positionY'] as const) {
    merged[field] = typeof merged[field] === 'number' && Number.isFinite(merged[field]) ? Math.round(Math.max(0, Math.min(100, merged[field]))) : 50;
  }

  if (typeof merged.imageDataUrl !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(merged.imageDataUrl)) {
    merged.imageDataUrl = DEFAULT_SETTINGS.imageDataUrl;
  }

  if (typeof merged.fileName !== 'string' && merged.fileName !== null) {
    merged.fileName = DEFAULT_SETTINGS.fileName;
  }

  const storedOverrides = merged.providerOverrides;
  merged.providerOverrides = {};
  for (const id of PROVIDER_IDS) {
    const override = normalizeProviderOverride(storedOverrides?.[id]);
    if (Object.keys(override).length) merged.providerOverrides[id] = override;
  }

  return merged;
}

export function getEffectiveSettings(settings: WallpaperSettings, providerId: ProviderId): WallpaperSettings {
  const override = settings.providerOverrides[providerId];
  return { ...settings, ...override, enabled: settings.enabled && override?.enabled !== false };
}

export async function getSettings(): Promise<WallpaperSettings> {
  const result = await chrome.storage.local.get('llm_wallpaper_settings');
  const stored = result.llm_wallpaper_settings as Partial<WallpaperSettings> | undefined;

  return normalizeSettings(stored);
}

async function updateStoredSettings(updater: (current: WallpaperSettings) => WallpaperSettings, signal?: AbortSignal): Promise<void> {
  // All settings tabs share this lock so read/merge/write cannot lose another save.
  await navigator.locks.request('llm_wallpaper_settings', { signal }, async () => {
    const result = await chrome.storage.local.get('llm_wallpaper_settings');
    const stored = result.llm_wallpaper_settings as Partial<WallpaperSettings> | undefined;
    if (typeof stored?.version === 'number' && stored.version > CURRENT_SETTINGS_VERSION) throw new Error('Settings belong to a newer extension. Update before editing.');
    if (signal?.aborted) return;
    const updated = normalizeSettings(updater(normalizeSettings(stored)));
    await chrome.storage.local.set({ llm_wallpaper_settings: updated });
  });
}

export async function saveSettings(settings: Partial<WallpaperSettings>, signal?: AbortSignal): Promise<void> {
  await updateStoredSettings((current) => ({ ...current, ...settings }), signal);
}

export async function saveProviderSettings(providerId: ProviderId, patch: ProviderOverrides | null): Promise<void> {
  if (!PROVIDER_IDS.includes(providerId)) throw new Error('Unknown provider.');
  if (patch && Object.keys(patch).some((key) => key !== 'enabled' && !Object.hasOwn(DEFAULT_EFFECTS, key))) throw new Error('Only provider effects can be overridden.');
  await updateStoredSettings((current) => {
    const providerOverrides = { ...current.providerOverrides };
    if (patch === null) delete providerOverrides[providerId];
    else providerOverrides[providerId] = normalizeProviderOverride({ ...providerOverrides[providerId], ...patch });
    return { ...current, providerOverrides };
  });
}
