import { bindWallpaperControls, persistSettings } from './controls';
import { getProvider } from '../providers';
import type { ProviderId } from '../providers/types';
import { getEffectiveSettings, type WallpaperSettings } from '../utils/storage';
import { resolveWallpaper } from '../utils/wallpaperSource';

const sitePause = document.getElementById('sitePauseBtn') as HTMLButtonElement;
const globalPause = document.getElementById('globalPauseBtn') as HTMLButtonElement;
const reset = document.getElementById('resetEffectsBtn') as HTMLButtonElement;
const manage = document.getElementById('manageWallpaperBtn') as HTMLButtonElement;
let providerId: ProviderId | undefined;
let saved: WallpaperSettings | undefined;
let busy = false;
const names = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' };

function render(settings: WallpaperSettings) {
  saved = settings;
  const source = resolveWallpaper(settings);
  const name = providerId && names[providerId];
  document.getElementById('providerName')!.textContent = name || 'Open a supported chat';
  document.getElementById('siteActions')!.hidden = !providerId;
  document.getElementById('advancedControls')!.hidden = !providerId || !source;
  document.getElementById('contextNotice')!.textContent = !providerId ? 'Works on ChatGPT, Claude, and Gemini. Open one to control this site.'
    : !source ? `Choose a wallpaper to personalize ${name}. Your image is shared across supported chats.`
    : !settings.enabled ? 'Wallpaper is paused everywhere. Resume everywhere to use site controls.'
    : getEffectiveSettings(settings, providerId).enabled ? `Wallpaper is on for ${name}. Other sites keep their settings.`
    : `Wallpaper is paused on ${name}. Other sites keep their settings.`;
  sitePause.textContent = `${providerId && (settings.providerOverrides[providerId]?.enabled ?? true) ? 'Pause' : 'Resume'} on ${name}`;
  sitePause.disabled = !source || !settings.enabled;
  globalPause.textContent = settings.enabled ? 'Pause everywhere' : 'Resume everywhere';
  globalPause.disabled = !source;
  for (const button of [sitePause, globalPause]) button.setAttribute('aria-disabled', String(busy || button.disabled));
  reset.disabled = !source;
  reset.textContent = `Reset ${name}’s effects`;
  manage.textContent = source ? 'Manage wallpaper' : 'Choose wallpaper';
  if (providerId) {
    const overrides = settings.providerOverrides[providerId];
    document.getElementById('scopeNotice')!.textContent = overrides && Object.keys(overrides).length
      ? `Adjustments apply only to ${name}. Use global settings to clear this site's overrides.`
      : `${name} uses global defaults. Adjusting a control creates an override for this site.`;
  }
}

async function save(patch: Partial<WallpaperSettings>, scope?: ProviderId) {
  if (busy || !saved) return;
  busy = true;
  render(saved);
  try { await persistSettings(patch, undefined, scope); }
  finally { busy = false; if (saved) render(saved); }
}

sitePause.addEventListener('click', () => {
  if (providerId && saved && !sitePause.disabled) void save({ enabled: !(saved.providerOverrides[providerId]?.enabled ?? true) }, providerId);
});
globalPause.addEventListener('click', () => { if (saved && !globalPause.disabled) void save({ enabled: !saved.enabled }); });
manage.addEventListener('click', () => {
  chrome.runtime.openOptionsPage().catch((error) => {
    const alert = document.getElementById('uploadError')!;
    alert.textContent = `Could not open settings: ${error.message}`;
    alert.hidden = false;
  });
});

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.protocol === 'https:') providerId = getProvider(url)?.id;
    }
  } catch { /* Missing tab access uses the same unsupported-page explanation. */ }
  (document.getElementById('providerScope') as HTMLSelectElement).value = providerId || 'global';
  await bindWallpaperControls(render);
  document.body.dataset.ready = 'true';
}
void init();
