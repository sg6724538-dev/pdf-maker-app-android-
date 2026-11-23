import { useState } from 'react';
import {
  AlertCircle,
  FileCheck2,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  getMarginLabel,
  getPageSizeDisplayLabel,
} from '../pagesize/pageSizeEngine';
import {
  generateAndSavePdf,
  type PdfGenerationProgress,
} from '../pdfgenerator/pdfGenerator';
import {
  FILTERS,
  type AppRoute,
  type ImageQuality,
  type PdfDocumentRecord,
  type PdfPageConfig,
  type SelectedImage,
} from '../types/pdf';
import { defaultPdfName } from '../utils/format';
import { WizardHeader } from './WizardHeader';

interface CreatePdfViewProps {
  images: SelectedImage[];
  config: PdfPageConfig;
  existingFilenames: string[];
  onChangeConfig: (next: PdfPageConfig) => void;
  onSuccess: (created: PdfDocumentRecord) => void;
  onBack: () => void;
  onStepClick: (step: AppRoute) => void;
  canNavigateToStep: (step: AppRoute) => boolean;
}

const QUALITY_OPTIONS: {
  id: ImageQuality;
  label: string;
  desc: string;
}[] = [
  { id: 'low', label: 'Low', desc: 'Smallest file size for quick sharing' },
  { id: 'medium', label: 'Medium', desc: 'Balanced clarity and file weight' },
  { id: 'high', label: 'High', desc: 'Crisp document text and sharp images' },
  { id: 'original', label: 'Original Quality', desc: 'Maximum detail & resolution' },
];

export function CreatePdfView({
  images,
  config,
  existingFilenames,
  onChangeConfig,
  onSuccess,
  onBack,
  onStepClick,
  canNavigateToStep,
}: CreatePdfViewProps) {
  const [filename, setFilename] = useState(() =>
    defaultPdfName().replace(/\.pdf$/i, '')
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<PdfGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFiltersList = Array.from(
    new Set(
      images.map(
        (img) => FILTERS.find((f) => f.id === img.edit.filter)?.label ?? 'Original'
      )
    )
  );

  const handleGenerate = async () => {
    if (generating || images.length === 0) return;
    setError(null);
    setGenerating(true);
    setProgress({
      percent: 5,
      message: 'Preparing images...',
      currentPage: 1,
      totalPages: images.length,
    });

    try {
      const created = await generateAndSavePdf({
        images,
        config,
        filename: filename.trim() || defaultPdfName(),
        existingFilenames,
        onProgress: (p) => setProgress(p),
      });
      onSuccess(created);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating the PDF.'
      );
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <WizardHeader
        currentStep="create_pdf"
        title="Create PDF"
        subtitle="Review document settings, choose filename and quality, and generate your PDF."
        onBack={onBack}
        onStepClick={onStepClick}
        canNavigateToStep={(step) => !generating && canNavigateToStep(step)}
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[#E52535]/30 bg-[#FDECEE] p-4 text-sm text-[#B91C1C] dark:border-[#E52535]/40 dark:bg-[#3A161C] dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">PDF Generation Error</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {generating && progress ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#141C2E]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#536DFE] dark:bg-[#1E2754] dark:text-[#93A4FF]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-slate-950 dark:text-white">
            Building your PDF document
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {progress.message}
          </p>

          <div className="mt-6 w-full max-w-md">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${progress.percent}%` }}
                className="h-full rounded-full bg-[#536DFE] transition-all duration-200"
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              <span>
                Page {progress.currentPage} of {progress.totalPages}
              </span>
              <span>{progress.percent}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Form & Quality */}
          <div className="space-y-6 lg:col-span-7">
            {/* Filename Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
              <label
                htmlFor="pdf-output-filename"
                className="font-display text-base font-bold text-slate-950 dark:text-white"
              >
                PDF Filename
              </label>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Duplicate names are automatically numbered to avoid overwriting existing files.
              </p>

              <div className="mt-3 flex items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 focus-within:border-[#536DFE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#536DFE]/20 dark:border-slate-700 dark:bg-slate-900">
                <FileText className="mr-3 h-5 w-5 shrink-0 text-[#E52535]" />
                <input
                  id="pdf-output-filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter PDF document name"
                  className="w-full bg-transparent py-3 text-sm font-medium text-slate-950 outline-none dark:text-white"
                />
                <span className="shrink-0 pl-2 font-mono text-xs font-semibold text-slate-400">
                  .pdf
                </span>
              </div>
            </section>

            {/* Image Quality Selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
                Image Quality
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUALITY_OPTIONS.map((q) => {
                  const selected = config.quality === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, quality: q.id })}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-colors ${
                        selected
                          ? 'border-[#536DFE] bg-[#EEF1FF] dark:bg-[#1E2754]'
                          : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      <span
                        className={`font-display text-sm font-bold ${
                          selected
                            ? 'text-[#3D5AFE] dark:text-[#93A4FF]'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {q.label}
                      </span>
                      <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {q.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Selected Pages Preview Strip */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                  Selected Pages ({images.length})
                </h2>
                <button
                  type="button"
                  onClick={() => onStepClick('editor')}
                  className="text-xs font-semibold text-[#536DFE] hover:text-[#3D5AFE]"
                >
                  Edit Images
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative h-24 w-18 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <img
                      src={img.previewUrl || img.originalUrl}
                      alt={`Page ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Summary & Create Button */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 dark:border-slate-800 dark:bg-[#141C2E]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
                Document Summary
              </h2>

              <dl className="mt-4 divide-y divide-slate-200/80 text-sm dark:divide-slate-800">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Total Pages</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums dark:text-white">
                    {images.length} {images.length === 1 ? 'page' : 'pages'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Page Size</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {getPageSizeDisplayLabel(config)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Orientation</dt>
                  <dd className="font-semibold capitalize text-slate-900 dark:text-white">
                    {config.orientation}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Margins</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {getMarginLabel(config)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Active Filters</dt>
                  <dd className="max-w-[55%] truncate text-right font-semibold text-slate-900 dark:text-white">
                    {activeFiltersList.join(', ')}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Image Quality</dt>
                  <dd className="font-semibold capitalize text-slate-900 dark:text-white">
                    {config.quality}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => void handleGenerate()}
                className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#536DFE] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#536DFE]/25 transition-colors hover:bg-[#3D5AFE] active:scale-[0.99]"
              >
                <FileCheck2 className="h-5 w-5" />
                <span>Create PDF</span>
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-[#536DFE]" />
                <span>Processed privately on your device &amp; saved to My PDFs</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
