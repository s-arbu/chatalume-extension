export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 3840, // Capped at 4K resolution
  maxHeight: 2160,
  quality: 0.92   // High-fidelity quality output
};

async function fileToDataUrl(file: File): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
}

export async function compressImageToDataUrl(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MiB or smaller.');
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');

  const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

  if (isGif) {
    return fileToDataUrl(file);
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const bitmap = await createImageBitmap(file);

  let blob: Blob | null = null;
  try {
    let { width, height } = bitmap;
    const maxW = opts.maxWidth!;
    const maxH = opts.maxHeight!;

    // Downscale only if image exceeds 4K dimensions
    if (width > maxW || height > maxH) {
      const aspectRatio = width / height;
      if (width / maxW > height / maxH) {
        width = maxW;
        height = Math.round(maxW / aspectRatio);
      } else {
        height = maxH;
        width = Math.round(maxH * aspectRatio);
      }
    }

    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Could not obtain OffscreenCanvas 2D context');

      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await offscreen.convertToBlob({
        type: 'image/webp',
        quality: opts.quality
      });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not obtain Canvas 2D context');

      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', opts.quality);
      });
    }
  } finally {
    bitmap.close();
  }

  if (!blob) throw new Error('Failed to encode image to WebP format');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
