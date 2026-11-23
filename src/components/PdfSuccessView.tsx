import {
  CheckCircle2,
  Edit3,
  Eye,
  FilePlus2,
  FolderOpen,
  Share2,
} from 'lucide-react';
import type { PdfDocumentRecord } from '../types/pdf';
import { formatDateTime, formatFileSize } from '../utils/format';

interface PdfSuccessViewProps {
  doc: PdfDocumentRecord;
  onOpenPdf: () => void;
  onSharePdf: () => void;
  onRenamePdf: () => void;
  onCreateAnother: () => void;
  onGoToMyPdfs: () => void;
}

export function PdfSuccessView({
  doc,
  onOpenPdf,
  onSharePdf,
  onRenamePdf,
  onCreateAnother,
  onGoToMyPdfs,
}: PdfSuccessViewProps) {
  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-[#141C2E]">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            PDF Created &amp; Saved
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your document has been saved locally and added to My PDFs.
          </p>
        </div>

        {/* Document Card Summary */}
        <div className="mt-7 flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 sm:flex-row dark:border-slate-800 dark:bg-slate-900/60">
          <div className="h-28 w-22 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
            {doc.thumbnailDataUrl ? (
              <img
                src={doc.thumbnailDataUrl}
                alt={`Cover of ${doc.name}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xs font-bold text-[#E52535]">
                PDF
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="truncate font-display text-lg font-bold text-slate-950 dark:text-white">
              {doc.name}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 tabular-nums dark:text-slate-400">
              <div>
                <span className="block text-slate-400 dark:text-slate-500">Pages</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                  {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500">File size</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                  {formatFileSize(doc.fileSize)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500">Page size</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {doc.pageSizeLabel}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500">Created</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {formatDateTime(doc.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenPdf}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#536DFE] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
          >
            <Eye className="h-4 w-4" />
            <span>Open PDF</span>
          </button>

          <button
            type="button"
            onClick={onSharePdf}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#E52535] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C91B29]"
          >
            <Share2 className="h-4 w-4" />
            <span>Share / Export PDF</span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={onRenamePdf}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Edit3 className="h-4 w-4" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={onCreateAnother}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Create Another</span>
          </button>

          <button
            type="button"
            onClick={onGoToMyPdfs}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Go to My PDFs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
