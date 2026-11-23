import type { PdfDocumentRecord } from '../types/pdf';

export interface SampleAsset {
  id: string;
  name: string;
  url: string;
  label: string;
}

export const SAMPLE_SCANS: SampleAsset[] = [
  {
    id: 'sample-receipt',
    name: 'Invoice_Receipt_Scan.jpg',
    url: '/src/assets/images/sample_receipt_scan_1795278880037.jpg',
    label: 'Invoice & Receipt',
  },
  {
    id: 'sample-notes',
    name: 'Architectural_Floor_Plan.jpg',
    url: '/src/assets/images/sample_notes_page_1795278870747.jpg',
    label: 'Floor Plan Notes',
  },
  {
    id: 'sample-whiteboard',
    name: 'Product_Roadmap_Board.jpg',
    url: '/src/assets/images/sample_whiteboard_chart_1795278878780.jpg',
    label: 'Roadmap Whiteboard',
  },
];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function sanitizePdfFilename(rawName: string): string {
  const trimmed = rawName.trim().replace(/[\\/:*?"<>|]+/g, '_');
  const base = trimmed.replace(/\.pdf$/i, '').trim() || 'Document';
  return `${base}.pdf`;
}

export function makeUniqueFilename(
  desiredName: string,
  existingNames: string[],
  excludeName?: string
): string {
  const clean = sanitizePdfFilename(desiredName);
  const lowerExisting = new Set(
    existingNames
      .filter((n) => !excludeName || n.toLowerCase() !== excludeName.toLowerCase())
      .map((n) => n.toLowerCase())
  );

  if (!lowerExisting.has(clean.toLowerCase())) {
    return clean;
  }

  const base = clean.replace(/\.pdf$/i, '');
  let counter = 2;
  while (lowerExisting.has(`${base} (${counter}).pdf`.toLowerCase())) {
    counter += 1;
  }
  return `${base} (${counter}).pdf`;
}

export function defaultPdfName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `PDF_Scan_${y}${m}${d}_${h}${min}.pdf`;
}

export function downloadPdfBlob(doc: PdfDocumentRecord): void {
  const url = URL.createObjectURL(doc.pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizePdfFilename(doc.name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareOrDownloadPdf(
  doc: PdfDocumentRecord
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const fileName = sanitizePdfFilename(doc.name);
  const file = new File([doc.pdfBlob], fileName, { type: 'application/pdf' });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: fileName,
          text: `Created with PDF Maker (${doc.pageCount} ${doc.pageCount === 1 ? 'page' : 'pages'})`,
          files: [file],
        });
        return 'shared';
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  downloadPdfBlob(doc);
  return 'downloaded';
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
