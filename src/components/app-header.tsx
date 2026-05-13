import type { ExportCompression } from './export-menu';
import { ExportMenu } from './export-menu';

interface AppHeaderProps {
  readonly fileName: string | null;
  readonly hasDocument: boolean;
  readonly canExport: boolean;
  readonly isExporting: boolean;
  readonly exportingCompression: ExportCompression | null;
  readonly onExport: (compression: ExportCompression) => void;
  readonly onOpenProtect: () => void;
  readonly onReplaceFile: () => void;
  readonly onOpenMerge: () => void;
  readonly onOpenCompress: () => void;
}

export function AppHeader({
  fileName,
  hasDocument,
  canExport,
  isExporting,
  exportingCompression,
  onExport,
  onOpenProtect,
  onReplaceFile,
  onOpenMerge,
  onOpenCompress,
}: AppHeaderProps) {
  return (
    <header className="app-drag sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="app-header-inner mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
        <Brand />
        {hasDocument && (
          <>
            <Divider />
            <FileChip fileName={fileName} />
            <div className="app-no-drag ml-auto flex items-center gap-1">
              <HeaderAction
                icon={<IconReplace />}
                label="Replace"
                onClick={onReplaceFile}
              />
              <HeaderAction
                icon={<IconMerge />}
                label="Merge"
                onClick={onOpenMerge}
              />
              <HeaderAction
                icon={<IconCompress />}
                label="Compress"
                onClick={onOpenCompress}
              />
              <Divider />
              <ExportMenu
                canExport={canExport}
                isExporting={isExporting}
                activeCompression={exportingCompression}
                onExport={onExport}
                onOpenProtect={onOpenProtect}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
        <IconBrand />
      </div>
      <span className="text-sm font-semibold tracking-tight text-slate-900">
        PDF Editor
      </span>
    </div>
  );
}

interface FileChipProps {
  readonly fileName: string | null;
}

function FileChip({ fileName }: FileChipProps) {
  const label: string = fileName ?? 'Untitled document';
  return (
    <div
      className="flex min-w-0 max-w-[28rem] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1"
      title={label}
    >
      <IconDocument />
      <span className="truncate text-sm font-medium text-slate-700">
        {label}
      </span>
    </div>
  );
}

interface HeaderActionProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}

function HeaderAction({ icon, label, onClick }: HeaderActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      {icon}
      {label}
    </button>
  );
}

function Divider() {
  return <div className="h-6 w-px bg-slate-200" aria-hidden="true" />;
}

function IconBrand() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
      />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4 flex-shrink-0 text-slate-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function IconReplace() {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function IconMerge() {
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
        d="M7.5 7.5L12 3m0 0l4.5 4.5M12 3v13.5m6 0l-3 3m0 0l-3-3m3 3V13.5"
      />
    </svg>
  );
}

function IconCompress() {
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
        d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
      />
    </svg>
  );
}
