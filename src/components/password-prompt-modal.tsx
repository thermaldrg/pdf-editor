import { useCallback, useState } from 'react';
import { Button } from './button';

interface PasswordPromptModalProps {
  readonly fileName: string;
  readonly isIncorrect: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
  readonly onSubmit: (password: string) => void;
  readonly onCancel: () => void;
}

export function PasswordPromptModal({
  fileName,
  isIncorrect,
  isSubmitting,
  errorMessage,
  onSubmit,
  onCancel,
}: PasswordPromptModalProps) {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [lastIncorrect, setLastIncorrect] = useState<boolean>(isIncorrect);
  if (isIncorrect !== lastIncorrect) {
    setLastIncorrect(isIncorrect);
    if (isIncorrect) setPassword('');
  }
  const canSubmit: boolean = password.length > 0 && !isSubmitting;
  const handleSubmit = useCallback((): void => {
    if (!canSubmit) return;
    onSubmit(password);
  }, [canSubmit, onSubmit, password]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Enter') return;
      event.preventDefault();
      handleSubmit();
    },
    [handleSubmit, onCancel],
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <IconLock />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">
              Password required
            </h3>
            <p className="truncate text-sm text-slate-500" title={fileName}>
              {fileName}
            </p>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          This PDF is password protected. Enter the password to open and edit
          it.
        </p>
        <label className="mb-1 flex flex-col gap-1 text-sm font-medium text-slate-700">
          Password
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              autoFocus
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isSubmitting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        {errorMessage && (
          <p className="mt-3 text-sm text-rose-600">{errorMessage}</p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Unlocking…' : 'Unlock PDF'}
          </Button>
        </div>
      </div>
    </div>
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
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"
      />
    </svg>
  );
}
