import { App as CapacitorApp } from '@capacitor/app';
import {
  Camera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { loadImageElement } from '../filters/imageEngine';
import {
  DEFAULT_EDIT_STATE,
  type PdfDocumentRecord,
  type SelectedImage,
} from '../types/pdf';
import {
  downloadPdfBlob,
  generateId,
  sanitizePdfFilename,
  shareOrDownloadPdf,
} from '../utils/format';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Synchronizes Android status bar color, icon contrast, and HTML theme-color meta tag.
 */
export async function syncSystemBarsTheme(isDark: boolean): Promise<void> {
  const barColor = isDark ? '#0B1120' : '#FFFFFF';

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', barColor);
  }

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: barColor });
    // Style.Dark renders light icons (for dark backgrounds); Style.Light renders dark icons (for light backgrounds)
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  } catch (err) {
    console.warn('StatusBar update skipped:', err);
  }
}

/**
 * Registers Android hardware back-button listener and returns an async cleanup handle.
 */
export function registerAndroidBackButton(onBack: () => void): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  let removed = false;
  let removeFn: (() => Promise<void>) | null = null;

  void CapacitorApp.addListener('backButton', () => {
    onBack();
  }).then((handle) => {
    if (removed) {
      void handle.remove();
    } else {
      removeFn = () => handle.remove();
    }
  });

  return () => {
    removed = true;
    if (removeFn) {
      void removeFn();
    }
  };
}

export function exitAndroidApp(): void {
  if (Capacitor.isNativePlatform()) {
    void CapacitorApp.exitApp();
  }
}

/**
 * Native Android Photo Picker multi-image selector via @capacitor/camera.
 * Returns { status: 'picked', images } or { status: 'cancelled' } or { status: 'unsupported' }.
 */
export async function pickGalleryImagesNative(): Promise<
  | { status: 'picked'; images: SelectedImage[] }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'unsupported' };
  }

  try {
    const result = await Camera.pickImages({
      quality: 95,
      limit: 25,
      correctOrientation: true,
    });

    if (!result.photos || result.photos.length === 0) {
      return { status: 'cancelled' };
    }

    const added: SelectedImage[] = [];
    for (let i = 0; i < result.photos.length; i++) {
      const photo = result.photos[i];
      const src =
        photo.webPath ||
        (photo.path ? Capacitor.convertFileSrc(photo.path) : undefined);
      if (!src) continue;

      try {
        const img = await loadImageElement(src);
        const ext = (photo.format || 'jpeg').toLowerCase();
        added.push({
          id: generateId(),
          name: `Gallery_Photo_${Date.now()}_${i + 1}.${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg'}`,
          originalUrl: src,
          mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          source: 'gallery',
          edit: {
            ...DEFAULT_EDIT_STATE,
            crop: { ...DEFAULT_EDIT_STATE.crop },
          },
        });
      } catch {
        // Skip unreadable image gracefully
      }
    }

    return added.length > 0
      ? { status: 'picked', images: added }
      : { status: 'cancelled' };
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('cancel') || msg.includes('user')) {
      return { status: 'cancelled' };
    }
    throw err;
  }
}

/**
 * Native Android Camera capture via @capacitor/camera with runtime camera permission check.
 */
export async function captureCameraPhotoNative(
  pageNumber: number
): Promise<SelectedImage | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const perm = await Camera.checkPermissions();
  if (perm.camera !== 'granted') {
    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    if (requested.camera !== 'granted') {
      throw new Error(
        'Camera permission was denied. Enable Camera access in Android App Settings to scan documents.'
      );
    }
  }

  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 95,
      correctOrientation: true,
      saveToGallery: false,
      allowEditing: false,
    });

    const src =
      photo.webPath ||
      (photo.path ? Capacitor.convertFileSrc(photo.path) : undefined);
    if (!src) return null;

    const img = await loadImageElement(src);
    return {
      id: generateId(),
      name: `Camera_Scan_${pageNumber}.jpg`,
      originalUrl: src,
      mimeType: 'image/jpeg',
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      source: 'camera',
      edit: {
        ...DEFAULT_EDIT_STATE,
        crop: { ...DEFAULT_EDIT_STATE.crop },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('cancel')) {
      return null;
    }
    throw err;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to encode PDF file.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Mirrors created PDF into Android app-private storage (Directory.Data/pdfs) alongside IndexedDB.
 */
export async function syncPdfToNativeStorage(
  doc: PdfDocumentRecord
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const base64 = await blobToBase64(doc.pdfBlob);
    await Filesystem.writeFile({
      path: `pdfs/${doc.id}.pdf`,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (err) {
    console.warn('Native private PDF sync skipped:', err);
  }
}

export async function deleteNativePdfFile(id: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.deleteFile({
      path: `pdfs/${id}.pdf`,
      directory: Directory.Data,
    });
  } catch {
    // Ignore if file already removed
  }
}

/**
 * Saves/exports a PDF to Android Documents/PDF Maker/ on native, or triggers download on web.
 */
export async function exportPdfToDevice(
  doc: PdfDocumentRecord
): Promise<string> {
  const filename = sanitizePdfFilename(doc.name);

  if (!Capacitor.isNativePlatform()) {
    downloadPdfBlob(doc);
    return `Downloaded ${filename}`;
  }

  const base64 = await blobToBase64(doc.pdfBlob);
  try {
    await Filesystem.writeFile({
      path: `PDF Maker/${filename}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    return `Saved to Documents/PDF Maker/${filename}`;
  } catch {
    // Fallback to app external files directory if Documents is restricted
    await Filesystem.writeFile({
      path: `exports/${filename}`,
      data: base64,
      directory: Directory.External,
      recursive: true,
    });
    return `Saved ${filename} to app storage`;
  }
}

/**
 * Shares a PDF using the native Android Sharesheet via FileProvider URI on Android,
 * or Web Share API / download fallback in browsers.
 */
export async function sharePdfAcrossPlatforms(
  doc: PdfDocumentRecord
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (!Capacitor.isNativePlatform()) {
    return shareOrDownloadPdf(doc);
  }

  const filename = sanitizePdfFilename(doc.name);
  const base64 = await blobToBase64(doc.pdfBlob);
  const cachePath = `share/${filename}`;

  await Filesystem.writeFile({
    path: cachePath,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  const { uri } = await Filesystem.getUri({
    path: cachePath,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: filename,
      text: `${filename} (${doc.pageCount} ${doc.pageCount === 1 ? 'page' : 'pages'})`,
      files: [uri],
      dialogTitle: 'Share PDF',
    });
    return 'shared';
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('cancel')) {
      return 'cancelled';
    }
    throw err;
  }
}
