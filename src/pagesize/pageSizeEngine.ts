import type {
  ImagePlacement,
  MarginPreset,
  MeasurementUnit,
  PageOrientation,
  PageSizeId,
  PdfPageConfig,
} from '../types/pdf';

// PostScript points: 1 inch = 72 pt, 1 mm = 72 / 25.4 pt
export const MM_TO_PT = 72 / 25.4;
export const CM_TO_PT = 72 / 2.54;
export const IN_TO_PT = 72;

export interface StandardPageSize {
  id: PageSizeId;
  label: string;
  subtitle: string;
  widthMm: number;
  heightMm: number;
}

export const STANDARD_PAGE_SIZES: StandardPageSize[] = [
  { id: 'A4', label: 'A4', subtitle: '210 × 297 mm', widthMm: 210, heightMm: 297 },
  { id: 'A3', label: 'A3', subtitle: '297 × 420 mm', widthMm: 297, heightMm: 420 },
  { id: 'A5', label: 'A5', subtitle: '148 × 210 mm', widthMm: 148, heightMm: 210 },
  { id: 'Letter', label: 'Letter', subtitle: '8.5 × 11 in', widthMm: 215.9, heightMm: 279.4 },
  { id: 'Legal', label: 'Legal', subtitle: '8.5 × 14 in', widthMm: 215.9, heightMm: 355.6 },
  { id: 'Executive', label: 'Executive', subtitle: '7.25 × 10.5 in', widthMm: 184.15, heightMm: 266.7 },
  { id: 'FitToImage', label: 'Fit to Image', subtitle: 'Matches image size', widthMm: 0, heightMm: 0 },
  { id: 'Custom', label: 'Custom Size', subtitle: 'Define width & height', widthMm: 210, heightMm: 297 },
];

export const MARGIN_PRESETS: { id: MarginPreset; label: string; mm: number }[] = [
  { id: 'none', label: 'No Margin', mm: 0 },
  { id: 'small', label: 'Small', mm: 8 },
  { id: 'medium', label: 'Medium', mm: 16 },
  { id: 'large', label: 'Large', mm: 26 },
  { id: 'custom', label: 'Custom', mm: 12 },
];

export function unitToPt(value: number, unit: MeasurementUnit): number {
  const safe = Math.max(1, Number.isFinite(value) ? value : 100);
  if (unit === 'in') return safe * IN_TO_PT;
  if (unit === 'cm') return safe * CM_TO_PT;
  return safe * MM_TO_PT;
}

export function getMarginMm(config: PdfPageConfig): number {
  if (config.marginPreset === 'custom') {
    return Math.max(0, Math.min(80, Number.isFinite(config.customMarginMm) ? config.customMarginMm : 0));
  }
  const found = MARGIN_PRESETS.find((m) => m.id === config.marginPreset);
  return found ? found.mm : 0;
}

export function getMarginLabel(config: PdfPageConfig): string {
  const mm = getMarginMm(config);
  if (mm === 0) return 'No Margin';
  if (config.marginPreset === 'custom') return `Custom (${mm} mm)`;
  const found = MARGIN_PRESETS.find((m) => m.id === config.marginPreset);
  return found ? `${found.label} (${mm} mm)` : `${mm} mm`;
}

export function getPageSizeDisplayLabel(config: PdfPageConfig): string {
  if (config.pageSize === 'FitToImage') return 'Fit to Image';
  if (config.pageSize === 'Custom') {
    return `Custom (${config.customWidth}×${config.customHeight} ${config.customUnit})`;
  }
  return config.pageSize;
}

export interface ResolvedPageGeometry {
  pageWidthPt: number;
  pageHeightPt: number;
  pageWidthMm: number;
  pageHeightMm: number;
  marginPt: number;
  resolvedOrientation: 'portrait' | 'landscape';
}

