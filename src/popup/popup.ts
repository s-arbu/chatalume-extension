import { getSettings, saveSettings } from '../utils/storage';
import { compressImageToDataUrl } from '../utils/imageCompressor';

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const chooseFileBtn = document.getElementById('chooseFileBtn') as HTMLButtonElement;
const fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLDivElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

const opacityInput = document.getElementById('opacityInput') as HTMLInputElement;
const opacityVal = document.getElementById('opacityVal') as HTMLSpanElement;

const blurInput = document.getElementById('blurInput') as HTMLInputElement;
const blurVal = document.getElementById('blurVal') as HTMLSpanElement;

async function loadUI() {
  const settings = await getSettings();
  
  // Load Sliders
  opacityInput.value = settings.opacity.toString();
  blurInput.value = settings.blur.toString();
  updateLiveValues();

  // Load File Status
  if (settings.fileName && settings.imageDataUrl) {
    fileNameDisplay.textContent = settings.fileName;
    resetBtn.style.display = 'block';
  } else {
    fileNameDisplay.textContent = 'No file chosen';
    resetBtn.style.display = 'none';
  }
}

function updateLiveValues() {
  opacityVal.textContent = `${Math.round(parseFloat(opacityInput.value) * 100)}%`;
  blurVal.textContent = `${blurInput.value}px`;
}

chooseFileBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  fileNameDisplay.textContent = 'Processing...';

  try {
    const compressedDataUrl = await compressImageToDataUrl(file, {
      maxWidth: 2560,
      maxHeight: 1440,
      quality: 0.85
    });
    
    await saveSettings({ 
      imageDataUrl: compressedDataUrl,
      fileName: file.name
    });
    
    fileNameDisplay.textContent = file.name;
    resetBtn.style.display = 'block';
  } catch (err) {
    console.error('Failed to compress image:', err);
    fileNameDisplay.textContent = 'Error processing file';
  }
});

opacityInput.addEventListener('input', async () => {
  updateLiveValues();
  await saveSettings({ opacity: parseFloat(opacityInput.value) });
});

blurInput.addEventListener('input', async () => {
  updateLiveValues();
  await saveSettings({ blur: parseInt(blurInput.value, 10) });
});

resetBtn.addEventListener('click', async () => {
  await saveSettings({ imageDataUrl: null, fileName: null });
  imageInput.value = '';
  fileNameDisplay.textContent = 'No file chosen';
  resetBtn.style.display = 'none';
});

loadUI();
