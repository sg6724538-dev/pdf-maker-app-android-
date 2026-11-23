import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RectangleHorizontal,
  RectangleVertical,
  Scan,
} from 'lucide-react';
import { getEffectiveDimensions } from '../filters/imageEngine';
import {
  computeImagePlacement,
  MARGIN_PRESETS,
  resolvePageGeometry,
  STANDARD_PAGE_SIZES,
} from '../pagesize/pageSizeEngine';
import type {
  AppRoute,
  ImagePlacement,
  MeasurementUnit,
  PageOrientation,
  PdfPageConfig,
  SelectedImage,
} from '../types/pdf';
import { WizardHeader } from './WizardHeader';

interface PageSettingsViewProps {
  images: SelectedImage[];
  config: PdfPageConfig;
  onChangeConfig: (next: PdfPageConfig) => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: AppRoute) => void;
  canNavigateToStep: (step: AppRoute) => boolean;
}

const PLACEMENT_OPTIONS: {
  id: ImagePlacement;
  label: string;
  desc: string;
}[] = [
  {
    id: 'maintain_aspect',
    label: 'Maintain Aspect Ratio',
    desc: 'Fits cleanly inside margins with original proportions',
  },
  {
    id: 'fit',
    label: 'Fit to Page',
    desc: 'Stretches to fill the printable content bounds',
  },
  {
    id: 'fill',
    label: 'Fill Page',
    desc: 'Covers content area edge-to-edge without distortion',
  },
  {
    id: 'center',
    label: 'Center Image',
    desc: 'Centers the image with generous surrounding whitespace',
  },
];

