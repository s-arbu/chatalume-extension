// Keep the original GIF in storage; a still frame exists only in this page's memory.
export const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let cachedUrl: string | undefined;
let cachedFrame: Promise<string> | undefined;

export function clearWallpaperPresentation() { cachedUrl = undefined; cachedFrame = undefined; }

export function needsStillFrame(url: string, allowAnimations: boolean, paused = false) {
  const gif = /^data:image\/gif;base64,/i.test(url) || url.slice(url.indexOf(',') + 1).startsWith('R0lGOD');
  return (paused || motionPreference.matches && !allowAnimations) && gif;
}

export function presentWallpaper(url: string, allowAnimations: boolean, paused = false): Promise<string> {
  if (!needsStillFrame(url, allowAnimations, paused)) {
    if (url !== cachedUrl) { cachedUrl = undefined; cachedFrame = undefined; }
    return Promise.resolve(url);
  }
  if (cachedUrl === url && cachedFrame) return cachedFrame;
  cachedUrl = url;
  cachedFrame = (async () => {
    const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), char => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/gif' }));
    try {
      const scale = Math.min(1, 2560 / bitmap.width, 1440 / bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create a still frame.');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally { bitmap.close(); }
  })();
  return cachedFrame;
}
