import { useRef } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  readonly onOpenFile: (file: File) => void;
  readonly errorMessage: string | null;
  readonly isLoading: boolean;
}

export function EmptyState({
  onOpenFile,
  errorMessage,
  isLoading,
}: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = (): void => {
    inputRef.current?.click();
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file: File | undefined = event.target.files?.[0];
    if (file) onOpenFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const file: File | undefined = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') onOpenFile(file);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex w-full max-w-xl flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h2 className="mb-1 text-xl font-semibold text-slate-900">
          Drop a PDF here to get started
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Add text, drop your signature, then export a flattened PDF.
        </p>
        <Button
          variant="primary"
          onClick={handleBrowseClick}
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : 'Choose PDF'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        {errorMessage && (
          <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
