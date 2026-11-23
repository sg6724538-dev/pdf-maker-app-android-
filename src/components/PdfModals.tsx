import { useEffect, useState } from 'react';
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Trash2,
  X,
} from 'lucide-react';
import type { PdfDocumentRecord } from '../types/pdf';
import { formatDateTime, formatFileSize } from '../utils/format';

interface RenameModalProps {
  doc: PdfDocumentRecord | null;
  onClose: () => void;
  onConfirm: (id: string, newName: string) => Promise<void>;
}

export function RenamePdfModal({ doc, onClose, onConfirm }: RenameModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) {
      setValue(doc.name.replace(/\.pdf$/i, ''));
    }
  }, [doc]);

  if (!doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm(doc.id, value.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#141C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3
            id="rename-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            Rename PDF
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close rename dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="pdf-rename-input"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Document filename
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:border-[#536DFE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#536DFE]/20 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:bg-slate-900">
              <input
                id="pdf-rename-input"
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none dark:text-slate-100"
                placeholder="Enter filename"
              />
              <span className="shrink-0 pl-2 font-mono text-xs font-medium text-slate-400">
                .pdf
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim() || saving}
              className="min-h-[42px] rounded-xl bg-[#536DFE] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PdfInfoModalProps {
  doc: PdfDocumentRecord | null;
  onClose: () => void;
}

export function PdfInfoModal({ doc, onClose }: PdfInfoModalProps) {
  if (!doc) return null;

  const qualityLabel: Record<PdfDocumentRecord['quality'], string> = {
    low: 'Low (Compact)',
    medium: 'Medium (Balanced)',
    high: 'High (Sharp)',
    original: 'Original Quality',
  };

  const rows = [
    { label: 'File name', value: doc.name },
    { label: 'Total pages', value: `${doc.pageCount} ${doc.pageCount === 1 ? 'page' : 'pages'}` },
    { label: 'File size', value: formatFileSize(doc.fileSize) },
    { label: 'Page size', value: doc.pageSizeLabel },
    { label: 'Orientation', value: doc.orientation.charAt(0).toUpperCase() + doc.orientation.slice(1) },
    { label: 'Margins', value: doc.marginsLabel },
    { label: 'Image quality', value: qualityLabel[doc.quality] },
    { label: 'Created on', value: formatDateTime(doc.createdAt) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#141C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDECEE] text-[#E52535] dark:bg-[#3A161C]">
              <FileText className="h-5 w-5" />
            </div>
            <h3
              id="info-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              PDF Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close document info"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
              <dd className="max-w-[60%] truncate text-right font-medium text-slate-900 tabular-nums dark:text-slate-100">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  doc: PdfDocumentRecord | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeletePdfModal({ doc, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!doc) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(doc.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#141C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FDECEE] text-[#E52535] dark:bg-[#3A161C]">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="delete-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Delete PDF document?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-200">{doc.name}</span>{' '}
              will be permanently removed from local storage. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-[42px] rounded-xl bg-[#E52535] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C91B29] disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewPdfSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
}

export function NewPdfActionSheet({
  open,
  onClose,
  onSelectGallery,
  onSelectCamera,
}: NewPdfSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create new PDF"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#141C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden dark:bg-slate-700" />
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Create New PDF
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close create sheet"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how you want to add document pages.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGallery();
            }}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-[#536DFE] hover:bg-[#EEF1FF]/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-[#536DFE] dark:hover:bg-[#1E2754]/60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#536DFE] text-white">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                Image to PDF
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Pick JPG, PNG, or WEBP photos from your device
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCamera();
            }}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-[#E52535] hover:bg-[#FDECEE]/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-[#E52535] dark:hover:bg-[#3A161C]/60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E52535] text-white">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                Camera to PDF
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Scan documents directly using your live camera
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
