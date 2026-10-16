import { bindWallpaperControls, persistSettings } from './controls';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { WALLPAPER_PRESETS } from '../wallpapers/presets';

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLDivElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const uploadError = document.getElementById('uploadError') as HTMLParagraphElement;
let uploadController: AbortController | undefined;

void bindWallpaperControls();
for (const preset of WALLPAPER_PRESETS) {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  radio.type = 'radio'; radio.name = 'wallpaperSource'; radio.value = preset.id;
  const image = document.createElement('img');
  image.src = chrome.runtime.getURL(preset.path); image.alt = '';
  label.append(radio, image, preset.title);
  document.getElementById('presetGallery')!.appendChild(label);
}
document.getElementById('presetGallery')!.addEventListener('change', (event) => {
  const radio = event.target as HTMLInputElement;
  uploadController?.abort();
  void persistSettings({ presetId: radio.value === 'upload' ? null : radio.value });
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
    const saved = await persistSettings({ imageDataUrl, fileName: file.name, presetId: null }, controller.signal);
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
