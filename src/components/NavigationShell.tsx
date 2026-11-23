import { useEffect, useRef } from 'react';
import {
  FileText,
  Home,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import type { AppLanguage, AppRoute } from '../types/pdf';
import { formatFileSize } from '../utils/format';
import { getStrings } from '../utils/i18n';
import { BrandLogo } from './BrandLogo';

interface NavigationShellProps {
  route: AppRoute;
  language: AppLanguage;
  totalPdfs: number;
  totalBytes: number;
  onNavigate: (route: AppRoute) => void;
  onOpenSearch: () => void;
  onOpenNewPdf: () => void;
  children: React.ReactNode;
}

const PRIMARY_ROUTES: AppRoute[] = ['home', 'my_pdfs', 'settings'];

export function NavigationShell({
  route,
  language,
  totalPdfs,
  totalBytes,
  onNavigate,
  onOpenSearch,
  onOpenNewPdf,
  children,
}: NavigationShellProps) {
  const t = getStrings(language);
  const isPrimaryTab = PRIMARY_ROUTES.includes(route);
  const showFab = route === 'home' || route === 'my_pdfs';
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset scroll to top cleanly when switching screens
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const navItems: { id: AppRoute; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'my_pdfs', label: t.myPdfs, icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-slate-900 lg:flex-row dark:bg-[#0B1120] dark:text-slate-100">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-[#F8FAFC] lg:flex dark:border-slate-800 dark:bg-[#0F172A]">
        <div className="flex items-center gap-3 px-6 py-5">
          <BrandLogo size={36} />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-white">
            {t.appName}
          </span>
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onOpenNewPdf}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#536DFE] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5AFE] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">{t.newPdf}</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              route === item.id ||
              (item.id === 'my_pdfs' && route === 'pdf_reader');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#EEF1FF] text-[#3D5AFE] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </span>
                {item.id === 'my_pdfs' && totalPdfs > 0 && (
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {totalPdfs}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>Local library</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {formatFileSize(totalBytes)}
            </span>
          </div>
          <div className="mt-1 text-slate-400 dark:text-slate-500">
            {totalPdfs} {totalPdfs === 1 ? 'document' : 'documents'} saved on device
          </div>
        </div>
      </aside>

      {/* Main Column: Mobile Top Bar (shrink-0) + Dedicated Vertical Scroll Container + Mobile Bottom Bar (shrink-0) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile Top Bar (in normal flex flow so it never overlaps or blocks scrolling) */}
        {isPrimaryTab && (
          <header className="z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 pt-safe lg:hidden dark:border-slate-800 dark:bg-[#0B1120]">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 whitespace-nowrap"
            >
              <BrandLogo size={32} />
              <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {t.appName}
              </span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Search PDFs"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>
        )}

        {/* Dedicated Vertically Scrollable Viewport */}
        <div
          ref={scrollContainerRef}
          className={`app-scroll-container min-h-0 flex-1 ${
            !isPrimaryTab ? 'pt-safe' : ''
          }`}
        >
          <main
            className={`mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 ${
              showFab ? 'pb-24 lg:pb-10' : 'pb-10 pb-safe'
            }`}
          >
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (in normal flex flow so it never covers scrollable content) */}
        {isPrimaryTab && (
          <nav
            aria-label="Bottom navigation"
            className="z-20 shrink-0 border-t border-slate-200 bg-white pb-safe lg:hidden dark:border-slate-800 dark:bg-[#0F172A]"
          >
            <div className="grid h-16 grid-cols-3 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = route === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                      active
                        ? 'text-[#536DFE] dark:text-[#8C9EFF]'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* Floating Action Button (+) positioned cleanly above bottom nav without blocking page scroll */}
      {showFab && (
        <button
          type="button"
          onClick={onOpenNewPdf}
          aria-label="Create new PDF"
          className="bottom-nav-offset fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#536DFE] text-white shadow-lg shadow-[#536DFE]/30 transition-transform hover:bg-[#3D5AFE] active:scale-95 lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
