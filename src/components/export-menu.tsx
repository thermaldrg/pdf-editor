import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompressionLevel } from '../types/compression-level';
import { COMPRESSION_LEVELS } from '../types/compression-level';

export type ExportCompression = CompressionLevel | 'none';

interface ExportMenuProps {
  readonly canExport: boolean;
  readonly isExporting: boolean;
  readonly activeCompression: ExportCompression | null;
  readonly onExport: (compression: ExportCompression) => void;
  readonly onOpenProtect: () => void;
}

export function ExportMenu({
  canExport,
  isExporting,
  activeCompression,
  onExport,
  onOpenProtect,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect((): (() => void) | undefined => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent): void => {
      const container: HTMLDivElement | null = containerRef.current;
      if (!container) return;
      if (container.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return (): void => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);
  const handlePrimaryClick = useCallback((): void => {
    setIsOpen(false);
    onExport('none');
  }, [onExport]);
  const handleToggle = useCallback((): void => {
    setIsOpen((current) => !current);
  }, []);
  const handleSelectLevel = useCallback(
    (level: CompressionLevel): void => {
      setIsOpen(false);
      onExport(level);
    },
    [onExport],
  );
  const handleOpenProtect = useCallback((): void => {
    setIsOpen(false);
    onOpenProtect();
  }, [onOpenProtect]);
  const isDisabled: boolean = !canExport || isExporting;
  const primaryLabel: string = resolvePrimaryLabel(
    isExporting,
    activeCompression,
  );
  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handlePrimaryClick}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-l-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <IconDownload />
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Export options"
        className="inline-flex items-center justify-center rounded-r-lg border-l border-indigo-500/40 bg-indigo-600 px-2 py-2 text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <IconChevronDown />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 flex min-w-[18rem] flex-col rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Compress before download
          </p>
          {COMPRESSION_LEVELS.map((definition) => (
            <button
              key={definition.id}
              type="button"
              role="menuitem"
              onClick={() => handleSelectLevel(definition.id)}
              className="flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">
                {definition.label}
              </span>
              <span className="text-xs text-slate-500">
                {definition.description}
              </span>
            </button>
          ))}
          <div className="my-1 h-px bg-slate-200" />
          <button
            type="button"
            role="menuitem"
            onClick={handleOpenProtect}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            <IconLock />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-slate-800">
                Protect with password…
              </span>
              <span className="text-xs text-slate-500">
                Encrypt the download with AES-256.
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function resolvePrimaryLabel(
  isExporting: boolean,
  activeCompression: ExportCompression | null,
): string {
  if (!isExporting) return 'Download PDF';
  if (activeCompression && activeCompression !== 'none') return 'Compressing…';
  return 'Exporting…';
}

function IconDownload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="mt-0.5 h-4 w-4 text-slate-500"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}
