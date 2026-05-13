import { useRef, useState } from 'react';
import { formatBytes } from '../lib/format-bytes';
import type {
  CompressionLevel,
  CompressionLevelDefinition,
} from '../types/compression-level';
import {
  COMPRESSION_LEVELS,
  DEFAULT_COMPRESSION_LEVEL,
} from '../types/compression-level';
import type { CompressMode } from '../types/compress-mode';
import { Button } from './button';

interface CompressPdfModalProps {
  readonly isCompressing: boolean;
  readonly compressingMode: CompressMode | null;
  readonly errorMessage: string | null;
  readonly onClose: () => void;
  readonly onConfirm: (
    file: File,
    level: CompressionLevel,
    mode: CompressMode,
  ) => void;
}

export function CompressPdfModal({
  isCompressing,
  compressingMode,
  errorMessage,
  onClose,
  onConfirm,
}: CompressPdfModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>(
    DEFAULT_COMPRESSION_LEVEL,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePickFile = (): void => {
    inputRef.current?.click();
  };

  const handleSelectFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const picked: File | undefined = readPdfFile(event.target.files);
    event.target.value = '';
    if (!picked) return;
    setFile(picked);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const dropped: File | undefined = readPdfFile(event.dataTransfer.files);
    if (!dropped) return;
    setFile(dropped);
  };

  const handleConfirm = (mode: CompressMode): void => {
    if (!file) return;
    onConfirm(file, level, mode);
  };

  const canCompress: boolean = file !== null && !isCompressing;
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
          <h3 className="text-lg font-semibold text-slate-900">Compress PDF</h3>
          <p className="text-sm text-slate-500">
            Reduce file size by re-encoding pages as compressed images.
          </p>
        </div>
        {file ? (
          <SelectedFileRow
            file={file}
            disabled={isCompressing}
            onChange={handlePickFile}
            onClear={() => setFile(null)}
          />
        ) : (
          <FileDropZone onDrop={handleDrop} onPick={handlePickFile} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleSelectFile}
        />
        <LevelPicker
          selected={level}
          disabled={isCompressing}
          onSelect={setLevel}
        />
        {errorMessage && (
          <p className="mb-3 text-sm text-rose-600">{errorMessage}</p>
        )}
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isCompressing}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={!canCompress}
            onClick={() => handleConfirm('edit')}
          >
            {compressingMode === 'edit' ? 'Compressing…' : 'Compress & edit'}
          </Button>
          <Button
            variant="primary"
            disabled={!canCompress}
            onClick={() => handleConfirm('download')}
          >
            {compressingMode === 'download'
              ? 'Compressing…'
              : 'Compress & download'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FileDropZoneProps {
  readonly onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  readonly onPick: () => void;
}

function FileDropZone({ onDrop, onPick }: FileDropZoneProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
    >
      <p className="mb-3 text-sm text-slate-500">
        Drop a PDF here or browse to select a file.
      </p>
      <Button variant="secondary" onClick={onPick}>
        Choose PDF
      </Button>
    </div>
  );
}

interface SelectedFileRowProps {
  readonly file: File;
  readonly disabled: boolean;
  readonly onChange: () => void;
  readonly onClear: () => void;
}

function SelectedFileRow({
  file,
  disabled,
  onChange,
  onClear,
}: SelectedFileRowProps) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {file.name}
        </p>
        <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" onClick={onChange} disabled={disabled}>
          Change
        </Button>
        <Button variant="ghost" onClick={onClear} disabled={disabled}>
          Remove
        </Button>
      </div>
    </div>
  );
}

interface LevelPickerProps {
  readonly selected: CompressionLevel;
  readonly disabled: boolean;
  readonly onSelect: (level: CompressionLevel) => void;
}

function LevelPicker({ selected, disabled, onSelect }: LevelPickerProps) {
  return (
    <fieldset className="mb-4 flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-slate-700">
        Compression level
      </legend>
      {COMPRESSION_LEVELS.map((definition) => (
        <LevelOption
          key={definition.id}
          definition={definition}
          isSelected={definition.id === selected}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </fieldset>
  );
}

interface LevelOptionProps {
  readonly definition: CompressionLevelDefinition;
  readonly isSelected: boolean;
  readonly disabled: boolean;
  readonly onSelect: (level: CompressionLevel) => void;
}

function LevelOption({
  definition,
  isSelected,
  disabled,
  onSelect,
}: LevelOptionProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        isSelected
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="radio"
        name="compression-level"
        value={definition.id}
        checked={isSelected}
        disabled={disabled}
        onChange={() => onSelect(definition.id)}
        className="mt-1 h-4 w-4 text-indigo-600"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{definition.label}</p>
        <p className="text-xs text-slate-500">{definition.description}</p>
      </div>
    </label>
  );
}

function readPdfFile(list: FileList | null): File | undefined {
  if (!list) return undefined;
  for (const candidate of Array.from(list)) {
    if (isPdfFile(candidate)) return candidate;
  }
  return undefined;
}

function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}
