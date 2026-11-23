import {
  PDFDocument,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
} from 'pdf-lib';
import { renderImageForPdf } from '../filters/imageEngine';
import {
  computeImagePlacement,
  getMarginLabel,
  getPageSizeDisplayLabel,
  resolvePageGeometry,
} from '../pagesize/pageSizeEngine';
import { syncPdfToNativeStorage } from '../platform/capacitorBridge';
import { savePdfDocument } from '../storage/pdfDatabase';
import type {
  PdfDocumentRecord,
  PdfPageConfig,
  SelectedImage,
} from '../types/pdf';
import { generateId, makeUniqueFilename } from '../utils/format';

export interface PdfGenerationProgress {
  percent: number;
  message: string;
  currentPage: number;
  totalPages: number;
}

export async function generateAndSavePdf(params: {
  images: SelectedImage[];
  config: PdfPageConfig;
  filename: string;
  existingFilenames: string[];
  onProgress?: (progress: PdfGenerationProgress) => void;
}): Promise<PdfDocumentRecord> {
  const { images, config, filename, existingFilenames, onProgress } = params;

  if (images.length === 0) {
    throw new Error('Select at least one image before creating a PDF.');
  }

  const totalPages = images.length;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(filename.replace(/\.pdf$/i, ''));
  pdfDoc.setCreator('PDF Maker – Image to PDF');
  pdfDoc.setProducer('PDF Maker Engine');
  pdfDoc.setCreationDate(new Date());

  let coverThumbnail = '';

  for (let i = 0; i < totalPages; i++) {
    const item = images[i];
    onProgress?.({
      percent: Math.round(((i + 0.15) / (totalPages + 0.6)) * 100),
      message: `Processing page ${i + 1} of ${totalPages}...`,
      currentPage: i + 1,
      totalPages,
    });

    // Yield to browser paint loop so progress indicator animates smoothly
    await new Promise((r) => window.setTimeout(r, 15));

    const encoded = await renderImageForPdf(item.originalUrl, item.edit, config.quality);
    if (i === 0) {
      coverThumbnail = encoded.previewDataUrl;
    }

    const embeddedImg =
      encoded.format === 'png'
        ? await pdfDoc.embedPng(encoded.bytes)
        : await pdfDoc.embedJpg(encoded.bytes);

    const geom = resolvePageGeometry(config, encoded.width, encoded.height);
    const page = pdfDoc.addPage([geom.pageWidthPt, geom.pageHeightPt]);

    const rect = computeImagePlacement(
      geom.pageWidthPt,
      geom.pageHeightPt,
      geom.marginPt,
      encoded.width,
      encoded.height,
      config.placement
    );

    if (config.placement === 'fill') {
      // Clip precisely to the margin content box when filling page
      page.pushOperators(
        pushGraphicsState(),
        rectangle(rect.clipX, rect.clipY, rect.clipWidth, rect.clipHeight),
        clip(),
        endPath()
      );
      page.drawImage(embeddedImg, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
      page.pushOperators(popGraphicsState());
    } else {
      page.drawImage(embeddedImg, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }

    onProgress?.({
      percent: Math.round(((i + 0.9) / (totalPages + 0.6)) * 100),
      message: `Added page ${i + 1} of ${totalPages} (${Math.round(geom.pageWidthMm)}×${Math.round(geom.pageHeightMm)} mm)`,
      currentPage: i + 1,
      totalPages,
    });
  }

  onProgress?.({
    percent: 94,
    message: 'Finalizing PDF structure and saving locally...',
    currentPage: totalPages,
    totalPages,
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const uniqueName = makeUniqueFilename(filename, existingFilenames);

  const record: PdfDocumentRecord = {
    id: generateId(),
    name: uniqueName,
    fileSize: pdfBlob.size,
    pageCount: totalPages,
    pageSizeLabel: getPageSizeDisplayLabel(config),
    orientation: config.orientation,
    marginsLabel: getMarginLabel(config),
    quality: config.quality,
    createdAt: Date.now(),
    isFavorite: false,
    thumbnailDataUrl: coverThumbnail,
    pdfBlob,
  };

  // Persist to IndexedDB (and native app-private storage on Android) before reporting completion
  await savePdfDocument(record);
  await syncPdfToNativeStorage(record);

  onProgress?.({
    percent: 100,
    message: 'PDF saved successfully.',
    currentPage: totalPages,
    totalPages,
  });

  return record;
}
