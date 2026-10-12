import { getSettings, normalizeSettings, WallpaperSettings } from '../utils/storage';
import { getProvider } from '../providers';

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
  if (!currentSettings?.imageDataUrl?.startsWith('data:image')) {
    document.getElementById('llm-wallpaper-overlay')?.remove();
    document.querySelector(`link[data-llm-wallpaper-provider="${provider?.id}"]`)?.remove();
    return;
  }
  loadProviderStylesheet();
  injectOverlay();
  applySettings(currentSettings);
}

function applySettings(settings: WallpaperSettings) {
  const overlay = document.getElementById('llm-wallpaper-overlay');
  if (!overlay) return;

  // Apply directly to the element, avoiding :root CSS variables entirely
  if (settings.imageDataUrl && settings.imageDataUrl.startsWith('data:image')) {
    overlay.style.backgroundImage = `url("${settings.imageDataUrl}")`;
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
    if (currentSettings?.imageDataUrl?.startsWith('data:image') &&
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
