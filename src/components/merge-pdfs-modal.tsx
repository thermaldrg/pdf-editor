import { useRef, useState } from 'react';
import { formatBytes } from '../lib/format-bytes';
import type { MergeMode } from '../types/merge-mode';
import { Button } from './button';

interface MergePdfsModalProps {
  readonly isMerging: boolean;
  readonly mergingMode: MergeMode | null;
  readonly errorMessage: string | null;
  readonly onClose: () => void;
  readonly onConfirm: (files: ReadonlyArray<File>, mode: MergeMode) => void;
}

const MIN_FILES_TO_MERGE: number = 2;

export function MergePdfsModal({
  isMerging,
  mergingMode,
  errorMessage,
  onClose,
  onConfirm,
}: MergePdfsModalProps) {
  const [files, setFiles] = useState<ReadonlyArray<File>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePickFiles = (): void => {
    inputRef.current?.click();
  };

  const handleAddFiles = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const picked: File[] = readPdfFiles(event.target.files);
    event.target.value = '';
    if (picked.length === 0) return;
    setFiles((current) => [...current, ...picked]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const dropped: File[] = readPdfFiles(event.dataTransfer.files);
    if (dropped.length === 0) return;
    setFiles((current) => [...current, ...dropped]);
  };

  const handleRemove = (index: number): void => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: -1 | 1): void => {
    setFiles((current) => moveItem(current, index, direction));
  };

  const handleClear = (): void => {
    setFiles([]);
  };

  const handleConfirm = (mode: MergeMode): void => {
    if (files.length < MIN_FILES_TO_MERGE) return;
    onConfirm(files, mode);
  };

  const canMerge: boolean = files.length >= MIN_FILES_TO_MERGE && !isMerging;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Merge PDFs</h3>
          <p className="text-sm text-slate-500">
            Add two or more PDFs, reorder them, then merge into a single file.
          </p>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        >
          <p className="mb-3 text-sm text-slate-500">
            Drop PDFs here or browse to add files.
          </p>
          <Button variant="secondary" onClick={handlePickFiles}>
            Add PDFs
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleAddFiles}
          />
        </div>
        {files.length > 0 && (
          <FilesList
            files={files}
            onRemove={handleRemove}
            onMove={handleMove}
          />
        )}
        {errorMessage && (
          <p className="mb-3 text-sm text-rose-600">{errorMessage}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={files.length === 0 || isMerging}
          >
            Clear all
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isMerging}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!canMerge}
              onClick={() => handleConfirm('edit')}
            >
              {mergingMode === 'edit' ? 'Merging…' : 'Merge & edit'}
            </Button>
            <Button
              variant="primary"
              disabled={!canMerge}
              onClick={() => handleConfirm('download')}
            >
              {mergingMode === 'download' ? 'Merging…' : 'Merge & download'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilesListProps {
  readonly files: ReadonlyArray<File>;
  readonly onRemove: (index: number) => void;
  readonly onMove: (index: number, direction: -1 | 1) => void;
}

function FilesList({ files, onRemove, onMove }: FilesListProps) {
  return (
    <ol className="mb-3 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
      {files.map((file, index) => (
        <FileRow
          key={`${file.name}-${index}`}
          file={file}
          index={index}
          isFirst={index === 0}
          isLast={index === files.length - 1}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </ol>
  );
}

interface FileRowProps {
  readonly file: File;
  readonly index: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onRemove: (index: number) => void;
  readonly onMove: (index: number, direction: -1 | 1) => void;
}

function FileRow({
  file,
  index,
  isFirst,
  isLast,
  onRemove,
  onMove,
}: FileRowProps) {
  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
        {file.name}
      </span>
      <span className="shrink-0 text-xs text-slate-400">
        {formatBytes(file.size)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          ariaLabel="Move up"
          disabled={isFirst}
          onClick={() => onMove(index, -1)}
        >
          ↑
        </IconButton>
        <IconButton
          ariaLabel="Move down"
          disabled={isLast}
          onClick={() => onMove(index, 1)}
        >
          ↓
        </IconButton>
        <IconButton ariaLabel="Remove" onClick={() => onRemove(index)}>
          ×
        </IconButton>
      </div>
    </li>
  );
}

interface IconButtonProps {
  readonly ariaLabel: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
}

function IconButton({
  ariaLabel,
  onClick,
  disabled = false,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function readPdfFiles(list: FileList | null): File[] {
  if (!list) return [];
  return Array.from(list).filter((file) => isPdfFile(file));
}

function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}

function moveItem<T>(
  list: ReadonlyArray<T>,
  index: number,
  direction: -1 | 1,
): T[] {
  const target: number = index + direction;
  if (target < 0 || target >= list.length) return [...list];
  const next: T[] = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

