import { DEFAULT_EFFECTS, normalizeSettings, saveProviderSettings, saveSettings } from '../utils/storage';
import { PROVIDER_IDS } from '../providers/types';

chrome.runtime.onInstalled.addListener(() => {
  saveSettings({}).catch((error) => console.error('Could not migrate wallpaper settings:', error));
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'save-wallpaper-settings') return;
  const providerRequest = message.providerId !== undefined;
  const allowed = providerRequest ? ['enabled', ...Object.keys(DEFAULT_EFFECTS)] : Object.keys(normalizeSettings()).filter((key) => key !== 'version' && key !== 'providerOverrides');
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
