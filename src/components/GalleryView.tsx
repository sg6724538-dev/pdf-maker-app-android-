import { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  FolderPlus,
  GripVertical,
  ImagePlus,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import { loadImageElement } from '../filters/imageEngine';
import {
  isNativeAndroid,
  pickGalleryImagesNative,
} from '../platform/capacitorBridge';
import {
  DEFAULT_EDIT_STATE,
  type AppRoute,
  type SelectedImage,
} from '../types/pdf';
import { generateId, SAMPLE_SCANS } from '../utils/format';
import { WizardHeader } from './WizardHeader';

interface GalleryViewProps {
  images: SelectedImage[];
  onAddImages: (newImages: SelectedImage[]) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
  onEditImage: (index: number) => void;
  onOpenCamera: () => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: AppRoute) => void;
  canNavigateToStep: (step: AppRoute) => boolean;
}

const SUPPORTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function GalleryView({
  images,
  onAddImages,
  onRemoveImage,
  onReorderImages,
  onEditImage,
  onOpenCamera,
  onNext,
  onBack,
  onStepClick,
  canNavigateToStep,
}: GalleryViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFileList = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    setLoadingFiles(true);
    const added: SelectedImage[] = [];
    const rejected: string[] = [];

    for (const file of list) {
      const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!SUPPORTED_MIME.has(file.type.toLowerCase()) && !extOk) {
        rejected.push(`${file.name} (unsupported format)`);
        continue;
      }

      try {
        const objectUrl = URL.createObjectURL(file);
        const img = await loadImageElement(objectUrl);
        added.push({
          id: generateId(),
          name: file.name,
          originalUrl: objectUrl,
          mimeType: file.type || 'image/jpeg',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          source: 'gallery',
          edit: {
            ...DEFAULT_EDIT_STATE,
            crop: { ...DEFAULT_EDIT_STATE.crop },
          },
        });
      } catch {
        rejected.push(`${file.name} (corrupted or unreadable)`);
      }
    }

    setLoadingFiles(false);

    if (added.length > 0) {
      onAddImages(added);
    }
    if (rejected.length > 0) {
      setErrorMsg(
        `Skipped ${rejected.length} ${rejected.length === 1 ? 'file' : 'files'}: ${rejected.slice(0, 2).join(', ')}. Supported formats: JPG, JPEG, PNG, WEBP.`
      );
    }
  };

  const handleLoadSamples = async () => {
    setErrorMsg(null);
    setLoadingFiles(true);
    const added: SelectedImage[] = [];

    for (const sample of SAMPLE_SCANS) {
      try {
        const img = await loadImageElement(sample.url);
        added.push({
          id: generateId(),
          name: sample.name,
          originalUrl: sample.url,
          mimeType: 'image/jpeg',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          source: 'sample',
          edit: {
            ...DEFAULT_EDIT_STATE,
            crop: { ...DEFAULT_EDIT_STATE.crop },
          },
        });
      } catch {
        // Ignore unavailable sample gracefully
      }
    }

    setLoadingFiles(false);
    if (added.length > 0) {
      onAddImages(added);
    }
  };

  const handlePickPhotos = async () => {
    setErrorMsg(null);
    if (isNativeAndroid()) {
      setLoadingFiles(true);
      try {
        const res = await pickGalleryImagesNative();
        setLoadingFiles(false);
        if (res.status === 'picked') {
          onAddImages(res.images);
          return;
        }
        if (res.status === 'cancelled') {
          return;
        }
      } catch {
        setLoadingFiles(false);
        // Fallback to standard file picker if native photo picker fails
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void processFileList(e.target.files);
      e.target.value = '';
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFileList(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <WizardHeader
        currentStep="gallery"
        title="Image to PDF"
        subtitle="Select, reorder, and organize pages before editing or converting."
        onBack={onBack}
        onStepClick={onStepClick}
        canNavigateToStep={canNavigateToStep}
        rightSlot={
          images.length > 0 ? (
            <button
              type="button"
              onClick={onNext}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5AFE]"
            >
              <span>Next: Edit ({images.length})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[#E52535]/30 bg-[#FDECEE] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#E52535]/40 dark:bg-[#3A161C] dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drop Zone / Picker Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDraggingFiles(true);
        }}
        onDragLeave={() => setDraggingFiles(false)}
        onDrop={handleDropZoneDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
          draggingFiles
            ? 'border-[#536DFE] bg-[#EEF1FF]/70 dark:bg-[#1E2754]/50'
            : 'border-slate-200 bg-[#F8FAFC] dark:border-slate-800 dark:bg-[#111827]'
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#536DFE] dark:bg-[#1E2754] dark:text-[#93A4FF]">
          <Upload className="h-6 w-6" />
        </div>

        <h2 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
          {images.length === 0
            ? 'Select photos from gallery or drop images here'
            : 'Add more photos from your device'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          Supports JPG, JPEG, PNG, and WEBP · Multi-select enabled
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={loadingFiles}
            onClick={() => void handlePickPhotos()}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE] disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            <span>{images.length === 0 ? 'Pick Photos' : 'Add More Photos'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCamera}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Camera className="h-4 w-4 text-[#E52535]" />
            <span>Scan with Camera</span>
          </button>

          <button
            type="button"
            disabled={loadingFiles}
            onClick={handleLoadSamples}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-[#536DFE] hover:text-[#536DFE] dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-300 dark:hover:border-[#536DFE]"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Load Sample Scans</span>
          </button>
        </div>
      </div>

      {/* Selected Images Grid */}
      {images.length > 0 && (
        <section aria-label="Selected pages" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                Selected Pages ({images.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag cards or use arrows to change PDF page order.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== idx) {
                    onReorderImages(dragIndex, idx);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all dark:bg-[#141C2E] ${
                  dragOverIndex === idx
                    ? 'border-[#536DFE] ring-2 ring-[#536DFE]/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={item.previewUrl || item.originalUrl}
                    alt={`Page ${idx + 1}: ${item.name}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />

                  {/* Top overlay controls */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-slate-950/65 via-slate-950/25 to-transparent p-2.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950/75 px-2 py-1 font-mono text-xs font-semibold text-white tabular-nums">
                      <GripVertical className="h-3.5 w-3.5 opacity-75" />
                      Page {idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveImage(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/75 text-white transition-colors hover:bg-[#E52535]"
                      aria-label={`Remove page ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card footer controls */}
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onReorderImages(idx, idx - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                      aria-label={`Move page ${idx + 1} earlier`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => onReorderImages(idx, idx + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                      aria-label={`Move page ${idx + 1} later`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditImage(idx)}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#EEF1FF] px-3 py-1.5 text-xs font-semibold text-[#3D5AFE] transition-colors hover:bg-[#DFE5FF] dark:bg-[#1E2754] dark:text-[#93A4FF] dark:hover:bg-[#28336B]"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Continue Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-[#141C2E]">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-mono font-bold text-slate-950 tabular-nums dark:text-white">
                {images.length}
              </span>{' '}
              {images.length === 1 ? 'image' : 'images'} ready for filters and page layout
            </div>
            <button
              type="button"
              onClick={onNext}
              className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#536DFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5AFE]"
            >
              <span>Continue to Image Editor</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
