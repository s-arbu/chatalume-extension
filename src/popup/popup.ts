import { bindWallpaperControls, persistSettings } from './controls';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { WALLPAPER_PRESETS } from '../wallpapers/presets';
import { resolveWallpaper } from '../utils/wallpaperSource';
import { motionPreference, needsStillFrame, presentWallpaper } from '../utils/wallpaperPresentation';
import { getEffectiveSettings, type WallpaperSettings } from '../utils/storage';
import { PROVIDER_IDS, type ProviderId } from '../providers/types';

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLDivElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const uploadError = document.getElementById('uploadError') as HTMLParagraphElement;
let uploadController: AbortController | undefined;

let previewVersion = 0;
function renderSetup(settings: WallpaperSettings) {
  const intro = document.getElementById('setupIntro')!;
  const restoreFocus = settings.setupComplete && intro.contains(document.activeElement);
  intro.hidden = settings.setupComplete;
  if (restoreFocus) document.getElementById('chooseFileBtn')!.focus();
  const scope = (document.getElementById('providerScope') as HTMLSelectElement).value as ProviderId;
  const provider = PROVIDER_IDS.includes(scope) ? scope : undefined;
  const effects = provider ? getEffectiveSettings(settings, provider) : settings;
  const scopeLabel = provider ? { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' }[provider] : 'all chats';
  const source = resolveWallpaper(settings);
  const wallpaper = document.getElementById('previewWallpaper')!;
  const url = source?.url || chrome.runtime.getURL(WALLPAPER_PRESETS[0]!.path);
  const version = ++previewVersion;
  if (needsStillFrame(url, settings.allowAnimations, !effects.enabled)) wallpaper.style.backgroundImage = 'none';
  void presentWallpaper(url, settings.allowAnimations, !effects.enabled).then(presentation => {
    if (version !== previewVersion) return;
    wallpaper.style.backgroundImage = `url("${presentation}")`;
    wallpaper.style.opacity = source ? String(effects.enabled ? effects.opacity : 0) : '1';
    wallpaper.style.backgroundSize = effects.fit;
    wallpaper.style.filter = `blur(${effects.blur}px)`;
    wallpaper.style.backgroundPosition = `${effects.positionX}% ${effects.positionY}%`;
  }).catch(() => { if (version === previewVersion) wallpaper.style.backgroundImage = 'none'; });
  const shade = document.getElementById('previewShade')!;
  shade.style.background = source ? (effects.dimTone === 'dark' ? '#000' : '#fff') : 'transparent';
  shade.style.opacity = String(effects.enabled ? effects.dimming : 0);
  wallpaper.parentElement!.dataset.comfort = source && effects.enabled ? effects.readingComfort : 'off';
  document.getElementById('previewCaption')!.textContent = source ? `${source.label} — synthetic preview. ${effects.enabled ? `Example for ${scopeLabel}. Open a supported chat to see it.` : 'Wallpaper is paused for this scope.'}` : 'Preview only. Choose a wallpaper to apply it.';
  const motionNotice = document.getElementById('motionNotice')!;
  motionNotice.hidden = !motionPreference.matches;
  motionNotice.textContent = settings.allowAnimations ? 'Animation is allowed even though reduced motion is on.' : 'Reduced motion is on. Animated wallpapers use a still frame.';
}
void bindWallpaperControls(renderSetup);
document.getElementById('setupPresetBtn')!.addEventListener('click', () => {
  document.querySelector<HTMLInputElement>('input[name="wallpaperSource"][value="mist"]')!.focus();
});
document.getElementById('setupUploadBtn')!.addEventListener('click', () => imageInput.click());
document.getElementById('setupSkipBtn')!.addEventListener('click', () => { void persistSettings({ setupComplete: true }); });
for (const preset of WALLPAPER_PRESETS) {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  radio.type = 'radio'; radio.name = 'wallpaperSource'; radio.value = preset.id;
  const image = document.createElement('img');
  image.src = chrome.runtime.getURL(preset.path); image.alt = '';
  label.append(radio, image, preset.title);
  const gallery = document.getElementById('presetGallery')!;
  gallery.insertBefore(label, gallery.querySelector('label:has(input[value="upload"])'));
}
document.getElementById('presetGallery')!.addEventListener('change', (event) => {
  const radio = event.target as HTMLInputElement;
  uploadController?.abort();
  void persistSettings({ presetId: radio.value === 'upload' ? null : radio.value, setupComplete: true });
});
document.getElementById('chooseFileBtn')!.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  uploadController?.abort();
  const controller = new AbortController();
  uploadController = controller;
  uploadError.hidden = true;
  fileNameDisplay.textContent = 'Processing...';
  try {
    const imageDataUrl = await compressImageToDataUrl(file, { maxWidth: 2560, maxHeight: 1440, quality: 0.85 });
    if (controller.signal.aborted) return;
    const saved = await persistSettings({ imageDataUrl, fileName: file.name, presetId: null, setupComplete: true }, controller.signal);
    if (!saved && !controller.signal.aborted) imageInput.value = '';
  } catch (error) {
    if (controller.signal.aborted) return;
    fileNameDisplay.textContent = 'Upload failed';
    uploadError.textContent = `${error instanceof Error ? error.message : 'Could not process this image.'} Previous wallpaper unchanged.`;
    uploadError.hidden = false;
    imageInput.value = '';
  }
});

resetBtn.addEventListener('click', async () => {
  uploadController?.abort();
  if (await persistSettings({ imageDataUrl: null, fileName: null, presetId: null })) imageInput.value = '';
});
