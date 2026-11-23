export type FilterId =
  | 'original'
  | 'auto_enhance'
  | 'document'
  | 'bw'
  | 'grayscale'
  | 'bright'
  | 'dark'
  | 'high_contrast'
  | 'sharpen'
  | 'vintage';

export interface FilterDefinition {
  id: FilterId;
  label: string;
  description: string;
}

export const FILTERS: FilterDefinition[] = [
  { id: 'original', label: 'Original', description: 'Unmodified source image' },
  { id: 'auto_enhance', label: 'Auto Enhance', description: 'Balanced levels & crisp color' },
  { id: 'document', label: 'Document', description: 'Clean white paper & dark text' },
  { id: 'bw', label: 'Black & White', description: 'High-contrast monochrome scan' },
  { id: 'grayscale', label: 'Grayscale', description: 'Natural tonal gray levels' },
  { id: 'bright', label: 'Bright', description: 'Lifted exposure & shadows' },
  { id: 'dark', label: 'Dark', description: 'Deepened ink & tones' },
  { id: 'high_contrast', label: 'High Contrast', description: 'Strong tonal separation' },
  { id: 'sharpen', label: 'Sharpen', description: 'Enhanced edge micro-detail' },
  { id: 'vintage', label: 'Vintage', description: 'Warm archival paper tone' },
];

export interface CropRect {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0.1..1
  height: number; // 0.1..1
}

export interface ImageEditState {
  filter: FilterId;
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  sharpness: number; // 0..100
  rotation: 0 | 90 | 180 | 270;
  crop: CropRect;
  perspectiveX: number; // -30..30 (horizontal keystone %)
  perspectiveY: number; // -30..30 (vertical keystone %)
}

export const DEFAULT_EDIT_STATE: ImageEditState = {
  filter: 'original',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  rotation: 0,
  crop: { x: 0, y: 0, width: 1, height: 1 },
  perspectiveX: 0,
  perspectiveY: 0,
};

export interface SelectedImage {
  id: string;
  name: string;
  originalUrl: string; // Never mutated
  mimeType: string;
  naturalWidth: number;
  naturalHeight: number;
  source: 'gallery' | 'camera' | 'sample';
  edit: ImageEditState;
  previewUrl?: string; // Rendered working copy thumbnail
}

export type PageSizeId =
  | 'A4'
  | 'A3'
  | 'A5'
  | 'Letter'
  | 'Legal'
  | 'Executive'
  | 'FitToImage'
  | 'Custom';

export type MeasurementUnit = 'mm' | 'cm' | 'in';

export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export type MarginPreset = 'none' | 'small' | 'medium' | 'large' | 'custom';

export type ImagePlacement = 'fit' | 'fill' | 'maintain_aspect' | 'center';

export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

export interface PdfPageConfig {
  pageSize: PageSizeId;
  customWidth: number;
  customHeight: number;
  customUnit: MeasurementUnit;
  orientation: PageOrientation;
  marginPreset: MarginPreset;
  customMarginMm: number;
  placement: ImagePlacement;
  quality: ImageQuality;
}

export interface PdfDocumentRecord {
  id: string;
  name: string; // includes .pdf
  fileSize: number; // bytes
  pageCount: number;
  pageSizeLabel: string;
  orientation: PageOrientation;
  marginsLabel: string;
  quality: ImageQuality;
  createdAt: number; // unix timestamp ms
  isFavorite: boolean;
  thumbnailDataUrl: string;
  pdfBlob: Blob;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'hi';

export interface AppSettings {
  theme: ThemeMode;
  defaultPageSize: Exclude<PageSizeId, 'Custom'>;
  defaultOrientation: PageOrientation;
  defaultQuality: ImageQuality;
  defaultMarginPreset: Exclude<MarginPreset, 'custom'>;
  language: AppLanguage;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  defaultPageSize: 'A4',
  defaultOrientation: 'auto',
  defaultQuality: 'high',
  defaultMarginPreset: 'small',
  language: 'en',
};

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'size_asc'
  | 'size_desc';

export type PdfListFilter = 'all' | 'recent' | 'favorites';

export type AppRoute =
  | 'home'
  | 'my_pdfs'
  | 'settings'
  | 'gallery'
  | 'camera'
  | 'editor'
  | 'page_settings'
  | 'create_pdf'
  | 'pdf_success'
  | 'pdf_reader';
