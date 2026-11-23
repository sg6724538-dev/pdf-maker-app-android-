import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CopyCheck,
  Crop,
  Grid,
  RotateCcw,
  RotateCw,
  Sliders,
  Sparkles,
  Undo2,
} from 'lucide-react';
import {
  renderEditedCanvas,
  renderFilterThumbnail,
} from '../filters/imageEngine';
import {
  DEFAULT_EDIT_STATE,
  FILTERS,
  type AppRoute,
  type CropRect,
  type FilterId,
  type ImageEditState,
  type SelectedImage,
} from '../types/pdf';
import { WizardHeader } from './WizardHeader';

interface EditorViewProps {
  images: SelectedImage[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
  onUpdateImageEdit: (id: string, edit: ImageEditState, previewUrl?: string) => void;
  onApplyFilterToAll: (filter: FilterId) => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: AppRoute) => void;
  canNavigateToStep: (step: AppRoute) => boolean;
}

type EditorTab = 'filters' | 'adjust' | 'crop' | 'perspective';

export function EditorView({
  images,
  activeIndex,
  onSelectIndex,
  onUpdateImageEdit,
  onApplyFilterToAll,
  onNext,
  onBack,
  onStepClick,
  canNavigateToStep,
}: EditorViewProps) {
  const safeIdx = Math.min(Math.max(0, activeIndex), Math.max(0, images.length - 1));
  const activeImage = images[safeIdx];

  const [tab, setTab] = useState<EditorTab>('filters');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [rendering, setRendering] = useState(false);
  const [filterThumbs, setFilterThumbs] = useState<Partial<Record<FilterId, string>>>({});
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);

  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const [dragHandle, setDragHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const dragOriginRef = useRef<{
    clientX: number;
    clientY: number;
    rect: CropRect;
  } | null>(null);

  // Render active main canvas preview whenever edit changes
  useEffect(() => {
    if (!activeImage) return;
    let cancelled = false;
    setRendering(true);

    const timer = window.setTimeout(async () => {
      try {
        const canvas = await renderEditedCanvas(activeImage.originalUrl, activeImage.edit, {
          maxDimension: 960,
          ignoreCrop: tab === 'crop',
        });
        if (cancelled) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreviewSrc(dataUrl);

        // Save cropped preview thumbnail back to parent state for gallery/summary
        if (tab !== 'crop') {
          onUpdateImageEdit(activeImage.id, activeImage.edit, dataUrl);
        }
      } catch (err) {
        console.error('Preview render failed:', err);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, 45);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImage?.id, activeImage?.edit, tab]);

  // Generate 10 live filter preview thumbnails for the active image
  useEffect(() => {
    if (!activeImage) return;
    let cancelled = false;
    setFilterThumbs({});

    const run = async () => {
      for (const f of FILTERS) {
        if (cancelled) return;
        try {
          const thumb = await renderFilterThumbnail(
            activeImage.originalUrl,
            { ...DEFAULT_EDIT_STATE, rotation: activeImage.edit.rotation, crop: activeImage.edit.crop },
            f.id
          );
          if (!cancelled) {
            setFilterThumbs((prev) => ({ ...prev, [f.id]: thumb }));
          }
        } catch {
          // Skip failed thumb gracefully
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImage?.id, activeImage?.edit.rotation]);

  const patchEdit = useCallback(
    (patch: Partial<ImageEditState>) => {
      if (!activeImage) return;
      onUpdateImageEdit(activeImage.id, {
        ...activeImage.edit,
        ...patch,
      });
    },
    [activeImage, onUpdateImageEdit]
  );

  const rotateBy = (delta: 90 | -90) => {
    if (!activeImage) return;
    const next = ((activeImage.edit.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270;
    patchEdit({ rotation: next });
  };

  const resetAllEdits = () => {
    if (!activeImage) return;
    onUpdateImageEdit(activeImage.id, {
      ...DEFAULT_EDIT_STATE,
      crop: { ...DEFAULT_EDIT_STATE.crop },
    });
  };

  const applyAspectCrop = (ratio: number | null) => {
    if (!activeImage) return;
    if (ratio === null) {
      patchEdit({ crop: { x: 0, y: 0, width: 1, height: 1 } });
      return;
    }
    const imgRatio = activeImage.naturalWidth / Math.max(1, activeImage.naturalHeight);
    let w = 1;
    let h = 1;
    if (imgRatio > ratio) {
      w = ratio / imgRatio;
      h = 1;
    } else {
      w = 1;
      h = imgRatio / ratio;
    }
    patchEdit({
      crop: {
        x: (1 - w) / 2,
        y: (1 - h) / 2,
        width: w,
        height: h,
      },
    });
  };

  // Interactive crop drag pointer handlers
  const handleCropPointerDown = (
    e: React.PointerEvent,
    handle: 'tl' | 'tr' | 'bl' | 'br' | 'move'
  ) => {
    if (!activeImage) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragHandle(handle);
    dragOriginRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      rect: { ...activeImage.edit.crop },
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!dragHandle || !dragOriginRef.current || !cropStageRef.current || !activeImage) return;
    const bounds = cropStageRef.current.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const dx = (e.clientX - dragOriginRef.current.clientX) / bounds.width;
    const dy = (e.clientY - dragOriginRef.current.clientY) / bounds.height;
    const orig = dragOriginRef.current.rect;
    const minSize = 0.15;

    let { x, y, width, height } = orig;

    if (dragHandle === 'move') {
      x = Math.min(1 - width, Math.max(0, orig.x + dx));
      y = Math.min(1 - height, Math.max(0, orig.y + dy));
    } else {
      if (dragHandle === 'tl' || dragHandle === 'bl') {
        const newX = Math.min(orig.x + orig.width - minSize, Math.max(0, orig.x + dx));
        width = orig.width + (orig.x - newX);
        x = newX;
      }
      if (dragHandle === 'tr' || dragHandle === 'br') {
        width = Math.min(1 - orig.x, Math.max(minSize, orig.width + dx));
      }
      if (dragHandle === 'tl' || dragHandle === 'tr') {
        const newY = Math.min(orig.y + orig.height - minSize, Math.max(0, orig.y + dy));
        height = orig.height + (orig.y - newY);
        y = newY;
      }
      if (dragHandle === 'bl' || dragHandle === 'br') {
        height = Math.min(1 - orig.y, Math.max(minSize, orig.height + dy));
      }
    }

    patchEdit({ crop: { x, y, width, height } });
  };

  const handleCropPointerUp = () => {
    setDragHandle(null);
    dragOriginRef.current = null;
  };

  if (!activeImage) {
    return null;
  }

  const activeFilterLabel =
    FILTERS.find((f) => f.id === activeImage.edit.filter)?.label ?? 'Original';

  return (
    <div className="space-y-5">
      <WizardHeader
        currentStep="editor"
        title="Image Editor & Filters"
        subtitle={`Editing Page ${safeIdx + 1} of ${images.length} · Non-destructive working copy`}
        onBack={onBack}
        onStepClick={onStepClick}
        canNavigateToStep={canNavigateToStep}
        rightSlot={
          <button
            type="button"
            onClick={onNext}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5AFE]"
          >
            <span>Next: Page Size</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        }
      />

      {/* Page Switcher Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const selected = idx === safeIdx;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 transition-colors ${
                  selected
                    ? 'border-[#536DFE] bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-[#141C2E] dark:text-slate-300'
                }`}
              >
                <img
                  src={img.previewUrl || img.originalUrl}
                  alt={`Select page ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-10 w-8 rounded-lg object-cover"
                />
                <div className="text-left">
                  <div className="font-mono text-xs font-bold tabular-nums">
                    Page {idx + 1}
                  </div>
                  <div className="max-w-[90px] truncate text-[11px] opacity-80">
                    {FILTERS.find((f) => f.id === img.edit.filter)?.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Editor Two-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Canvas Preview Stage */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-[#F4F6FA] p-4 lg:col-span-7 dark:border-slate-800 dark:bg-[#111827]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activeImage.name}
              </span>
              <span aria-hidden="true">·</span>
              <span>Filter: {activeFilterLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activeImage.edit.rotation}°</span>
            </div>
            <button
              type="button"
              onClick={resetAllEdits}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-[#E52535] transition-colors hover:bg-[#FDECEE] dark:hover:bg-[#3A161C]"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Reset Editing</span>
            </button>
          </div>

          <div
            className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-200/70 p-4 sm:min-h-[440px] dark:bg-slate-950/70"
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
          >
            {previewSrc ? (
              <div ref={cropStageRef} className="relative inline-block max-h-[460px] max-w-full">
                <img
                  src={previewSrc}
                  alt={`Edited preview of ${activeImage.name}`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="block max-h-[460px] max-w-full select-none rounded-lg shadow-md"
                />

                {/* Perspective Alignment Guide Overlay */}
                {tab === 'perspective' && (
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-lg border border-[#536DFE]/70">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-[#536DFE]/25" />
                    ))}
                  </div>
                )}

                {/* Interactive Draggable Crop Frame */}
                {tab === 'crop' && (
                  <div
                    style={{
                      left: `${activeImage.edit.crop.x * 100}%`,
                      top: `${activeImage.edit.crop.y * 100}%`,
                      width: `${activeImage.edit.crop.width * 100}%`,
                      height: `${activeImage.edit.crop.height * 100}%`,
                    }}
                    onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                    className="absolute cursor-move touch-none border-2 border-[#536DFE] bg-[#536DFE]/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]"
                  >
                    {/* Rule of thirds lines */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/35" />
                      ))}
                    </div>

                    {/* 4 draggable corner handles */}
                    {(
                      [
                        { id: 'tl', pos: '-top-2.5 -left-2.5 cursor-nwse-resize' },
                        { id: 'tr', pos: '-top-2.5 -right-2.5 cursor-nesw-resize' },
                        { id: 'bl', pos: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
                        { id: 'br', pos: '-bottom-2.5 -right-2.5 cursor-nwse-resize' },
                      ] as const
                    ).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        aria-label={`Resize crop handle ${h.id}`}
                        onPointerDown={(e) => handleCropPointerDown(e, h.id)}
                        className={`absolute h-5 w-5 rounded-full border-2 border-white bg-[#536DFE] shadow-md ${h.pos}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Rendering preview...</div>
            )}

            {rendering && (
              <div className="pointer-events-none absolute right-3 bottom-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-white">
                Updating...
              </div>
            )}
          </div>
        </div>

        {/* Editing Controls Panel */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:col-span-5 dark:border-slate-800 dark:bg-[#141C2E]">
          {/* Tool Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            {(
              [
                { id: 'filters', label: 'Filters', icon: Sparkles },
                { id: 'adjust', label: 'Adjust', icon: Sliders },
                { id: 'crop', label: 'Crop', icon: Crop },
                { id: 'perspective', label: 'Tilt', icon: Grid },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors sm:flex-row sm:gap-1.5 ${
                    active
                      ? 'bg-white text-[#536DFE] shadow-xs dark:bg-[#1E2754] dark:text-[#93A4FF]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex-1">
            {/* TAB 1: 10 FILTERS WITH LIVE THUMBNAILS */}
            {tab === 'filters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tap any preset to preview &amp; apply to Page {safeIdx + 1}.
                  </p>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFilterToAll(activeImage.edit.filter);
                        setAppliedAllNotice(true);
                        window.setTimeout(() => setAppliedAllNotice(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#536DFE] hover:text-[#3D5AFE] whitespace-nowrap"
                    >
                      <CopyCheck className="h-3.5 w-3.5" />
                      <span>{appliedAllNotice ? 'Applied to all' : 'Apply to all'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                  {FILTERS.map((f) => {
                    const selected = activeImage.edit.filter === f.id;
                    const thumb = filterThumbs[f.id];
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => patchEdit({ filter: f.id })}
                        className={`flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-[#536DFE] ring-2 ring-[#536DFE]/25'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={`${f.label} filter preview`}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
                          )}
                        </div>
                        <div
                          className={`px-2 py-1.5 text-center text-xs font-semibold truncate ${
                            selected
                              ? 'bg-[#536DFE] text-white'
                              : 'bg-white text-slate-700 dark:bg-[#141C2E] dark:text-slate-200'
                          }`}
                        >
                          {f.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: FINE-TUNE ADJUSTMENTS */}
            {tab === 'adjust' && (
              <div className="space-y-5">
                {(
                  [
                    { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
                    { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
                    { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
                  ] as const
                ).map((ctrl) => {
                  const val = activeImage.edit[ctrl.key];
                  return (
                    <div key={ctrl.key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <label
                          htmlFor={`slider-${ctrl.key}`}
                          className="font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {ctrl.label}
                        </label>
                        <span className="font-mono text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
                          {val > 0 ? `+${val}` : val}
                        </span>
                      </div>
                      <input
                        id={`slider-${ctrl.key}`}
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={val}
                        onChange={(e) =>
                          patchEdit({ [ctrl.key]: Number(e.target.value) })
                        }
                        className="editor-slider w-full"
                      />
                    </div>
                  );
                })}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      patchEdit({
                        brightness: 0,
                        contrast: 0,
                        saturation: 0,
                        sharpness: 0,
                      })
                    }
                    className="min-h-[40px] rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset Sliders
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CROP & ROTATE */}
            {tab === 'crop' && (
              <div className="space-y-5">
                <div>
                  <div className="mb-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Rotate Image
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => rotateBy(-90)}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#536DFE] hover:text-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Rotate Left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateBy(90)}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#536DFE] hover:text-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <RotateCw className="h-4 w-4" />
                      <span>Rotate Right</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Crop Aspect Presets
                  </div>
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    Drag the blue corners on the image to crop freely, or pick a standard proportion.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: 'Full Image', ratio: null },
                      { label: 'A4 Portrait', ratio: 210 / 297 },
                      { label: 'A4 Landscape', ratio: 297 / 210 },
                      { label: '4 : 3', ratio: 4 / 3 },
                      { label: '3 : 4', ratio: 3 / 4 },
                      { label: '1 : 1 Square', ratio: 1 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyAspectCrop(preset.ratio)}
                        className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#536DFE] hover:bg-[#EEF1FF] hover:text-[#3D5AFE] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#1E2754]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#F4F6FA] p-3 text-xs text-slate-600 tabular-nums dark:bg-slate-900 dark:text-slate-400">
                  Active crop area:{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {Math.round(activeImage.edit.crop.width * 100)}% ×{' '}
                    {Math.round(activeImage.edit.crop.height * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: PERSPECTIVE CORRECTION */}
            {tab === 'perspective' && (
              <div className="space-y-5">
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Correct angled document photos by adjusting vertical and horizontal keystone tilt against the alignment grid.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label
                      htmlFor="slider-persp-y"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Vertical Perspective
                    </label>
                    <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {activeImage.edit.perspectiveY > 0
                        ? `+${activeImage.edit.perspectiveY}%`
                        : `${activeImage.edit.perspectiveY}%`}
                    </span>
                  </div>
                  <input
                    id="slider-persp-y"
                    type="range"
                    min={-30}
                    max={30}
                    value={activeImage.edit.perspectiveY}
                    onChange={(e) =>
                      patchEdit({ perspectiveY: Number(e.target.value) })
                    }
                    className="editor-slider w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label
                      htmlFor="slider-persp-x"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Horizontal Perspective
                    </label>
                    <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {activeImage.edit.perspectiveX > 0
                        ? `+${activeImage.edit.perspectiveX}%`
                        : `${activeImage.edit.perspectiveX}%`}
                    </span>
                  </div>
                  <input
                    id="slider-persp-x"
                    type="range"
                    min={-30}
                    max={30}
                    value={activeImage.edit.perspectiveX}
                    onChange={(e) =>
                      patchEdit({ perspectiveX: Number(e.target.value) })
                    }
                    className="editor-slider w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => patchEdit({ perspectiveX: 0, perspectiveY: 0 })}
                  className="min-h-[40px] rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reset Perspective
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
