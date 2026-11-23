import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  Info,
  LayoutGrid,
  List,
  MoreVertical,
  Search,
  Share2,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AppLanguage,
  PdfDocumentRecord,
  PdfListFilter,
  SortOption,
} from '../types/pdf';
import { formatDate, formatFileSize } from '../utils/format';
import { getStrings } from '../utils/i18n';

interface MyPdfsViewProps {
  documents: PdfDocumentRecord[];
  language: AppLanguage;
  initialFilter: PdfListFilter;
  autoFocusSearch: boolean;
  onFilterChange: (f: PdfListFilter) => void;
  onCreateNew: () => void;
  onOpenPdf: (doc: PdfDocumentRecord) => void;
  onSharePdf: (doc: PdfDocumentRecord) => void;
  onDownloadPdf: (doc: PdfDocumentRecord) => void;
  onRenamePdf: (doc: PdfDocumentRecord) => void;
  onInfoPdf: (doc: PdfDocumentRecord) => void;
  onToggleFavorite: (doc: PdfDocumentRecord) => void;
  onDeletePdf: (doc: PdfDocumentRecord) => void;
}

export function MyPdfsView({
  documents,
  language,
  initialFilter,
  autoFocusSearch,
  onFilterChange,
  onCreateNew,
  onOpenPdf,
  onSharePdf,
  onDownloadPdf,
  onRenamePdf,
  onInfoPdf,
  onToggleFavorite,
  onDeletePdf,
}: MyPdfsViewProps) {
  const t = getStrings(language);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let list = documents.filter((doc) => {
      if (q && !doc.name.toLowerCase().includes(q)) return false;
      if (initialFilter === 'favorites') return doc.isFavorite;
      if (initialFilter === 'recent') return doc.createdAt >= sevenDaysAgo;
      return true;
    });

    // If 'recent' filter returns all recent, keep sorted; also cap nothing unless user wants recent
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'size_asc':
          return a.fileSize - b.fileSize;
        case 'size_desc':
          return b.fileSize - a.fileSize;
        case 'newest':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return list;
  }, [documents, query, initialFilter, sort]);

  const favCount = documents.filter((d) => d.isFavorite).length;

  const renderMenu = (doc: PdfDocumentRecord) => (
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
        Share PDF
      </button>
      <button
        type="button"
        onClick={() => {
          setOpenMenuId(null);
          onDownloadPdf(doc);
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Download className="h-4 w-4 text-slate-400" />
        Export to Downloads
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
        Rename PDF
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
            doc.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
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
        Delete PDF
      </button>
    </div>
  );

  return (
    <div className="space-y-6" onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {t.myPdfs}
          </h1>
          <p className="mt-1 text-sm text-slate-500 tabular-nums dark:text-slate-400">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} stored locally on this device
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="hidden min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE] sm:inline-flex"
        >
          <FilePlus2 className="h-4 w-4" />
          <span>{t.newPdf}</span>
        </button>
      </div>

      {/* Search + Sort + Layout Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus={autoFocusSearch}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pr-9 pl-10 text-sm text-slate-900 outline-none transition-colors focus:border-[#536DFE] focus:bg-white focus:ring-2 focus:ring-[#536DFE]/20 dark:border-slate-800 dark:bg-[#141C2E] dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 dark:border-slate-800 dark:bg-[#141C2E]">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <select
              aria-label="Sort PDFs"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="min-h-[42px] bg-transparent py-2 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="size_asc">Smallest Size</option>
              <option value="size_desc">Largest Size</option>
            </select>
          </div>

          {/* List / Grid toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAFC] p-1 dark:border-slate-800 dark:bg-[#141C2E]">
            <button
              type="button"
              onClick={() => setLayout('list')}
              aria-label="List view"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                layout === 'list'
                  ? 'bg-white text-[#536DFE] shadow-xs dark:bg-[#1E2754] dark:text-[#93A4FF]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                layout === 'grid'
                  ? 'bg-white text-[#536DFE] shadow-xs dark:bg-[#1E2754] dark:text-[#93A4FF]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 self-start rounded-xl bg-slate-100 p-1 sm:inline-flex dark:bg-[#141C2E]">
        {(
          [
            { id: 'all', label: `All PDFs (${documents.length})` },
            { id: 'recent', label: 'Recent PDFs' },
            { id: 'favorites', label: `Favorites (${favCount})` },
          ] as { id: PdfListFilter; label: string }[]
        ).map((tab) => {
          const active = initialFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`min-h-[38px] flex-1 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap sm:flex-initial ${
                active
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-[#1E2754] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Documents List or Grid */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] px-6 py-14 text-center dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDECEE] text-[#E52535] dark:bg-[#3A161C]">
            <FileText className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
            {query
              ? 'No matching PDFs found'
              : initialFilter === 'favorites'
                ? 'No favorite PDFs yet'
                : t.noPdfsTitle}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {query
              ? `No PDF filename matched "${query}".`
              : initialFilter === 'favorites'
                ? 'Star any PDF from its menu to keep it pinned in your favorites.'
                : t.noPdfsDesc}
          </p>
          {!query && initialFilter === 'all' && (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-5 min-h-[44px] rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
            >
              {t.createFirstPdf}
            </button>
          )}
        </div>
      ) : layout === 'list' ? (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#141C2E]">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
            >
              <button
                type="button"
                onClick={() => onOpenPdf(doc)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
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
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
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

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleFavorite(doc)}
                  aria-label={
                    doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                  className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-500 sm:flex dark:hover:bg-slate-800"
                >
                  <Star
                    className={`h-4 w-4 ${
                      doc.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={`More options for ${doc.name}`}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openMenuId === doc.id && renderMenu(doc)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#141C2E] dark:hover:border-slate-700"
            >
              <button
                type="button"
                onClick={() => onOpenPdf(doc)}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-900"
              >
                {doc.thumbnailDataUrl ? (
                  <img
                    src={doc.thumbnailDataUrl}
                    alt={`Cover of ${doc.name}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#E52535]">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
              </button>

              <div className="flex items-start justify-between gap-2 p-3.5">
                <button
                  type="button"
                  onClick={() => onOpenPdf(doc)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display text-sm font-bold text-slate-950 dark:text-white">
                      {doc.name}
                    </span>
                    {doc.isFavorite && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {doc.pageCount}p · {formatFileSize(doc.fileSize)} ·{' '}
                    {formatDate(doc.createdAt)}
                  </div>
                </button>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label={`More options for ${doc.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenuId === doc.id && renderMenu(doc)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
