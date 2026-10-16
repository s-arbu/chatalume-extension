import { getEffectiveSettings, getSettings, normalizeSettings, WallpaperSettings } from '../utils/storage';
import { getProvider } from '../providers';
import { resolveWallpaper } from '../utils/wallpaperSource';

const provider = getProvider(new URL(window.location.href));
let currentSettings: WallpaperSettings | undefined;

function loadProviderStylesheet() {
  if (!provider || document.querySelector(`link[data-llm-wallpaper-provider="${provider.id}"]`)) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = chrome.runtime.getURL(provider.stylesheetPath);
  stylesheet.dataset.llmWallpaperProvider = provider.id;
  document.documentElement.appendChild(stylesheet);
}

function injectOverlay() {
  if (document.getElementById('llm-wallpaper-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'llm-wallpaper-overlay';
  document.documentElement.appendChild(overlay);
}

function restoreProviderUi() {
  const settings = currentSettings && provider ? getEffectiveSettings(currentSettings, provider.id) : undefined;
  if (!settings?.enabled || !resolveWallpaper(settings)) {
    document.getElementById('llm-wallpaper-overlay')?.remove();
    document.querySelector(`link[data-llm-wallpaper-provider="${provider?.id}"]`)?.remove();
    return;
  }
  loadProviderStylesheet();
  injectOverlay();
  applySettings(settings);
}

function applySettings(settings: WallpaperSettings) {
  const overlay = document.getElementById('llm-wallpaper-overlay');
  if (!overlay) return;

  // Apply directly to the element, avoiding :root CSS variables entirely
  const source = resolveWallpaper(settings);
  if (source) {
    const tone = settings.dimTone === 'light' ? '255,255,255' : '0,0,0';
    const color = `rgba(${tone},${settings.dimming})`;
    overlay.style.backgroundImage = `linear-gradient(${color},${color}), url("${source.url}")`;
    overlay.style.backgroundSize = `100% 100%, ${settings.fit}`;
    overlay.style.backgroundPosition = `center, ${settings.positionX}% ${settings.positionY}%`;
  } else {
    overlay.style.backgroundImage = 'none';
  }
  
  overlay.style.opacity = settings.opacity.toString();
  overlay.style.filter = `blur(${settings.blur}px)`;
}

async function init() {
  if (!provider) return;

  const settings = await getSettings();
  currentSettings = settings;
  restoreProviderUi();

  const observer = new MutationObserver(() => {
    const settings = currentSettings ? getEffectiveSettings(currentSettings, provider.id) : undefined;
    if (settings?.enabled && resolveWallpaper(settings) &&
        (!document.getElementById('llm-wallpaper-overlay') ||
         !document.querySelector(`link[data-llm-wallpaper-provider="${provider.id}"]`))) {
      restoreProviderUi();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.llm_wallpaper_settings) {
      currentSettings = normalizeSettings(changes.llm_wallpaper_settings.newValue as Partial<WallpaperSettings> | undefined);
      restoreProviderUi();
    }
  });
}

init();
