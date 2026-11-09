import { getProvider } from '../providers';
import type { ProviderId } from '../providers/types';
import { getEffectiveSettings, getSettings, normalizeSettings, type ReadingComfortMode, type WallpaperSettings } from '../utils/storage';
import { resolveWallpaper } from '../utils/wallpaperSource';
import { motionPreference, presentWallpaper } from '../utils/wallpaperPresentation';

const sitePause = document.getElementById('sitePauseBtn') as HTMLButtonElement;
const globalPause = document.getElementById('globalPauseBtn') as HTMLButtonElement;
const comfort = document.getElementById('readingComfortInput') as HTMLSelectElement;
const manage = document.getElementById('manageWallpaperBtn') as HTMLButtonElement;
const errorNotice = document.getElementById('uploadError')!;
const status = document.getElementById('saveStatus')!;
const preview = document.getElementById('wallpaperPreview') as HTMLImageElement;
let providerId: ProviderId | undefined;
let saved: WallpaperSettings | undefined;
let busy = false;
let previewVersion = 0;
const names = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' };

function render(settings: WallpaperSettings) {
  saved = settings;
  const source = resolveWallpaper(settings);
  const name = providerId && names[providerId];
  const effects = providerId ? getEffectiveSettings(settings, providerId) : settings;
  document.getElementById('providerName')!.textContent = name || 'Open a supported chat';
  document.getElementById('siteActions')!.hidden = !providerId;
  document.getElementById('comfortControls')!.hidden = !providerId || !source;
  document.getElementById('contextNotice')!.textContent = !providerId ? 'Works on ChatGPT, Claude, and Gemini. Open one to control this site.'
    : !source ? `Choose a wallpaper to personalize ${name}. Your image is shared across supported chats.`
    : !settings.enabled ? 'Wallpaper is paused everywhere. Resume everywhere to use site controls.'
    : effects.enabled ? `Wallpaper is on for ${name}. Other sites keep their settings.`
    : `Wallpaper is paused on ${name}. Other sites keep their settings.`;
  sitePause.textContent = `${providerId && (settings.providerOverrides[providerId]?.enabled ?? true) ? 'Pause' : 'Resume'} on ${name}`;
  sitePause.disabled = !source || !settings.enabled;
  globalPause.textContent = settings.enabled ? 'Pause everywhere' : 'Resume everywhere';
  globalPause.disabled = !source;
  for (const button of [sitePause, globalPause, manage]) button.setAttribute('aria-disabled', String(busy || button.disabled));
  comfort.disabled = !providerId || !source;
  comfort.setAttribute('aria-disabled', String(busy || comfort.disabled));
  comfort.value = effects.readingComfort;
  manage.textContent = source ? 'Edit wallpaper' : 'Choose wallpaper';
  document.getElementById('fileNameDisplay')!.textContent = source?.label || 'No wallpaper selected';
  const version = ++previewVersion;
  preview.hidden = true;
  preview.removeAttribute('src');
  if (source) void presentWallpaper(source.url, settings.allowAnimations, !effects.enabled).then(url => {
    if (version !== previewVersion) return;
    preview.alt = source.label; preview.src = url; preview.hidden = false;
  }).catch(() => {
    if (version !== previewVersion) return;
    errorNotice.textContent = 'Could not show the wallpaper preview. Open the editor to choose another image.';
    errorNotice.hidden = false;
  });
}

async function save(patch: Partial<WallpaperSettings>, scope?: ProviderId) {
  if (busy || !saved) return;
  busy = true; errorNotice.hidden = true; status.textContent = 'Saving…'; render(saved);
  try {
    const response = await chrome.runtime.sendMessage({ type: 'save-wallpaper-settings', patch, ...(scope ? { providerId: scope } : {}) });
    if (!response?.ok) throw new Error(response?.error || 'Could not save. Please try again.');
    saved = await getSettings(); status.textContent = 'Saved';
  } catch (error) {
    errorNotice.textContent = error instanceof Error ? error.message : 'Could not save. Please try again.';
    errorNotice.hidden = false; status.textContent = 'Not saved';
  } finally { busy = false; render(saved); }
}

sitePause.addEventListener('click', () => {
  if (providerId && saved && !sitePause.disabled) void save({ enabled: !(saved.providerOverrides[providerId]?.enabled ?? true) }, providerId);
});
globalPause.addEventListener('click', () => { if (saved && !globalPause.disabled) void save({ enabled: !saved.enabled }); });
comfort.addEventListener('change', () => {
  if (busy || !providerId || comfort.disabled) { if (saved) render(saved); return; }
  void save({ readingComfort: comfort.value as ReadingComfortMode }, providerId);
});
comfort.addEventListener('click', event => { if (busy) event.preventDefault(); });
manage.addEventListener('click', async () => {
  if (busy) return;
  errorNotice.hidden = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'open-wallpaper-settings', ...(providerId ? { providerId } : {}) });
    if (!response?.ok) throw new Error(response?.error || 'Could not open settings.');
  } catch (error) {
    errorNotice.textContent = error instanceof Error ? error.message : 'Could not open settings.';
    errorNotice.hidden = false;
  }
});

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) { const url = new URL(tab.url); if (url.protocol === 'https:') providerId = getProvider(url)?.id; }
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.llm_wallpaper_settings) render(normalizeSettings(changes.llm_wallpaper_settings.newValue as Partial<WallpaperSettings> | undefined));
    });
    motionPreference.addEventListener('change', () => { if (saved) render(saved); });
    render(await getSettings());
  } catch (error) {
    errorNotice.textContent = `Could not load settings: ${error instanceof Error ? error.message : 'Please try again.'}`;
    errorNotice.hidden = false;
  } finally { document.body.dataset.ready = 'true'; }
}
void init();
