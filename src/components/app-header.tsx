import type { ReactNode } from 'react';

interface AppHeaderProps {
  readonly fileName: string | null;
  readonly actions: ReactNode;
}

export function AppHeader({ fileName, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              PDF Editor
            </h1>
            <p className="text-xs text-slate-500 leading-tight">
              {fileName ?? 'Fill, sign, and export your PDFs'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
