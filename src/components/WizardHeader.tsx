import { ArrowLeft, Check } from 'lucide-react';
import type { AppRoute } from '../types/pdf';

interface WizardHeaderProps {
  currentStep: 'gallery' | 'editor' | 'page_settings' | 'create_pdf';
  title: string;
  subtitle?: string;
  canNavigateToStep: (step: AppRoute) => boolean;
  onBack: () => void;
  onStepClick: (step: AppRoute) => void;
  rightSlot?: React.ReactNode;
}

const STEPS: { id: 'gallery' | 'editor' | 'page_settings' | 'create_pdf'; label: string }[] = [
  { id: 'gallery', label: 'Select' },
  { id: 'editor', label: 'Edit & Filter' },
  { id: 'page_settings', label: 'Page Size' },
  { id: 'create_pdf', label: 'Create PDF' },
];

export function WizardHeader({
  currentStep,
  title,
  subtitle,
  canNavigateToStep,
  onBack,
  onStepClick,
  rightSlot,
}: WizardHeaderProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-[#141C2E] dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      {/* Stepper bar */}
      <nav aria-label="PDF creation steps" className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center gap-2">
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = idx < currentIdx;
            const clickable = canNavigateToStep(step.id);

            return (
              <li key={step.id} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(step.id)}
                  className={`flex min-h-[38px] items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#536DFE] text-white'
                      : isCompleted
                        ? 'bg-[#EEF1FF] text-[#3D5AFE] hover:bg-[#E0E7FF] dark:bg-[#1E2754] dark:text-[#93A4FF]'
                        : clickable
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300'
                          : 'cursor-not-allowed bg-slate-100/70 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isCompleted
                          ? 'bg-[#536DFE] text-white'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <span
                    className="h-px w-4 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