export function resolvePageGeometry(
  config: PdfPageConfig,
  imageWidthPx: number,
  imageHeightPx: number
): ResolvedPageGeometry {
  const safeImgW = Math.max(1, imageWidthPx);
  const safeImgH = Math.max(1, imageHeightPx);
  const marginMm = getMarginMm(config);
  let marginPt = marginMm * MM_TO_PT;

  let widthPt: number;
  let heightPt: number;

  if (config.pageSize === 'FitToImage') {
    // Normalize longest side around A4 scale (842pt) while preserving exact aspect ratio
    const targetLong = 841.89;
    const scale = targetLong / Math.max(safeImgW, safeImgH);
    const contentW = safeImgW * scale;
    const contentH = safeImgH * scale;
    widthPt = contentW + marginPt * 2;
    heightPt = contentH + marginPt * 2;

    if (config.orientation === 'landscape' && heightPt > widthPt) {
      [widthPt, heightPt] = [heightPt, widthPt];
    } else if (config.orientation === 'portrait' && widthPt > heightPt) {
      [widthPt, heightPt] = [heightPt, widthPt];
    }
  } else {
    if (config.pageSize === 'Custom') {
      widthPt = Math.max(72, unitToPt(config.customWidth, config.customUnit));
      heightPt = Math.max(72, unitToPt(config.customHeight, config.customUnit));
    } else {
      const preset =
        STANDARD_PAGE_SIZES.find((s) => s.id === config.pageSize) ?? STANDARD_PAGE_SIZES[0];
      widthPt = preset.widthMm * MM_TO_PT;
      heightPt = preset.heightMm * MM_TO_PT;
    }

    const wantsLandscape =
      config.orientation === 'landscape' ||
      (config.orientation === 'auto' && safeImgW > safeImgH);

    if (wantsLandscape && heightPt > widthPt) {
      [widthPt, heightPt] = [heightPt, widthPt];
    } else if (!wantsLandscape && widthPt > heightPt) {
      [widthPt, heightPt] = [heightPt, widthPt];
    }
  }

  // Ensure margins never exceed 35% of page dimension
  const maxSafeMargin = Math.min(widthPt, heightPt) * 0.35;
  marginPt = Math.min(marginPt, maxSafeMargin);

  return {
    pageWidthPt: widthPt,
    pageHeightPt: heightPt,
    pageWidthMm: widthPt / MM_TO_PT,
    pageHeightMm: heightPt / MM_TO_PT,
    marginPt,
    resolvedOrientation: widthPt >= heightPt ? 'landscape' : 'portrait',
  };
}

export interface PlacementRect {
  x: number;
  y: number; // PDF coordinate system or top-down (symmetric centered)
  width: number;
  height: number;
  clipX: number;
  clipY: number;
  clipWidth: number;
  clipHeight: number;
}

/**
 * Computes exact image placement rectangle inside the margin box.
 * Identical math drives both Live Preview and pdf-lib output.
 */
export function computeImagePlacement(
  pageWidthPt: number,
  pageHeightPt: number,
  marginPt: number,
  imgWidth: number,
  imgHeight: number,
  placement: ImagePlacement
): PlacementRect {
  const availW = Math.max(10, pageWidthPt - marginPt * 2);
  const availH = Math.max(10, pageHeightPt - marginPt * 2);
  const imgRatio = Math.max(1, imgWidth) / Math.max(1, imgHeight);
  const boxRatio = availW / availH;

  let drawW = availW;
  let drawH = availH;

  switch (placement) {
    case 'fit': {
      // Stretch/fit to fill available content box
      drawW = availW;
      drawH = availH;
      break;
    }
    case 'fill': {
      // Cover available content box while maintaining aspect ratio (clipped to margin box)
      if (imgRatio > boxRatio) {
        drawH = availH;
        drawW = availH * imgRatio;
      } else {
        drawW = availW;
        drawH = availW / imgRatio;
      }
      break;
    }
    case 'center': {
      // Center at natural scaled print size (max 78% of box so clean breathing frame appears)
      const naturalW = imgWidth * 0.45;
      const naturalH = imgHeight * 0.45;
      const maxW = availW * 0.85;
      const maxH = availH * 0.85;
      const scale = Math.min(1, maxW / naturalW, maxH / naturalH);
      drawW = naturalW * scale;
      drawH = naturalH * scale;
      break;
    }
    case 'maintain_aspect':
    default: {
      // Contain inside margin box preserving exact aspect ratio
      if (imgRatio > boxRatio) {
        drawW = availW;
        drawH = availW / imgRatio;
      } else {
        drawH = availH;
        drawW = availH * imgRatio;
      }
      break;
    }
  }

  const x = marginPt + (availW - drawW) / 2;
  const y = marginPt + (availH - drawH) / 2;

  return {
    x,
    y,
    width: drawW,
    height: drawH,
    clipX: marginPt,
    clipY: marginPt,
    clipWidth: availW,
    clipHeight: availH,
  };
}
