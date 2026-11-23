import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type PdfDocumentRecord,
} from '../types/pdf';

const DB_NAME = 'pdf_maker_local_db';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const SETTINGS_KEY = 'pdf_maker_settings_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const store = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open local PDF database.'));
  });
}

export async function getAllPdfDocuments(): Promise<PdfDocumentRecord[]> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result as PdfDocumentRecord[]) || [];
        // Guard against missing/corrupt blobs
        const valid = rows.filter(
          (row) => row && typeof row.id === 'string' && row.pdfBlob instanceof Blob
        );
        valid.sort((a, b) => b.createdAt - a.createdAt);
        resolve(valid);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read PDF documents from IndexedDB:', err);
    return [];
  }
}

export async function savePdfDocument(record: PdfDocumentRecord): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error ?? new Error('Unable to save PDF. Storage may be full.'));
  });
}

export async function updatePdfDocument(
  id: string,
  patch: Partial<Pick<PdfDocumentRecord, 'name' | 'isFavorite'>>
): Promise<PdfDocumentRecord | null> {
  const db = await openDatabase();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result as PdfDocumentRecord | undefined;
      if (!existing) {
        resolve(null);
        return;
      }
      const updated: PdfDocumentRecord = { ...existing, ...patch };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deletePdfDocument(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllPdfDocuments(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_APP_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to persist settings:', err);
  }
}
