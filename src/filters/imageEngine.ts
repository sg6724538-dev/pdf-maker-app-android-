import type { FilterId, ImageEditState, ImageQuality } from '../types/pdf';

const imageCache = new Map<string, HTMLImageElement>();

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image appears to be empty or corrupted.'));
        return;
      }
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('Failed to decode image file. It may be corrupted or unsupported.'));
    };
    img.src = src;
  });
}

export function getEffectiveDimensions(
  naturalWidth: number,
  naturalHeight: number,
  edit: ImageEditState
): { width: number; height: number } {
  const cropW = Math.max(1, Math.round(naturalWidth * edit.crop.width));
  const cropH = Math.max(1, Math.round(naturalHeight * edit.crop.height));
  if (edit.rotation === 90 || edit.rotation === 270) {
    return { width: cropH, height: cropW };
  }
  return { width: cropW, height: cropH };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function applyUnsharpMask(imageData: ImageData, amount: number): void {
  if (amount <= 0) return;
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);
  const strength = amount * 1.4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const neighbors =
          (copy[((y - 1) * width + x) * 4 + c] +
            copy[((y + 1) * width + x) * 4 + c] +
            copy[(y * width + (x - 1)) * 4 + c] +
            copy[(y * width + (x + 1)) * 4 + c]) *
          0.25;
        const sharpened = center + (center - neighbors) * strength;
        data[idx + c] = clampByte(sharpened);
      }
    }
  }
}

function applyPixelFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  edit: ImageEditState
): void {
  const needsPixels =
    edit.filter !== 'original' ||
    edit.brightness !== 0 ||
    edit.contrast !== 0 ||
    edit.saturation !== 0 ||
    edit.sharpness > 0;

  if (!needsPixels) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Compute auto-enhance histogram bounds when needed
  let minLum = 0;
  let maxLum = 255;
  if (edit.filter === 'auto_enhance' || edit.filter === 'document') {
    const hist = new Uint32Array(256);
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(totalPixels / 40000));
    let sampled = 0;
    for (let i = 0; i < data.length; i += 4 * step) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      hist[lum]++;
      sampled++;
    }
    const lowCut = sampled * (edit.filter === 'document' ? 0.03 : 0.015);
    const highCut = sampled * (edit.filter === 'document' ? 0.92 : 0.985);
    let acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= lowCut) {
        minLum = i;
        break;
      }
    }
    acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= highCut) {
        maxLum = i;
        break;
      }
    }
    if (maxLum - minLum < 30) {
      minLum = 0;
      maxLum = 255;
    }
  }

  // Preset baseline adjustments
  let brightOffset = edit.brightness * 1.45;
  let contrastVal = edit.contrast;
  let satVal = edit.saturation;
  let sharpAmount = edit.sharpness / 100;

  switch (edit.filter) {
    case 'bright':
      brightOffset += 38;
      contrastVal += 6;
      break;
    case 'dark':
      brightOffset -= 34;
      contrastVal += 16;
      break;
    case 'high_contrast':
      contrastVal += 55;
      satVal += 10;
      break;
    case 'sharpen':
      sharpAmount = Math.min(1.5, sharpAmount + 0.85);
      contrastVal += 10;
      break;
    case 'auto_enhance':
      satVal += 16;
      contrastVal += 10;
      sharpAmount = Math.min(1.2, sharpAmount + 0.25);
      break;
    case 'document':
      contrastVal += 32;
      brightOffset += 22;
      satVal -= 35;
      sharpAmount = Math.min(1.3, sharpAmount + 0.45);
      break;
    default:
      break;
  }

  const contrastFactor =
    (259 * (contrastVal * 1.6 + 255)) / (255 * (259 - contrastVal * 1.6));
  const satFactor = 1 + satVal / 100;
  const rangeSpan = Math.max(1, maxLum - minLum);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Histogram stretch for Auto Enhance / Document
    if (edit.filter === 'auto_enhance' || edit.filter === 'document') {
      r = clampByte(((r - minLum) / rangeSpan) * 255);
      g = clampByte(((g - minLum) / rangeSpan) * 255);
      b = clampByte(((b - minLum) / rangeSpan) * 255);
    }

    // Apply brightness & contrast
    r = contrastFactor * (r - 128) + 128 + brightOffset;
    g = contrastFactor * (g - 128) + 128 + brightOffset;
    b = contrastFactor * (b - 128) + 128 + brightOffset;

    // Document paper whitening boost
    if (edit.filter === 'document') {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 185) {
        const lift = ((lum - 185) / 70) * 42;
        r += lift;
        g += lift;
        b += lift;
      } else if (lum < 115) {
        r *= 0.84;
        g *= 0.84;
        b *= 0.84;
      }
    }

    // Filter-specific color transforms
    if (edit.filter === 'grayscale') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    } else if (edit.filter === 'bw') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Soft adaptive S-curve threshold for crisp legible text without jagged noise
      const t = gray > 142 ? 255 : gray < 98 ? 0 : ((gray - 98) / 44) * 255;
      r = t;
      g = t;
      b = t;
    } else if (edit.filter === 'vintage') {
      const vr = r * 0.94 + g * 0.12 + b * 0.04 + 14;
      const vg = r * 0.08 + g * 0.88 + b * 0.06 + 8;
      const vb = r * 0.05 + g * 0.1 + b * 0.72 + 12;
      r = vr;
      g = vg;
      b = vb;
    } else if (satVal !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  if (sharpAmount > 0.01) {
    applyUnsharpMask(imageData, sharpAmount);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies smooth keystone perspective correction using horizontal/vertical slice warping.
 */
function applyPerspectiveWarp(
  sourceCanvas: HTMLCanvasElement,
  perspectiveX: number,
  perspectiveY: number
): HTMLCanvasElement {
  if (perspectiveX === 0 && perspectiveY === 0) {
    return sourceCanvas;
  }

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  // Step 1: Vertical keystone (top vs bottom width)
  let current = sourceCanvas;
  if (perspectiveY !== 0) {
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      const strength = (perspectiveY / 100) * 0.65;
      const slices = Math.min(h, 240);
      const sliceH = h / slices;
      for (let i = 0; i < slices; i++) {
        const t = i / Math.max(1, slices - 1);
        const scale =
          strength > 0
            ? 1 - strength * (1 - t)
            : 1 + strength * t;
        const destW = Math.max(1, w * scale);
        const destX = (w - destW) / 2;
        const sy = i * sliceH;
        ctx.drawImage(
          current,
          0,
          sy,
          w,
          Math.ceil(sliceH + 0.5),
          destX,
          sy,
          destW,
          Math.ceil(sliceH + 0.5)
        );
      }
      current = out;
    }
  }

  // Step 2: Horizontal keystone (left vs right height)
  if (perspectiveX !== 0) {
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      const strength = (perspectiveX / 100) * 0.65;
      const slices = Math.min(w, 240);
      const sliceW = w / slices;
      for (let i = 0; i < slices; i++) {
        const t = i / Math.max(1, slices - 1);
        const scale =
          strength > 0
            ? 1 - strength * (1 - t)
            : 1 + strength * t;
        const destH = Math.max(1, h * scale);
        const destY = (h - destH) / 2;
        const sx = i * sliceW;
        ctx.drawImage(
          current,
          sx,
          0,
          Math.ceil(sliceW + 0.5),
          h,
          sx,
          destY,
          Math.ceil(sliceW + 0.5),
          destH
        );
      }
      current = out;
    }
  }

  return current;
}

