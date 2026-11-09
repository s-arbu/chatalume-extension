import { DEFAULT_EFFECTS, READING_COMFORT_MODES, normalizeSettings, saveProviderSettings, saveSettings } from '../utils/storage';
import { PROVIDER_IDS, type ProviderId } from '../providers/types';
import { getProvider } from '../providers';

async function openWallpaperSettings(providerId?: ProviderId) {
  const base = chrome.runtime.getURL('popup.html');
  const url = `${base}#provider=${providerId || 'global'}`;
  const tabs = await chrome.tabs.query({ url: `${base}*` });
  const existing = tabs.find(tab => tab.id !== undefined);
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true, url });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else await chrome.tabs.create({ url });
}

chrome.runtime.onInstalled.addListener(() => {
  saveSettings({}).catch((error) => console.error('Could not migrate wallpaper settings:', error));
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'wallpaper-quick-action') {
    const provider = sender.url ? getProvider(new URL(sender.url)) : undefined;
    const validAction = message.action === 'open-settings' || message.action === 'reset-effects' ||
      message.action === 'set-enabled' && typeof message.enabled === 'boolean' ||
      message.action === 'set-reading-comfort' && READING_COMFORT_MODES.includes(message.mode);
    if (sender.id !== chrome.runtime.id || !sender.tab || sender.frameId !== 0 || !provider || !validAction ||
        Object.keys(message).some((key) => !['type', 'action', ...(message.action === 'set-enabled' ? ['enabled'] : message.action === 'set-reading-comfort' ? ['mode'] : [])].includes(key))) {
      respond({ ok: false, error: 'Invalid quick-controls request.' });
      return;
    }
    const save = message.action === 'open-settings' ? openWallpaperSettings(provider.id)
      : saveProviderSettings(provider.id, message.action === 'reset-effects' ? DEFAULT_EFFECTS
        : message.action === 'set-reading-comfort' ? { readingComfort: message.mode } : { enabled: message.enabled });
    save.then(() => respond({ ok: true }), (error) => respond({ ok: false, error: error instanceof Error ? error.message : 'Could not save. Please try again.' }));
    return true;
  }
  if (message?.type === 'open-wallpaper-settings') {
    if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('')) ||
        message.providerId !== undefined && !PROVIDER_IDS.includes(message.providerId) ||
        Object.keys(message).some(key => !['type', 'providerId'].includes(key))) {
      respond({ ok: false, error: 'Invalid editor request.' });
      return;
    }
    openWallpaperSettings(message.providerId).then(() => respond({ ok: true }), error => respond({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type !== 'save-wallpaper-settings') return;
  const providerRequest = message.providerId !== undefined;
  const allowed = providerRequest ? ['enabled', 'readingComfort', ...Object.keys(DEFAULT_EFFECTS)] : Object.keys(normalizeSettings()).filter((key) => key !== 'version' && key !== 'providerOverrides');
  const validPatch = providerRequest && message.patch === null || message.patch && typeof message.patch === 'object' && !Array.isArray(message.patch) && Object.keys(message.patch).every((key) => allowed.includes(key));
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('')) ||
      !validPatch || providerRequest && !PROVIDER_IDS.includes(message.providerId)) {
    respond({ ok: false, error: 'Invalid settings request.' });
    return;
  }
  const save = providerRequest ? saveProviderSettings(message.providerId, message.patch) : saveSettings(message.patch);
  save.then(
    () => respond({ ok: true }),
    (error) => respond({ ok: false, error: error instanceof Error ? error.message : 'Could not save settings.' })
  );
  return true;
});
