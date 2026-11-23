import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from './components/CameraView';
import { CreatePdfView } from './components/CreatePdfView';
import { EditorView } from './components/EditorView';
import { GalleryView } from './components/GalleryView';
import { HomeView } from './components/HomeView';
import { MyPdfsView } from './components/MyPdfsView';
import { NavigationShell } from './components/NavigationShell';
import { PageSettingsView } from './components/PageSettingsView';
import {
  DeletePdfModal,
  NewPdfActionSheet,
  PdfInfoModal,
  RenamePdfModal,
} from './components/PdfModals';
import { PdfReaderView } from './components/PdfReaderView';
import { PdfSuccessView } from './components/PdfSuccessView';
import { SettingsView } from './components/SettingsView';
import {
  deleteNativePdfFile,
  exitAndroidApp,
  exportPdfToDevice,
  registerAndroidBackButton,
  sharePdfAcrossPlatforms,
  syncSystemBarsTheme,
} from './platform/capacitorBridge';
import {
  clearAllPdfDocuments,
  deletePdfDocument,
  getAllPdfDocuments,
  loadAppSettings,
  saveAppSettings,
  updatePdfDocument,
} from './storage/pdfDatabase';
import type {
  AppRoute,
  AppSettings,
  FilterId,
  ImageEditState,
  PdfDocumentRecord,
  PdfListFilter,
  PdfPageConfig,
  SelectedImage,
} from './types/pdf';
import { makeUniqueFilename } from './utils/format';

