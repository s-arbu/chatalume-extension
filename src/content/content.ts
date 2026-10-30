import { getEffectiveSettings, getSettings, normalizeSettings, WallpaperSettings } from '../utils/storage';
import { getProvider } from '../providers';
import { resolveWallpaper } from '../utils/wallpaperSource';
import { createQuickControls } from './quickControls';
import { createReadingComfort } from './readingComfort';
import { createWallpaperViewport } from './wallpaperViewport';
import { clearWallpaperPresentation, motionPreference, needsStillFrame, presentWallpaper } from '../utils/wallpaperPresentation';
let presentationVersion = 0;

const provider = getProvider(new URL(window.location.href));
let currentSettings: WallpaperSettings | undefined;
let quickControls: ReturnType<typeof createQuickControls> | undefined;
let wallpaperViewport: ReturnType<typeof createWallpaperViewport> | undefined;
let hasReadingRegions = false;
let currentTheme: 'light' | 'dark' = 'light';
let readingComfort: ReturnType<typeof createReadingComfort> | undefined;

function syncReadingComfortAppearance() {
  const settings = currentSettings && provider ? getEffectiveSettings(currentSettings, provider.id) : undefined;
  const active = hasReadingRegions && !!settings?.enabled && settings.readingComfort !== 'off' && !!resolveWallpaper(settings);
  if (!active) {
    document.documentElement.removeAttribute('data-llm-wallpaper-comfort');
    document.documentElement.removeAttribute('data-llm-wallpaper-comfort-provider');
    document.documentElement.removeAttribute('data-llm-wallpaper-comfort-mode');
    return;
  }
  document.documentElement.dataset.llmWallpaperComfort = currentTheme;
  document.documentElement.dataset.llmWallpaperComfortProvider = provider!.id;
  document.documentElement.dataset.llmWallpaperComfortMode = settings!.readingComfort;
}

function updateReadingComfort() {
  const settings = currentSettings && provider ? getEffectiveSettings(currentSettings, provider.id) : undefined;
  const active = !!settings?.enabled && settings.readingComfort !== 'off' && !!resolveWallpaper(settings);
  readingComfort?.update(active ? settings!.readingComfort : 'off');
  syncReadingComfortAppearance();
  if (!active) { document.querySelector('link[data-llm-wallpaper-comfort]')?.remove(); return; }
  if (!document.querySelector('link[data-llm-wallpaper-comfort]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = chrome.runtime.getURL('providers/reading-comfort.css');
    stylesheet.dataset.llmWallpaperComfort = '';
    document.documentElement.appendChild(stylesheet);
  }
}

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
  if (currentSettings) quickControls?.render(currentSettings);
  updateReadingComfort();
  const settings = currentSettings && provider ? getEffectiveSettings(currentSettings, provider.id) : undefined;
  if (!settings || !resolveWallpaper(settings)) clearWallpaperPresentation();
  if (!settings?.enabled || !resolveWallpaper(settings)) {
    wallpaperViewport?.update(null);
    document.getElementById('llm-wallpaper-overlay')?.remove();
    document.querySelector(`link[data-llm-wallpaper-provider="${provider?.id}"]`)?.remove();
    return;
  }
  loadProviderStylesheet();
  injectOverlay();
  wallpaperViewport?.update(document.getElementById('llm-wallpaper-overlay'));
  void applySettings(settings);
}

async function applySettings(settings: WallpaperSettings) {
  const version = ++presentationVersion;
  const overlay = document.getElementById('llm-wallpaper-overlay');
  if (!overlay) return;

  // Apply directly to the element, avoiding :root CSS variables entirely
  const source = resolveWallpaper(settings);
  if (source) {
    if (needsStillFrame(source.url, settings.allowAnimations)) overlay.style.backgroundImage = 'none';
    let url: string;
    try { url = await presentWallpaper(source.url, settings.allowAnimations); }
    catch {
      if (version === presentationVersion && overlay.isConnected) {
        overlay.style.backgroundImage = 'none';
        quickControls?.reportMotionError();
      }
      return;
    }
    if (version !== presentationVersion || !overlay.isConnected) return;
    const tone = settings.dimTone === 'light' ? '255,255,255' : '0,0,0';
    const color = `rgba(${tone},${settings.dimming})`;
    overlay.style.backgroundImage = `linear-gradient(${color},${color}), url("${url}")`;
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
  wallpaperViewport = createWallpaperViewport(provider);
  readingComfort = createReadingComfort(provider, (visible) => { hasReadingRegions = visible; syncReadingComfortAppearance(); });
  quickControls = createQuickControls(provider, (theme) => { currentTheme = theme; updateReadingComfort(); });
  document.documentElement.appendChild(quickControls.host);
  restoreProviderUi();
  motionPreference.addEventListener('change', restoreProviderUi);

  const observer = new MutationObserver((records) => {
    const own = '#llm-reading-comfort, #llm-wallpaper-controls, #llm-wallpaper-overlay';
    if (records.every((record) => record.target instanceof Element && record.target.closest(own))) return;
    readingComfort?.refresh();
    wallpaperViewport?.refresh();
    if (quickControls && !quickControls.host.isConnected) document.documentElement.appendChild(quickControls.host);
    const settings = currentSettings ? getEffectiveSettings(currentSettings, provider.id) : undefined;
    if (settings?.enabled && resolveWallpaper(settings) &&
        (!document.getElementById('llm-wallpaper-overlay') ||
         !document.querySelector(`link[data-llm-wallpaper-provider="${provider.id}"]`) ||
         settings.readingComfort !== 'off' && !document.querySelector('link[data-llm-wallpaper-comfort]'))) {
      restoreProviderUi();
    }
  });
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-expanded'] });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.llm_wallpaper_settings) {
      currentSettings = normalizeSettings(changes.llm_wallpaper_settings.newValue as Partial<WallpaperSettings> | undefined);
      restoreProviderUi();
    }
  });
}

init();
