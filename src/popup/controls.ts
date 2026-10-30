import { DEFAULT_EFFECTS, getEffectiveSettings, getSettings, normalizeSettings, type ReadingComfortMode, type WallpaperSettings } from '../utils/storage';
import { PROVIDER_IDS, type ProviderId } from '../providers/types';
import { resolveWallpaper } from '../utils/wallpaperSource';

const fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLDivElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement | null;
const uploadError = document.getElementById('uploadError') as HTMLParagraphElement;
const saveStatus = document.getElementById('saveStatus') as HTMLParagraphElement;
const preview = document.getElementById('wallpaperPreview') as HTMLImageElement;
const opacityInput = document.getElementById('opacityInput') as HTMLInputElement;
const blurInput = document.getElementById('blurInput') as HTMLInputElement;
const enabledInput = document.getElementById('enabledInput') as HTMLInputElement;
const dimmingInput = document.getElementById('dimmingInput') as HTMLInputElement;
const dimToneInput = document.getElementById('dimToneInput') as HTMLSelectElement;
const fitInput = document.getElementById('fitInput') as HTMLSelectElement;
const showChatControlsInput = document.getElementById('showChatControlsInput') as HTMLInputElement | null;
const readingComfortInput = document.getElementById('readingComfortInput') as HTMLSelectElement | null;
let savedSettings = normalizeSettings();
const pending = new Map<string, number>();

const scopeInput = document.getElementById('providerScope') as HTMLSelectElement | null;
function selectedProvider(): ProviderId | undefined {
  const value = scopeInput?.value as ProviderId;
  return PROVIDER_IDS.includes(value) ? value : undefined;
}
function fieldPending(field: string) { return pending.has(`${selectedProvider() || 'global'}:${field}`); }

function updateLiveValues() {
  document.getElementById('opacityVal')!.textContent = `${Math.round(Number(opacityInput.value) * 100)}%`;
  document.getElementById('blurVal')!.textContent = `${blurInput.value}px`;
  document.getElementById('dimmingVal')!.textContent = `${Math.round(Number(dimmingInput.value) * 100)}%`;
  for (const field of ['positionX', 'positionY'] as const) {
    document.getElementById(`${field}Val`)!.textContent = `${(document.getElementById(`${field}Input`) as HTMLInputElement).value}%`;
  }
}

export function renderSettings(settings: WallpaperSettings) {
  savedSettings = settings;
  if (showChatControlsInput && !pending.has('global:showChatControls')) showChatControlsInput.checked = settings.showChatControls;
  const provider = selectedProvider();
  const effects = provider ? getEffectiveSettings(settings, provider) : settings;
  if (readingComfortInput && !fieldPending('readingComfort')) readingComfortInput.value = effects.readingComfort;
  if (!fieldPending('opacity')) opacityInput.value = String(effects.opacity);
  if (!fieldPending('blur')) blurInput.value = String(effects.blur);
  if (!fieldPending('enabled')) enabledInput.checked = provider ? settings.providerOverrides[provider]?.enabled ?? true : settings.enabled;
  if (!fieldPending('dimming')) dimmingInput.value = String(effects.dimming);
  if (!fieldPending('dimTone')) dimToneInput.value = effects.dimTone;
  if (!fieldPending('fit')) fitInput.value = effects.fit;
  for (const field of ['positionX', 'positionY'] as const) {
    if (!fieldPending(field)) (document.getElementById(`${field}Input`) as HTMLInputElement).value = String(effects[field]);
  }
  updateLiveValues();
  document.getElementById('resetEffectsBtn')!.textContent = provider ? 'Reset provider effects' : 'Reset effects';
  const inherit = document.getElementById('inheritBtn');
  if (inherit) inherit.hidden = !provider;
  const notice = document.getElementById('scopeNotice');
  if (notice) notice.textContent = provider ? (!settings.enabled ? 'All providers are paused. Enable wallpaper under All providers to resume.' : 'Wallpaper source is shared. These effects apply only to the selected provider.') : 'Wallpaper source and these defaults apply to all providers.';
  const source = resolveWallpaper(settings);
  preview.hidden = !source;
  if (source) {
    preview.src = source.url;
    preview.alt = source.label;
  } else preview.removeAttribute('src');
  fileNameDisplay.textContent = source?.label || 'No file chosen';
  if (resetBtn) resetBtn.style.display = source || settings.imageDataUrl ? 'block' : 'none';
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="wallpaperSource"]')) {
    radio.checked = radio.value === (settings.presetId || 'upload');
    if (radio.value === 'upload') radio.disabled = !settings.imageDataUrl;
  }
}

