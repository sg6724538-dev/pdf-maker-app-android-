import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  Clock,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Info,
  MoreVertical,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import type { AppLanguage, PdfDocumentRecord } from '../types/pdf';
import { formatDate, formatFileSize } from '../utils/format';
import { getStrings } from '../utils/i18n';

interface HomeViewProps {
  documents: PdfDocumentRecord[];
  language: AppLanguage;
  onImageToPdf: () => void;
  onCameraToPdf: () => void;
  onRecentPdfs: () => void;
  onAllPdfs: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenPdf: (doc: PdfDocumentRecord) => void;
  onSharePdf: (doc: PdfDocumentRecord) => void;
  onRenamePdf: (doc: PdfDocumentRecord) => void;
  onInfoPdf: (doc: PdfDocumentRecord) => void;
  onToggleFavorite: (doc: PdfDocumentRecord) => void;
  onDeletePdf: (doc: PdfDocumentRecord) => void;
}

export function HomeView({
  documents,
  language,
  onImageToPdf,
  onCameraToPdf,
  onRecentPdfs,
  onAllPdfs,
  onOpenSearch,
  onOpenSettings,
  onOpenPdf,
  onSharePdf,
  onRenamePdf,
  onInfoPdf,
  onToggleFavorite,
  onDeletePdf,
}: HomeViewProps) {
  const t = getStrings(language);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const recentFive = documents.slice(0, 5);

  const featureCards = [
    {
      id: 'image-to-pdf',
      title: t.imageToPdf,
      description: t.imageToPdfDesc,
      icon: ImageIcon,
      accentBg: 'bg-[#536DFE] text-white',
      cardSurface:
        'border-[#536DFE]/25 bg-[#F4F6FF] hover:border-[#536DFE] dark:border-[#536DFE]/30 dark:bg-[#141D3B] dark:hover:border-[#536DFE]',
      onClick: onImageToPdf,
    },
    {
      id: 'camera-to-pdf',
      title: t.cameraToPdf,
      description: t.cameraToPdfDesc,
      icon: Camera,
      accentBg: 'bg-[#E52535] text-white',
      cardSurface:
        'border-slate-200 bg-[#F4F6FA] hover:border-[#E52535] dark:border-slate-800 dark:bg-[#141C2E] dark:hover:border-[#E52535]',
      onClick: onCameraToPdf,
    },
    {
      id: 'recent-pdfs',
      title: t.recentPdfs,
      description: t.recentPdfsDesc,
      icon: Clock,
      accentBg: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
      cardSurface:
        'border-slate-200 bg-[#F4F6FA] hover:border-slate-400 dark:border-slate-800 dark:bg-[#141C2E] dark:hover:border-slate-600',
      onClick: onRecentPdfs,
    },
    {
      id: 'all-pdfs',
      title: t.allPdfs,
      description: t.allPdfsDesc,
      icon: FolderOpen,
      accentBg: 'bg-[#EEF1FF] text-[#536DFE] dark:bg-[#1E2754] dark:text-[#93A4FF]',
      cardSurface:
        'border-slate-200 bg-[#F4F6FA] hover:border-[#536DFE]/60 dark:border-slate-800 dark:bg-[#141C2E] dark:hover:border-[#536DFE]/60',
      onClick: onAllPdfs,
    },
  ];

  return (
    <div className="space-y-8" onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Desktop Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Create &amp; manage your PDFs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Convert photos and camera scans into crisp, custom-sized PDF documents.
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F4F6FA] px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#141C2E] dark:text-slate-300 dark:hover:border-slate-700"
          >
            <Search className="h-4 w-4" />
            <span>Search PDFs</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-[#F4F6FA] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#141C2E] dark:text-slate-300 dark:hover:border-slate-700"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4 Large Feature Cards */}
      <section aria-label="Quick tools">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.onClick}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-5 text-left transition-all duration-150 active:scale-[0.99] ${card.cardSurface}`}
              >
                <div className="flex w-full items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.accentBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                </div>

                <div className="mt-5">
                  <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-400">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Created PDFs (Latest 5) */}
      <section aria-labelledby="recent-pdfs-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="recent-pdfs-heading"
            className="font-display text-lg font-bold text-slate-950 dark:text-white"
          >
            {t.recentCreated}
          </h2>
          {documents.length > 0 && (
            <button
              type="button"
              onClick={onAllPdfs}
              className="text-sm font-semibold text-[#536DFE] transition-colors hover:text-[#3D5AFE] whitespace-nowrap"
            >
              {t.viewAll} ({documents.length})
            </button>
          )}
        </div>

        {recentFive.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] px-6 py-12 text-center dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDECEE] text-[#E52535] dark:bg-[#3A161C]">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
              {t.noPdfsTitle}
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t.noPdfsDesc}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onImageToPdf}
                className="min-h-[44px] rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
              >
                {t.createFirstPdf}
              </button>
              <button
                type="button"
                onClick={onCameraToPdf}
                className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#141C2E] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Scan with Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#141C2E]">
            {recentFive.map((doc) => (
              <div
                key={doc.id}
                className="relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <button
                  type="button"
                  onClick={() => onOpenPdf(doc)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                    {doc.thumbnailDataUrl ? (
                      <img
                        src={doc.thumbnailDataUrl}
                        alt={`Thumbnail of ${doc.name}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#E52535]">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-display text-sm font-bold text-slate-950 dark:text-white">
                        {doc.name}
                      </span>
                      {doc.isFavorite && (
                        <Star
                          className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                          aria-label="Favorite"
                        />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      <span>
                        {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{doc.pageSizeLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </button>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={`More actions for ${doc.name}`}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuId === doc.id && (
                    <div
                      className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-[#182238]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onOpenPdf(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4 text-slate-400" />
                        Open PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onSharePdf(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Share2 className="h-4 w-4 text-slate-400" />
                        Share / Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRenamePdf(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="h-4 w-4 text-slate-400" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onToggleFavorite(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            doc.isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                        {doc.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onInfoPdf(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Info className="h-4 w-4 text-slate-400" />
                        PDF Information
                      </button>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDeletePdf(doc);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#E52535] hover:bg-[#FDECEE] dark:hover:bg-[#3A161C]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