export interface RenderOptions {
  maxDimension?: number;
  ignoreCrop?: boolean;
}

export async function renderEditedCanvas(
  originalUrl: string,
  edit: ImageEditState,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  const img = await loadImageElement(originalUrl);
  const srcX = options.ignoreCrop ? 0 : Math.round(img.naturalWidth * edit.crop.x);
  const srcY = options.ignoreCrop ? 0 : Math.round(img.naturalHeight * edit.crop.y);
  const srcW = options.ignoreCrop
    ? img.naturalWidth
    : Math.max(1, Math.round(img.naturalWidth * edit.crop.width));
  const srcH = options.ignoreCrop
    ? img.naturalHeight
    : Math.max(1, Math.round(img.naturalHeight * edit.crop.height));

  const rotated = edit.rotation === 90 || edit.rotation === 270;
  let outW = rotated ? srcH : srcW;
  let outH = rotated ? srcW : srcH;

  if (options.maxDimension && Math.max(outW, outH) > options.maxDimension) {
    const scale = options.maxDimension / Math.max(outW, outH);
    outW = Math.max(1, Math.round(outW * scale));
    outH = Math.max(1, Math.round(outH * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((edit.rotation * Math.PI) / 180);
  const drawW = rotated ? outH : outW;
  const drawH = rotated ? outW : outH;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  applyPixelFilters(ctx, outW, outH, edit);

  const warped = applyPerspectiveWarp(canvas, edit.perspectiveX, edit.perspectiveY);
  return warped;
}

export async function renderFilterThumbnail(
  originalUrl: string,
  baseEdit: ImageEditState,
  filterId: FilterId
): Promise<string> {
  const thumbEdit: ImageEditState = {
    ...baseEdit,
    filter: filterId,
    perspectiveX: 0,
    perspectiveY: 0,
  };
  const canvas = await renderEditedCanvas(originalUrl, thumbEdit, { maxDimension: 160 });
  return canvas.toDataURL('image/jpeg', 0.78);
}

export interface EncodedPdfImage {
  bytes: Uint8Array;
  format: 'jpeg' | 'png';
  width: number;
  height: number;
  previewDataUrl: string;
}

export async function renderImageForPdf(
  originalUrl: string,
  edit: ImageEditState,
  quality: ImageQuality
): Promise<EncodedPdfImage> {
  const qualityMap: Record<
    ImageQuality,
    { maxDim: number; jpegQuality: number; usePngIfLossless: boolean }
  > = {
    low: { maxDim: 1100, jpegQuality: 0.62, usePngIfLossless: false },
    medium: { maxDim: 1750, jpegQuality: 0.78, usePngIfLossless: false },
    high: { maxDim: 2400, jpegQuality: 0.91, usePngIfLossless: false },
    original: { maxDim: 3600, jpegQuality: 0.96, usePngIfLossless: false },
  };

  const preset = qualityMap[quality];
  const canvas = await renderEditedCanvas(originalUrl, edit, {
    maxDimension: preset.maxDim,
  });

  const mime = preset.usePngIfLossless ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to encode processed image for PDF.'));
      },
      mime,
      preset.jpegQuality
    );
  });

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Small cover thumbnail if needed
  const thumbCanvas = document.createElement('canvas');
  const thumbScale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
  thumbCanvas.width = Math.max(1, Math.round(canvas.width * thumbScale));
  thumbCanvas.height = Math.max(1, Math.round(canvas.height * thumbScale));
  const tctx = thumbCanvas.getContext('2d');
  if (tctx) {
    tctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  }
  const previewDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

  return {
    bytes,
    format: preset.usePngIfLossless ? 'png' : 'jpeg',
    width: canvas.width,
    height: canvas.height,
    previewDataUrl,
  };
}