function renderStoredSettings(stored?: Partial<WallpaperSettings>) {
  const settings = normalizeSettings(stored);
  renderSettings(settings);
  if (stored?.presetId && !settings.presetId) {
    uploadError.textContent = `Preset unavailable. ${settings.imageDataUrl ? 'Using your saved upload.' : 'Choose another wallpaper.'}`;
    uploadError.hidden = false;
  }
}

export async function persistSettings(patch: Partial<WallpaperSettings> | null, signal?: AbortSignal, providerId?: ProviderId): Promise<boolean> {
  const keys = Object.keys(patch || { inherit: true }).map((key) => `${providerId || 'global'}:${key}`);
  for (const key of keys) pending.set(key, (pending.get(key) || 0) + 1);
  saveStatus.textContent = 'Saving...';
  uploadError.hidden = true;
  let success = false;
  try {
    if (signal?.aborted) return false;
    const response = await chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', patch, ...(providerId ? { providerId } : {}) });
    if (!response?.ok) throw new Error(response?.error || 'Could not save settings. Please try again.');
    savedSettings = await getSettings();
    success = true;
    return true;
  } catch (error) {
    if (!signal?.aborted) {
      uploadError.textContent = error instanceof Error ? error.message : 'Could not save. Please try again.';
      uploadError.hidden = false;
    }
    return false;
  } finally {
    for (const key of keys) {
      const count = pending.get(key)! - 1;
      if (count) pending.set(key, count);
      else pending.delete(key);
    }
    renderSettings(savedSettings);
    if (!pending.size) saveStatus.textContent = success ? 'Saved' : 'Not saved';
  }
}

function persistEffects(patch: Partial<WallpaperSettings>) { return persistSettings(patch, undefined, selectedProvider()); }

export async function bindWallpaperControls(): Promise<void> {
  showChatControlsInput?.addEventListener('change', () => { void persistSettings({ showChatControls: showChatControlsInput.checked }); });
  readingComfortInput?.addEventListener('change', () => { void persistEffects({ readingComfort: readingComfortInput.value as ReadingComfortMode }); });
  scopeInput?.addEventListener('change', () => renderSettings(savedSettings));
  document.getElementById('inheritBtn')?.addEventListener('click', () => { const provider = selectedProvider(); if (provider) void persistSettings(null, undefined, provider); });
  opacityInput.addEventListener('input', () => { updateLiveValues(); void persistEffects({ opacity: Number(opacityInput.value) }); });
  blurInput.addEventListener('input', () => { updateLiveValues(); void persistEffects({ blur: Number(blurInput.value) }); });
  enabledInput.addEventListener('change', () => { void persistEffects({ enabled: enabledInput.checked }); });
  dimmingInput.addEventListener('input', () => { updateLiveValues(); void persistEffects({ dimming: Number(dimmingInput.value) }); });
  dimToneInput.addEventListener('change', () => { void persistEffects({ dimTone: dimToneInput.value as WallpaperSettings['dimTone'] }); });
  fitInput.addEventListener('change', () => { void persistEffects({ fit: fitInput.value as WallpaperSettings['fit'] }); });
  for (const field of ['positionX', 'positionY'] as const) {
    const input = document.getElementById(`${field}Input`) as HTMLInputElement;
    input.addEventListener('input', () => { updateLiveValues(); void persistEffects({ [field]: Number(input.value) }); });
  }
  document.getElementById('resetEffectsBtn')!.addEventListener('click', () => { void persistEffects(DEFAULT_EFFECTS); });
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.llm_wallpaper_settings) renderStoredSettings(changes.llm_wallpaper_settings.newValue as Partial<WallpaperSettings> | undefined);
  });
  await chrome.storage.local.get('llm_wallpaper_settings').then((result) => renderStoredSettings(result.llm_wallpaper_settings as Partial<WallpaperSettings> | undefined)).catch((error) => {
    uploadError.textContent = `Could not load settings: ${error instanceof Error ? error.message : 'Please try again.'}`;
    uploadError.hidden = false;
  });
}
