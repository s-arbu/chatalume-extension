import type { WallpaperProviderAdapter } from '../providers/types';
import { getEffectiveSettings, type ReadingComfortMode, type WallpaperSettings } from '../utils/storage';
import { resolveWallpaper } from '../utils/wallpaperSource';
import styles from './quickControls.css?inline';
import { watchChatTheme } from './chatTheme';

export function createQuickControls(provider: WallpaperProviderAdapter, onThemeChange?: (theme: 'light' | 'dark') => void) {
  const host = document.createElement('div');
  host.id = 'llm-wallpaper-controls';
  host.dataset.input = 'keyboard';
  watchChatTheme(host, onThemeChange);
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  root.appendChild(style);
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="dock" role="group" aria-label="Chatalume">
      <button type="button" id="toggle" aria-pressed="false" aria-describedby="notice">
        <span class="switch-track" aria-hidden="true">
          <span class="switch-thumb"><svg viewBox="0 0 24 24"><path class="icon-back" d="M4 15V5a2 2 0 0 1 2-2h10"/><rect x="7" y="7" width="14" height="14" rx="2.5"/><path d="m8 17 4-4 3 3 2-2 3 3"/><circle cx="16.5" cy="11" r="1" fill="currentColor" stroke="none"/></svg></span>
        </span>
      </button>
      <button type="button" id="more" aria-label="Wallpaper quick controls" aria-expanded="false" aria-controls="panel">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11v2m7-2v2m7-2v2"/></svg>
      </button>
    </div>
    <section id="panel" class="panel" role="region" aria-label="Wallpaper quick controls" hidden>
      <h2>Chatalume</h2>
      <p id="notice"></p>
      <label class="comfort-setting" for="comfort">Reading comfort<select id="comfort"><option value="off">Off</option><option value="soft">Enabled</option></select></label>
      <button type="button" id="settings">Edit wallpaper</button>
      <p id="status" role="status" aria-live="polite"></p>
    </section>`;
  root.appendChild(content);
  const toggle = root.querySelector<HTMLButtonElement>('#toggle')!;
  const more = root.querySelector<HTMLButtonElement>('#more')!;
  const panel = root.querySelector<HTMLElement>('#panel')!;
  const settingsButton = root.querySelector<HTMLButtonElement>('#settings')!;
  const notice = root.querySelector<HTMLElement>('#notice')!;
  const status = root.querySelector<HTMLElement>('#status')!;
  const comfort = root.querySelector<HTMLSelectElement>('#comfort')!;
  const name = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' }[provider.id];
  toggle.setAttribute('aria-label', `Wallpaper on ${name}`);
  let saved: WallpaperSettings;
  let busy = false;
  let motionError = false;
  let pendingComfort: ReadingComfortMode | undefined;

  function render(settings: WallpaperSettings) {
    saved = settings;
    if (motionError) { status.textContent = ''; motionError = false; }
    host.hidden = !settings.showChatControls;
    if (host.hidden) setOpen(false);
    const source = resolveWallpaper(settings);
    const enabled = !!source && getEffectiveSettings(settings, provider.id).enabled;
    comfort.value = pendingComfort ?? getEffectiveSettings(settings, provider.id).readingComfort;
    comfort.setAttribute('aria-disabled', String(busy));
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.disabled = !source || !settings.enabled;
    // Pending saves stay in the keyboard sequence; act() prevents duplicate writes.
    for (const button of [toggle, settingsButton]) button.setAttribute('aria-disabled', String(busy || button.disabled));
    notice.textContent = !source ? 'Choose a wallpaper in settings to get started.'
      : !settings.enabled ? 'Paused everywhere. Resume in wallpaper settings.'
      : `Wallpaper ${enabled ? 'on' : 'off'} for ${name}. Other sites keep their settings.`;
    toggle.title = notice.textContent;
  }

  function setOpen(open: boolean, restoreFocus = false) {
    panel.hidden = !open;
    more.setAttribute('aria-expanded', String(open));
    if (restoreFocus) more.focus();
  }

  async function act(action: string, value?: boolean | ReadingComfortMode) {
    if (busy) return;
    busy = true;
    render(saved);
    status.textContent = 'Saving…';
    try {
      const response = await chrome.runtime.sendMessage({ type: 'wallpaper-quick-action', action, ...(value === undefined ? {} : action === 'set-reading-comfort' ? { mode: value } : { enabled: value }) });
      if (!response?.ok) throw new Error(response?.error || 'Could not save. Please try again.');
      status.textContent = action === 'open-settings' ? '' : 'Saved';
    } catch (error) {
      setOpen(true);
      status.textContent = error instanceof Error ? error.message : 'Could not save. Please try again.';
    } finally {
      busy = false;
      pendingComfort = undefined;
      render(saved);
    }
  }

  toggle.addEventListener('click', (event) => {
    if (event.isTrusted) void act('set-enabled', !getEffectiveSettings(saved, provider.id).enabled);
  });
  more.addEventListener('click', () => setOpen(panel.hidden === true));
  settingsButton.addEventListener('click', (event) => { if (event.isTrusted) void act('open-settings'); });
  comfort.addEventListener('change', (event) => {
    if (!event.isTrusted || busy) { render(saved); return; }
    pendingComfort = comfort.value as ReadingComfortMode;
    void act('set-reading-comfort', pendingComfort);
  });
  comfort.addEventListener('click', (event) => { if (busy) event.preventDefault(); });
  document.addEventListener('keydown', (event) => {
    host.dataset.input = 'keyboard';
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, true);
    }
  }, true);
  document.addEventListener('pointerdown', (event) => {
    if (event.composedPath().includes(host)) host.dataset.input = 'pointer';
    if (!event.composedPath().includes(host)) setOpen(false);
  }, true);
  function reportMotionError() {
    motionError = true;
    const message = 'Could not make a still frame. Choose another image or allow animation in settings.';
    status.textContent = message; notice.textContent = message; toggle.title = message;
  }
  return { host, render, reportMotionError };
}
