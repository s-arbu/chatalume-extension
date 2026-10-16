import { bindWallpaperControls } from './controls';

void bindWallpaperControls();
document.getElementById('manageWallpaperBtn')!.addEventListener('click', () => {
  chrome.runtime.openOptionsPage().catch((error) => {
    const alert = document.getElementById('uploadError')!;
    alert.textContent = `Could not open settings: ${error.message}`;
    alert.hidden = false;
  });
});
