import { memo, useCallback, useState } from 'react';
import type { TabState, TabStatus } from '../types/tab';

interface TabBarProps {
  readonly tabs: ReadonlyArray<TabState>;
  readonly activeId: string;
  readonly onActivate: (id: string) => void;
  readonly onClose: (id: string) => void;
  readonly onNewTab: () => void;
  readonly onOpenFileInNewTab: (file: File) => void;
}

const MAX_TAB_TITLE_LENGTH: number = 28;

export const TabBar = memo(function TabBar({
  tabs,
  activeId,
  onActivate,
  onClose,
  onNewTab,
  onOpenFileInNewTab,
}: TabBarProps) {
  const [isDragHover, setIsDragHover] = useState<boolean>(false);
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      if (!hasPdfPayload(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setIsDragHover(true);
    },
    [],
  );
  const handleDragLeave = useCallback((): void => {
    setIsDragHover(false);
  }, []);
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      setIsDragHover(false);
      const files: FileList = event.dataTransfer.files;
      for (let i: number = 0; i < files.length; i += 1) {
        const file: File | null = files.item(i);
        if (file && isPdfFile(file)) onOpenFileInNewTab(file);
      }
    },
    [onOpenFileInNewTab],
  );
  return (
    <div
      className={[
        'app-no-drag flex h-9 items-end gap-0 border-b border-slate-200 bg-slate-50 pl-3 transition-colors',
        isDragHover ? 'bg-indigo-50' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="tablist"
      aria-label="Open documents"
    >
      <div className="flex h-full flex-1 items-end gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <TabPill
            key={tab.id}
            tabId={tab.id}
            title={buildTabTitle(tab)}
            status={tab.status}
            isActive={tab.id === activeId}
            canClose={tabs.length > 1 || tab.status !== 'empty'}
            onActivate={onActivate}
            onClose={onClose}
          />
        ))}
        <NewTabButton onClick={onNewTab} />
      </div>
    </div>
  );
});

interface TabPillProps {
  readonly tabId: string;
  readonly title: string;
  readonly status: TabStatus;
  readonly isActive: boolean;
  readonly canClose: boolean;
  readonly onActivate: (id: string) => void;
  readonly onClose: (id: string) => void;
}

const TabPill = memo(function TabPill({
  tabId,
  title,
  status,
  isActive,
  canClose,
  onActivate,
  onClose,
}: TabPillProps) {
  const handleClick = useCallback((): void => onActivate(tabId), [tabId, onActivate]);
  const handleClose = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      onClose(tabId);
    },
    [tabId, onClose],
  );
  const handleAuxClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (event.button === 1 && canClose) {
        event.preventDefault();
        onClose(tabId);
      }
    },
    [tabId, canClose, onClose],
  );
  const baseClass: string = isActive
    ? 'bg-white text-slate-900 border-slate-200 border-b-white shadow-sm'
    : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900';
  return (
    <div
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate(tabId);
        }
      }}
      title={title}
      className={[
        'group flex h-8 max-w-[16rem] min-w-[7rem] cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 text-sm transition-colors',
        baseClass,
      ].join(' ')}
    >
      <TabIcon status={status} isActive={isActive} />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{title}</span>
      {canClose && (
        <button
          type="button"
          aria-label="Close tab"
          onClick={handleClose}
          className={[
            'inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-slate-400 transition-colors',
            isActive
              ? 'opacity-80 hover:bg-slate-200 hover:text-slate-700'
              : 'opacity-0 group-hover:opacity-80 hover:bg-slate-300 hover:text-slate-700',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-3 w-3"
          >
            <path d="M6 6L18 18M6 18L18 6" />
          </svg>
        </button>
      )}
    </div>
  );
});

interface NewTabButtonProps {
  readonly onClick: () => void;
}

function NewTabButton({ onClick }: NewTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open a new PDF in a new tab"
      title="Open a new PDF (Cmd/Ctrl + T)"
      className="ml-1 mb-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-4 w-4"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

interface TabIconProps {
  readonly status: TabStatus;
  readonly isActive: boolean;
}

function TabIcon({ status, isActive }: TabIconProps) {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorIcon />;
  if (status === 'needs-password') return <LockIcon />;
  return <DocumentIcon isActive={isActive} />;
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-indigo-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-3.5 w-3.5 flex-shrink-0 text-rose-500"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      className="h-3.5 w-3.5 flex-shrink-0 text-amber-500"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

interface DocumentIconProps {
  readonly isActive: boolean;
}

function DocumentIcon({ isActive }: DocumentIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      className={[
        'h-3.5 w-3.5 flex-shrink-0',
        isActive ? 'text-indigo-500' : 'text-slate-400',
      ].join(' ')}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function buildTabTitle(tab: TabState): string {
  if (tab.status === 'ready' && tab.pdf) return truncate(tab.pdf.fileName);
  if (tab.status === 'loading' && tab.loadingFileName) {
    return truncate(tab.loadingFileName);
  }
  if (tab.status === 'needs-password' && tab.loadingFileName) {
    return truncate(tab.loadingFileName);
  }
  if (tab.status === 'error') return 'Failed to open';
  return 'New tab';
}

function truncate(value: string): string {
  if (value.length <= MAX_TAB_TITLE_LENGTH) return value;
  return `${value.slice(0, MAX_TAB_TITLE_LENGTH - 1)}\u2026`;
}

function hasPdfPayload(event: React.DragEvent<HTMLDivElement>): boolean {
  const items: DataTransferItemList = event.dataTransfer.items;
  if (items.length === 0) return false;
  for (let i: number = 0; i < items.length; i += 1) {
    const item: DataTransferItem | null = items[i] ?? null;
    if (!item) continue;
    if (item.kind === 'file') return true;
  }
  return false;
}

function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}
