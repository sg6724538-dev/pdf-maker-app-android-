import { useState } from 'react';
import {
  Check,
  Download,
  Globe,
  HardDrive,
  Info,
  Moon,
  Share2,
  ShieldCheck,
  Star,
  Sun,
  Monitor,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AppLanguage,
  AppSettings,
  ImageQuality,
  MarginPreset,
  PageOrientation,
  PageSizeId,
  PdfDocumentRecord,
  ThemeMode,
} from '../types/pdf';
import { exportPdfToDevice } from '../platform/capacitorBridge';
import { formatFileSize } from '../utils/format';

interface SettingsViewProps {
  settings: AppSettings;
  documents: PdfDocumentRecord[];
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onClearAllPdfs: () => Promise<void>;
}

export function SettingsView({
  settings,
  documents,
  onUpdateSettings,
  onClearAllPdfs,
}: SettingsViewProps) {
  const [modal, setModal] = useState<'privacy' | 'about' | 'rate' | 'clear' | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const totalBytes = documents.reduce((acc, d) => acc + d.fileSize, 0);
  const totalPages = documents.reduce((acc, d) => acc + d.pageCount, 0);

  const handleExportAll = async () => {
    setExportStatus('Exporting...');
    for (let idx = 0; idx < documents.length; idx++) {
      try {
        await exportPdfToDevice(documents[idx]);
      } catch {
        // Continue exporting remaining files
      }
      await new Promise((r) => window.setTimeout(r, 150));
    }
    setExportStatus(`Exported ${documents.length} PDFs`);
    window.setTimeout(() => setExportStatus(null), 2800);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'PDF Maker – Image to PDF',
      text: 'Convert images and camera scans into crisp, custom-sized PDF documents.',
      url: window.location.href,
    };
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize default PDF preferences, appearance, language, and local storage.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
        <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
          Appearance
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Choose Light, Dark, or follow your system theme.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {(
            [
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ] as { id: ThemeMode; label: string; icon: typeof Sun }[]
          ).map((item) => {
            const Icon = item.icon;
            const active = settings.theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateSettings({ theme: item.id })}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[#536DFE] bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                    : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Default PDF Preferences */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
        <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
          Default PDF Options
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Pre-applied whenever you start a new Image to PDF or Camera scan workflow.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="default-page-size"
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Default Page Size
            </label>
            <select
              id="default-page-size"
              value={settings.defaultPageSize}
              onChange={(e) =>
                onUpdateSettings({
                  defaultPageSize: e.target.value as Exclude<PageSizeId, 'Custom'>,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="Executive">Executive (7.25 × 10.5 in)</option>
              <option value="FitToImage">Fit to Image</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="default-orientation"
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Default Orientation
            </label>
            <select
              id="default-orientation"
              value={settings.defaultOrientation}
              onChange={(e) =>
                onUpdateSettings({
                  defaultOrientation: e.target.value as PageOrientation,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="auto">Auto (Match Image)</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="default-quality"
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Default Image Quality
            </label>
            <select
              id="default-quality"
              value={settings.defaultQuality}
              onChange={(e) =>
                onUpdateSettings({
                  defaultQuality: e.target.value as ImageQuality,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="low">Low (Compact)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Recommended)</option>
              <option value="original">Original Quality</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="default-margins"
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Default PDF Margins
            </label>
            <select
              id="default-margins"
              value={settings.defaultMarginPreset}
              onChange={(e) =>
                onUpdateSettings({
                  defaultMarginPreset: e.target.value as Exclude<
                    MarginPreset,
                    'custom'
                  >,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="none">No Margin (0 mm)</option>
              <option value="small">Small Margin (8 mm)</option>
              <option value="medium">Medium Margin (16 mm)</option>
              <option value="large">Large Margin (26 mm)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#536DFE] dark:bg-[#1E2754] dark:text-[#93A4FF]">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
                Language
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interface language for navigation and workspace labels
              </p>
            </div>
          </div>

          <select
            aria-label="Language"
            value={settings.language}
            onChange={(e) =>
              onUpdateSettings({ language: e.target.value as AppLanguage })
            }
            className="min-h-[42px] rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </section>

      {/* Storage Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#141C2E]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDECEE] text-[#E52535] dark:bg-[#3A161C]">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Storage Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All created PDFs remain stored locally in persistent browser database storage.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#F8FAFC] p-4 text-center dark:bg-slate-900/60">
          <div>
            <div className="font-mono text-lg font-bold text-slate-950 tabular-nums dark:text-white">
              {documents.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Saved PDFs</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-slate-950 tabular-nums dark:text-white">
              {totalPages}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Pages</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-slate-950 tabular-nums dark:text-white">
              {formatFileSize(totalBytes)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Used Space</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={documents.length === 0}
            onClick={() => void handleExportAll()}
            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            <span>{exportStatus || 'Export All PDFs'}</span>
          </button>

          <button
            type="button"
            disabled={documents.length === 0}
            onClick={() => setModal('clear')}
            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#E52535]/30 px-4 py-2 text-xs font-semibold text-[#E52535] transition-colors hover:bg-[#FDECEE] disabled:opacity-40 dark:hover:bg-[#3A161C]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Local PDFs</span>
          </button>
        </div>
      </section>

      {/* About, Privacy, Rate, Share */}
      <section className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#141C2E]">
        <button
          type="button"
          onClick={() => setModal('privacy')}
          className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="h-5 w-5 text-[#536DFE]" />
            Privacy Policy
          </span>
          <span className="text-xs text-slate-400">On-device processing</span>
        </button>

        <button
          type="button"
          onClick={() => setModal('about')}
          className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Info className="h-5 w-5 text-[#536DFE]" />
            About PDF Maker
          </span>
          <span className="font-mono text-xs text-slate-400">Image to PDF</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRatingSubmitted(false);
            setModal('rate');
          }}
          className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Star className="h-5 w-5 text-amber-500" />
            Rate App
          </span>
          <span className="text-xs text-slate-400">Share feedback</span>
        </button>

        <button
          type="button"
          onClick={() => void handleShareApp()}
          className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {shareCopied ? (
              <Check className="h-5 w-5 text-emerald-500" />
            ) : (
              <Share2 className="h-5 w-5 text-[#E52535]" />
            )}
            Share App
          </span>
          <span className="text-xs text-slate-400">
            {shareCopied ? 'Link copied' : 'Invite others'}
          </span>
        </button>
      </section>

      {/* Modals */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#141C2E]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {modal === 'privacy' && 'Privacy Policy'}
                {modal === 'about' && 'About PDF Maker'}
                {modal === 'rate' && 'Rate PDF Maker'}
                {modal === 'clear' && 'Clear All Local PDFs?'}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal === 'privacy' && (
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  PDF Maker processes all selected gallery images, camera captures, filters, and PDF document assemblies directly on your device.
                </p>
                <p>
                  Your images and generated PDF files are never uploaded to external servers. Saved documents stay inside local browser storage until you export or delete them.
                </p>
              </div>
            )}

            {modal === 'about' && (
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-900 dark:text-white">PDF Maker – Image to PDF</strong> converts multi-page photos and camera scans into standard PDF documents with non-destructive image filters, precision cropping, perspective correction, custom paper sizes, and an integrated PDF viewer.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supported formats: JPG, JPEG, PNG, WEBP · Standard PDF 1.7 output
                </p>
              </div>
            )}

            {modal === 'rate' && (
              <div className="mt-4 text-center">
                {ratingSubmitted ? (
                  <p className="py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Thank you for rating PDF Maker {rating} out of 5 stars!
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      How has your experience been with PDF Maker?
                    </p>
                    <div className="my-5 flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-110"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRatingSubmitted(true)}
                      className="min-h-[44px] w-full rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3D5AFE]"
                    >
                      Submit Rating
                    </button>
                  </>
                )}
              </div>
            )}

            {modal === 'clear' && (
              <div className="mt-3 space-y-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  This will permanently remove all {documents.length} PDF documents ({formatFileSize(totalBytes)}) from local device storage.
                </p>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="min-h-[42px] rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onClearAllPdfs();
                      setModal(null);
                    }}
                    className="min-h-[42px] rounded-xl bg-[#E52535] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C91B29]"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