function buildInitialPageConfig(settings: AppSettings): PdfPageConfig {
  return {
    pageSize: settings.defaultPageSize,
    customWidth: 210,
    customHeight: 297,
    customUnit: 'mm',
    orientation: settings.defaultOrientation,
    marginPreset: settings.defaultMarginPreset,
    customMarginMm: 12,
    placement: 'maintain_aspect',
    quality: settings.defaultQuality,
  };
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [documents, setDocuments] = useState<PdfDocumentRecord[]>([]);
  const [route, setRoute] = useState<AppRoute>('home');

  // My PDFs filter & search trigger state
  const [listFilter, setListFilter] = useState<PdfListFilter>('all');
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  // Creation wizard state
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [activeEditorIndex, setActiveEditorIndex] = useState(0);
  const [pageConfig, setPageConfig] = useState<PdfPageConfig>(() =>
    buildInitialPageConfig(loadAppSettings())
  );
  const [createdDoc, setCreatedDoc] = useState<PdfDocumentRecord | null>(null);
  const [activeReaderDoc, setActiveReaderDoc] = useState<PdfDocumentRecord | null>(null);
  const [readerReturnRoute, setReaderReturnRoute] = useState<AppRoute>('my_pdfs');

  // Modals & transient feedback toast
  const [newPdfSheetOpen, setNewPdfSheetOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PdfDocumentRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<PdfDocumentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PdfDocumentRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const lastBackPressRef = useRef<number>(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2800);
  }, []);

  // Load persisted PDFs from IndexedDB on startup
  useEffect(() => {
    let active = true;
    void getAllPdfDocuments().then((docs) => {
      if (active) setDocuments(docs);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync theme (Light / Dark / System) cleanly with <html class="dark"> AND Android StatusBar
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const shouldDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && media.matches);
      root.classList.toggle('dark', shouldDark);
      void syncSystemBarsTheme(shouldDark);
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Android Hardware Back-Button Handling
  useEffect(() => {
    return registerAndroidBackButton(() => {
      // 1. Dismiss open modals/sheets first
      if (newPdfSheetOpen) {
        setNewPdfSheetOpen(false);
        return;
      }
      if (renameTarget) {
        setRenameTarget(null);
        return;
      }
      if (infoTarget) {
        setInfoTarget(null);
        return;
      }
      if (deleteTarget) {
        setDeleteTarget(null);
        return;
      }

      // 2. Navigate cleanly up the screen hierarchy
      switch (route) {
        case 'pdf_reader':
          setRoute(readerReturnRoute);
          return;
        case 'create_pdf':
          setRoute('page_settings');
          return;
        case 'page_settings':
          setRoute('editor');
          return;
        case 'editor':
          setRoute('gallery');
          return;
        case 'camera':
          setRoute(selectedImages.length > 0 ? 'gallery' : 'home');
          return;
        case 'gallery':
        case 'pdf_success':
        case 'my_pdfs':
        case 'settings':
          setRoute('home');
          return;
        case 'home':
        default: {
          // 3. Double-press back on Home to exit gracefully
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            exitAndroidApp();
          } else {
            lastBackPressRef.current = now;
            showToast('Press back again to exit PDF Maker');
          }
        }
      }
    });
  }, [
    deleteTarget,
    infoTarget,
    newPdfSheetOpen,
    readerReturnRoute,
    renameTarget,
    route,
    selectedImages.length,
    showToast,
  ]);

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAppSettings(next);
      return next;
    });
  };

  // Start fresh Image to PDF flow
  const startNewGalleryFlow = () => {
    setPageConfig(buildInitialPageConfig(settings));
    setRoute('gallery');
  };

  const startCameraFlow = () => {
    setPageConfig(buildInitialPageConfig(settings));
    setRoute('camera');
  };

  const resetCreationWizard = () => {
    setSelectedImages([]);
    setActiveEditorIndex(0);
    setCreatedDoc(null);
    setPageConfig(buildInitialPageConfig(settings));
  };

  // Image management handlers
  const handleAddImages = (newItems: SelectedImage[]) => {
    setSelectedImages((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (activeEditorIndex >= next.length) {
        setActiveEditorIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    setSelectedImages((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleUpdateImageEdit = useCallback(
    (id: string, edit: ImageEditState, previewUrl?: string) => {
      setSelectedImages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                edit,
                previewUrl: previewUrl ?? item.previewUrl,
              }
            : item
        )
      );
    },
    []
  );

  const handleApplyFilterToAll = (filter: FilterId) => {
    setSelectedImages((prev) =>
      prev.map((item) => ({
        ...item,
        edit: { ...item.edit, filter },
      }))
    );
    showToast('Filter applied to all selected pages');
  };

  // Document CRUD & share handlers (cross-platform Android Capacitor + Web)
  const handleOpenPdf = (doc: PdfDocumentRecord, fromRoute: AppRoute) => {
    setActiveReaderDoc(doc);
    setReaderReturnRoute(fromRoute);
    setRoute('pdf_reader');
  };

  const handleSharePdf = async (doc: PdfDocumentRecord) => {
    try {
      const result = await sharePdfAcrossPlatforms(doc);
      if (result === 'shared') {
        showToast(`Shared ${doc.name}`);
      } else if (result === 'downloaded') {
        showToast(`Exported ${doc.name}`);
      }
    } catch {
      showToast('Could not open share dialog. Try exporting instead.');
    }
  };

  const handleDownloadPdf = async (doc: PdfDocumentRecord) => {
    try {
      const msg = await exportPdfToDevice(doc);
      showToast(msg);
    } catch {
      showToast('Failed to export PDF file.');
    }
  };

  const handleConfirmRename = async (id: string, rawName: string) => {
    const target = documents.find((d) => d.id === id);
    const unique = makeUniqueFilename(
      rawName,
      documents.map((d) => d.name),
      target?.name
    );
    const updated = await updatePdfDocument(id, { name: unique });
    if (!updated) return;

    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    if (createdDoc?.id === id) setCreatedDoc(updated);
    if (activeReaderDoc?.id === id) setActiveReaderDoc(updated);
    showToast(`Renamed to ${updated.name}`);
  };

  const handleToggleFavorite = async (doc: PdfDocumentRecord) => {
    const updated = await updatePdfDocument(doc.id, {
      isFavorite: !doc.isFavorite,
    });
    if (!updated) return;
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
    if (createdDoc?.id === doc.id) setCreatedDoc(updated);
    if (activeReaderDoc?.id === doc.id) setActiveReaderDoc(updated);
    showToast(
      updated.isFavorite ? 'Added to Favorites' : 'Removed from Favorites'
    );
  };

  const handleConfirmDelete = async (id: string) => {
    await deletePdfDocument(id);
    await deleteNativePdfFile(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (createdDoc?.id === id) setCreatedDoc(null);
    if (activeReaderDoc?.id === id) {
      setActiveReaderDoc(null);
      setRoute('my_pdfs');
    }
    showToast('PDF deleted from local storage');
  };

  const handleClearAllPdfs = async () => {
    for (const d of documents) {
      await deleteNativePdfFile(d.id);
    }
    await clearAllPdfDocuments();
    setDocuments([]);
    setCreatedDoc(null);
    setActiveReaderDoc(null);
    showToast('Cleared all saved PDFs');
  };

  const canNavigateToWizardStep = (step: AppRoute) => {
    if (step === 'gallery') return true;
    return selectedImages.length > 0;
  };

  const totalBytes = documents.reduce((acc, d) => acc + d.fileSize, 0);

  return (
    <NavigationShell
      route={route}
      language={settings.language}
      totalPdfs={documents.length}
      totalBytes={totalBytes}
      onNavigate={(next) => {
        setAutoFocusSearch(false);
        setRoute(next);
      }}
      onOpenSearch={() => {
        setListFilter('all');
        setAutoFocusSearch(true);
        setRoute('my_pdfs');
      }}
      onOpenNewPdf={() => setNewPdfSheetOpen(true)}
    >
      {route === 'home' && (
        <HomeView
          documents={documents}
          language={settings.language}
          onImageToPdf={startNewGalleryFlow}
          onCameraToPdf={startCameraFlow}
          onRecentPdfs={() => {
            setListFilter('recent');
            setAutoFocusSearch(false);
            setRoute('my_pdfs');
          }}
          onAllPdfs={() => {
            setListFilter('all');
            setAutoFocusSearch(false);
            setRoute('my_pdfs');
          }}
          onOpenSearch={() => {
            setListFilter('all');
            setAutoFocusSearch(true);
            setRoute('my_pdfs');
          }}
          onOpenSettings={() => setRoute('settings')}
          onOpenPdf={(doc) => handleOpenPdf(doc, 'home')}
          onSharePdf={(doc) => void handleSharePdf(doc)}
          onRenamePdf={(doc) => setRenameTarget(doc)}
          onInfoPdf={(doc) => setInfoTarget(doc)}
          onToggleFavorite={(doc) => void handleToggleFavorite(doc)}
          onDeletePdf={(doc) => setDeleteTarget(doc)}
        />
      )}

      {route === 'gallery' && (
        <GalleryView
          images={selectedImages}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          onReorderImages={handleReorderImages}
          onEditImage={(idx) => {
            setActiveEditorIndex(idx);
            setRoute('editor');
          }}
          onOpenCamera={() => setRoute('camera')}
          onNext={() => {
            setActiveEditorIndex(0);
            setRoute('editor');
          }}
          onBack={() => setRoute('home')}
          onStepClick={(step) => setRoute(step)}
          canNavigateToStep={canNavigateToWizardStep}
        />
      )}

      {route === 'camera' && (
        <CameraView
          onCompleteCapture={(captured) => {
            if (captured.length > 0) {
              const startIdx = selectedImages.length;
              setSelectedImages((prev) => [...prev, ...captured]);
              setActiveEditorIndex(startIdx);
              setRoute('editor');
            } else {
              setRoute('home');
            }
          }}
          onCancel={() => setRoute(selectedImages.length > 0 ? 'gallery' : 'home')}
        />
      )}

      {route === 'editor' && (
        <EditorView
          images={selectedImages}
          activeIndex={activeEditorIndex}
          onSelectIndex={setActiveEditorIndex}
          onUpdateImageEdit={handleUpdateImageEdit}
          onApplyFilterToAll={handleApplyFilterToAll}
          onNext={() => setRoute('page_settings')}
          onBack={() => setRoute('gallery')}
          onStepClick={(step) => setRoute(step)}
          canNavigateToStep={canNavigateToWizardStep}
        />
      )}

      {route === 'page_settings' && (
        <PageSettingsView
          images={selectedImages}
          config={pageConfig}
          onChangeConfig={setPageConfig}
          onNext={() => setRoute('create_pdf')}
          onBack={() => setRoute('editor')}
          onStepClick={(step) => setRoute(step)}
          canNavigateToStep={canNavigateToWizardStep}
        />
      )}

      {route === 'create_pdf' && (
        <CreatePdfView
          images={selectedImages}
          config={pageConfig}
          existingFilenames={documents.map((d) => d.name)}
          onChangeConfig={setPageConfig}
          onSuccess={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            setCreatedDoc(doc);
            setRoute('pdf_success');
          }}
          onBack={() => setRoute('page_settings')}
          onStepClick={(step) => setRoute(step)}
          canNavigateToStep={canNavigateToWizardStep}
        />
      )}

      {route === 'pdf_success' && createdDoc && (
        <PdfSuccessView
          doc={createdDoc}
          onOpenPdf={() => handleOpenPdf(createdDoc, 'pdf_success')}
          onSharePdf={() => void handleSharePdf(createdDoc)}
          onRenamePdf={() => setRenameTarget(createdDoc)}
          onCreateAnother={() => {
            resetCreationWizard();
            setRoute('gallery');
          }}
          onGoToMyPdfs={() => {
            resetCreationWizard();
            setListFilter('all');
            setRoute('my_pdfs');
          }}
        />
      )}

      {route === 'my_pdfs' && (
        <MyPdfsView
          documents={documents}
          language={settings.language}
          initialFilter={listFilter}
          autoFocusSearch={autoFocusSearch}
          onFilterChange={setListFilter}
          onCreateNew={() => setNewPdfSheetOpen(true)}
          onOpenPdf={(doc) => handleOpenPdf(doc, 'my_pdfs')}
          onSharePdf={(doc) => void handleSharePdf(doc)}
          onDownloadPdf={(doc) => void handleDownloadPdf(doc)}
          onRenamePdf={(doc) => setRenameTarget(doc)}
          onInfoPdf={(doc) => setInfoTarget(doc)}
          onToggleFavorite={(doc) => void handleToggleFavorite(doc)}
          onDeletePdf={(doc) => setDeleteTarget(doc)}
        />
      )}

      {route === 'pdf_reader' && activeReaderDoc && (
        <PdfReaderView
          doc={activeReaderDoc}
          onBack={() => setRoute(readerReturnRoute)}
          onShare={() => void handleSharePdf(activeReaderDoc)}
          onDownload={() => void handleDownloadPdf(activeReaderDoc)}
          onRename={() => setRenameTarget(activeReaderDoc)}
          onInfo={() => setInfoTarget(activeReaderDoc)}
          onDelete={() => setDeleteTarget(activeReaderDoc)}
        />
      )}

      {route === 'settings' && (
        <SettingsView
          settings={settings}
          documents={documents}
          onUpdateSettings={handleUpdateSettings}
          onClearAllPdfs={handleClearAllPdfs}
        />
      )}

      {/* Global Reusable Modals */}
      <NewPdfActionSheet
        open={newPdfSheetOpen}
        onClose={() => setNewPdfSheetOpen(false)}
        onSelectGallery={startNewGalleryFlow}
        onSelectCamera={startCameraFlow}
      />

      <RenamePdfModal
        doc={renameTarget}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleConfirmRename}
      />

      <PdfInfoModal doc={infoTarget} onClose={() => setInfoTarget(null)} />

      <DeletePdfModal
        doc={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Clean Transient Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg lg:bottom-6 dark:bg-white dark:text-slate-950"
        >
          {toast}
        </div>
      )}
    </NavigationShell>
  );
}
