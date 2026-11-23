import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Info,
  Loader2,
  Share2,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { PdfDocumentRecord } from '../types/pdf';
import { formatFileSize } from '../utils/format';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfReaderViewProps {
  doc: PdfDocumentRecord;
  onBack: () => void;
  onShare: () => void;
  onDownload: () => void;
  onRename: () => void;
  onInfo: () => void;
  onDelete: () => void;
}

interface RenderedPage {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  dataUrl: string;
}

export function PdfReaderView({
  doc,
  onBack,
  onShare,
  onDownload,
  onRename,
  onInfo,
  onDelete,
}: PdfReaderViewProps) {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let pdfTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPages([]);
      setCurrentPage(1);

      try {
        const buffer = await doc.pdfBlob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        pdfTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await pdfTask.promise;

        const rendered: RenderedPage[] = [];
        for (let num = 1; num <= pdf.numPages; num++) {
          if (cancelled) return;
          const page = await pdf.getPage(num);
          const baseViewport = page.getViewport({ scale: 1 });
          // Render at crisp 2x resolution for sharp zoom
          const targetScale = Math.min(2.2, 1240 / Math.max(baseViewport.width, 400));
          const viewport = page.getViewport({ scale: targetScale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            canvas,
            viewport,
          }).promise;

          rendered.push({
            pageNumber: num,
            widthPt: Math.round(baseViewport.width),
            heightPt: Math.round(baseViewport.height),
            dataUrl: canvas.toDataURL('image/png'),
          });
        }

        if (!cancelled) {
          setPages(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to render this PDF file. Try downloading it directly.'
          );
          setLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
      if (pdfTask) {
        void pdfTask.destroy();
      }
    };
  }, [doc]);

  const scrollToPage = useCallback((pageNum: number) => {
    const clamped = Math.min(Math.max(1, pageNum), Math.max(1, pages.length));
    setCurrentPage(clamped);
    const el = pageRefs.current.get(clamped);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pages.length]);

  const adjustZoom = (delta: number) => {
    setZoom((z) => Math.min(250, Math.max(50, z + delta)));
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Reader Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#141C2E]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Back from PDF reader"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold text-slate-950 sm:text-lg dark:text-white">
              {doc.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              <span>
                {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(doc.fileSize)}</span>
              <span aria-hidden="true">·</span>
              <span>{doc.pageSizeLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onShare}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#536DFE] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
          >
            <Share2 className="h-4 w-4" />
            <span className="whitespace-nowrap">Share</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Download PDF"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRename}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Rename PDF"
            title="Rename PDF"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onInfo}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Document info"
            title="Document info"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#E52535] transition-colors hover:bg-[#FDECEE] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-[#3A161C]"
            aria-label="Delete PDF"
            title="Delete PDF"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Zoom & Page Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 dark:border-slate-800 dark:bg-[#111827]">
        {/* Page Jumper */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
            aria-label="Previous page"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, pages.length)}
              value={currentPage}
              onChange={(e) => scrollToPage(Number(e.target.value))}
              aria-label="Current page number"
              className="w-12 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center font-mono text-xs font-semibold text-slate-900 tabular-nums outline-none focus:border-[#536DFE] dark:border-slate-700 dark:bg-[#141C2E] dark:text-white"
            />
            <span className="font-mono tabular-nums">of {pages.length || doc.pageCount}</span>
          </div>
          <button
            type="button"
            disabled={currentPage >= pages.length}
            onClick={() => scrollToPage(currentPage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
            aria-label="Next page"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={zoom <= 50}
            onClick={() => adjustZoom(-25)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="min-w-[60px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-800 tabular-nums dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
            title="Reset zoom to 100%"
          >
            {zoom}%
          </button>
          <button
            type="button"
            disabled={zoom >= 250}
            onClick={() => adjustZoom(25)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Pages Scrollable Viewport */}
      <div className="min-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-200/70 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950/80">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#536DFE]" />
            <p className="mt-3 text-sm font-medium">Rendering PDF pages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-9 w-9 text-[#E52535]" />
            <p className="mt-3 max-w-md text-sm font-medium text-slate-800 dark:text-slate-200">
              {error}
            </p>
            <button
              type="button"
              onClick={onDownload}
              className="mt-4 min-h-[42px] rounded-xl bg-[#536DFE] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3D5AFE]"
            >
              Download PDF File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {pages.map((p) => (
              <div
                key={p.pageNumber}
                ref={(el) => {
                  if (el) pageRefs.current.set(p.pageNumber, el);
                  else pageRefs.current.delete(p.pageNumber);
                }}
                onMouseEnter={() => setCurrentPage(p.pageNumber)}
                className="flex flex-col items-center"
                style={{ width: `${Math.round((680 * zoom) / 100)}px`, maxWidth: zoom <= 100 ? '100%' : 'none' }}
              >
                <div className="w-full overflow-hidden rounded-lg bg-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-300/60">
                  <img
                    src={p.dataUrl}
                    alt={`${doc.name} — Page ${p.pageNumber}`}
                    className="block h-auto w-full"
                  />
                </div>
                <div className="mt-2 font-mono text-[11px] font-medium text-slate-500 tabular-nums dark:text-slate-400">
                  Page {p.pageNumber} of {pages.length} · {Math.round((p.widthPt / 72) * 25.4)} ×{' '}
                  {Math.round((p.heightPt / 72) * 25.4)} mm
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