export function PageSettingsView({
  images,
  config,
  onChangeConfig,
  onNext,
  onBack,
  onStepClick,
  canNavigateToStep,
}: PageSettingsViewProps) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const safeIdx = Math.min(previewIdx, Math.max(0, images.length - 1));
  const currentImg = images[safeIdx];

  const patch = (partial: Partial<PdfPageConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const previewMath = useMemo(() => {
    if (!currentImg) return null;
    const eff = getEffectiveDimensions(
      currentImg.naturalWidth,
      currentImg.naturalHeight,
      currentImg.edit
    );
    const geom = resolvePageGeometry(config, eff.width, eff.height);
    const rect = computeImagePlacement(
      geom.pageWidthPt,
      geom.pageHeightPt,
      geom.marginPt,
      eff.width,
      eff.height,
      config.placement
    );

    // Scale physical PDF page into a crisp preview box (max 320px width, 400px height)
    const maxPreviewW = 310;
    const maxPreviewH = 390;
    const scale = Math.min(
      maxPreviewW / geom.pageWidthPt,
      maxPreviewH / geom.pageHeightPt
    );

    return {
      geom,
      rect,
      scale,
      sheetW: Math.round(geom.pageWidthPt * scale),
      sheetH: Math.round(geom.pageHeightPt * scale),
    };
  }, [config, currentImg]);

  return (
    <div className="space-y-6">
      <WizardHeader
        currentStep="page_settings"
        title="PDF Page Settings"
        subtitle="Configure physical PDF page size, orientation, margins, and image placement."
        onBack={onBack}
        onStepClick={onStepClick}
        canNavigateToStep={canNavigateToStep}
        rightSlot={
          <button
            type="button"
            onClick={onNext}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5AFE]"
          >
            <span>Next: Create PDF</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Controls Column */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Page Size Grid */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Page Size
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Sets the exact physical dimensions of the generated PDF document.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {STANDARD_PAGE_SIZES.map((size) => {
                const selected = config.pageSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => patch({ pageSize: size.id })}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#536DFE] bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                    }`}
                  >
                    <span className="font-display text-sm font-bold">
                      {size.label}
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] opacity-75 tabular-nums">
                      {size.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Size Inputs */}
            {config.pageSize === 'Custom' && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <label
                    htmlFor="custom-width"
                    className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Width
                  </label>
                  <input
                    id="custom-width"
                    type="number"
                    min={10}
                    max={2000}
                    step="0.5"
                    value={config.customWidth}
                    onChange={(e) =>
                      patch({ customWidth: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-[#141C2E] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-height"
                    className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Height
                  </label>
                  <input
                    id="custom-height"
                    type="number"
                    min={10}
                    max={2000}
                    step="0.5"
                    value={config.customHeight}
                    onChange={(e) =>
                      patch({ customHeight: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-[#141C2E] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-unit"
                    className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Unit
                  </label>
                  <select
                    id="custom-unit"
                    value={config.customUnit}
                    onChange={(e) =>
                      patch({ customUnit: e.target.value as MeasurementUnit })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-[#141C2E] dark:text-white"
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* 2. Orientation */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Orientation
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'portrait', label: 'Portrait', icon: RectangleVertical },
                  { id: 'landscape', label: 'Landscape', icon: RectangleHorizontal },
                  { id: 'auto', label: 'Auto', icon: Scan },
                ] as { id: PageOrientation; label: string; icon: typeof Scan }[]
              ).map((opt) => {
                const Icon = opt.icon;
                const active = config.orientation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ orientation: opt.id })}
                    className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#536DFE] bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Margins */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Margins
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {MARGIN_PRESETS.map((m) => {
                const active = config.marginPreset === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => patch({ marginPreset: m.id })}
                    className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-colors ${
                      active
                        ? 'border-[#536DFE] bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold whitespace-nowrap">{m.label}</span>
                    {m.id !== 'custom' && (
                      <span className="font-mono text-[10px] opacity-75 tabular-nums">
                        {m.mm} mm
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {config.marginPreset === 'custom' && (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 dark:border-slate-700 dark:bg-slate-900">
                <label
                  htmlFor="custom-margin-slider"
                  className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Margin size
                </label>
                <input
                  id="custom-margin-slider"
                  type="range"
                  min={0}
                  max={50}
                  value={config.customMarginMm}
                  onChange={(e) => patch({ customMarginMm: Number(e.target.value) })}
                  className="editor-slider flex-1"
                />
                <span className="w-16 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums dark:text-white">
                  {config.customMarginMm} mm
                </span>
              </div>
            )}
          </section>

          {/* 4. Image Placement */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Image Placement
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PLACEMENT_OPTIONS.map((opt) => {
                const active = config.placement === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ placement: opt.id })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                      active
                        ? 'border-[#536DFE] bg-[#EEF1FF] dark:bg-[#1E2754]'
                        : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? 'bg-[#536DFE] text-white'
                          : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {opt.id === 'center' ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          active
                            ? 'text-[#3D5AFE] dark:text-[#93A4FF]'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Sticky Live PDF Page Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-[#F4F6FA] p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex w-full items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                  Live PDF Page Preview
                </h2>
                {previewMath && (
                  <p className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {Math.round(previewMath.geom.pageWidthMm)} ×{' '}
                    {Math.round(previewMath.geom.pageHeightMm)} mm ·{' '}
                    {previewMath.geom.resolvedOrientation}
                  </p>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeIdx === 0}
                    onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
                    aria-label="Previous preview page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {safeIdx + 1}/{images.length}
                  </span>
                  <button
                    type="button"
                    disabled={safeIdx === images.length - 1}
                    onClick={() =>
                      setPreviewIdx((i) => Math.min(images.length - 1, i + 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
                    aria-label="Next preview page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Scaled Physical Paper Sheet */}
            <div className="my-6 flex min-h-[400px] w-full items-center justify-center">
              {previewMath && currentImg && (
                <div
                  style={{
                    width: `${previewMath.sheetW}px`,
                    height: `${previewMath.sheetH}px`,
                  }}
                  className="relative overflow-hidden bg-white shadow-[0_14px_36px_rgba(15,23,42,0.16)] ring-1 ring-slate-200 transition-all duration-200"
                >
                  {/* Margin Content Box (clips when placement is Fill Page) */}
                  <div
                    style={{
                      left: `${previewMath.rect.clipX * previewMath.scale}px`,
                      top: `${previewMath.rect.clipY * previewMath.scale}px`,
                      width: `${previewMath.rect.clipWidth * previewMath.scale}px`,
                      height: `${previewMath.rect.clipHeight * previewMath.scale}px`,
                    }}
                    className="absolute overflow-hidden"
                  >
                    <img
                      src={currentImg.previewUrl || currentImg.originalUrl}
                      alt={`PDF layout preview page ${safeIdx + 1}`}
                      referrerPolicy="no-referrer"
                      style={{
                        left: `${(previewMath.rect.x - previewMath.rect.clipX) * previewMath.scale}px`,
                        top: `${(previewMath.rect.y - previewMath.rect.clipY) * previewMath.scale}px`,
                        width: `${previewMath.rect.width * previewMath.scale}px`,
                        height: `${previewMath.rect.height * previewMath.scale}px`,
                      }}
                      className="absolute max-w-none"
                    />
                  </div>

                  {/* Subtle dashed margin guide when margins > 0 */}
                  {previewMath.geom.marginPt > 0 && (
                    <div
                      style={{
                        left: `${previewMath.geom.marginPt * previewMath.scale}px`,
                        top: `${previewMath.geom.marginPt * previewMath.scale}px`,
                        width: `${(previewMath.geom.pageWidthPt - previewMath.geom.marginPt * 2) * previewMath.scale}px`,
                        height: `${(previewMath.geom.pageHeightPt - previewMath.geom.marginPt * 2) * previewMath.scale}px`,
                      }}
                      className="pointer-events-none absolute border border-dashed border-[#536DFE]/45"
                    />
                  )}
                </div>
              )}
            </div>

            {previewMath && (
              <div className="w-full space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>PDF Dimensions (Points)</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-200">
                    {Math.round(previewMath.geom.pageWidthPt)} ×{' '}
                    {Math.round(previewMath.geom.pageHeightPt)} pt
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onNext}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
                >
                  <span>Continue to Finalize PDF</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
