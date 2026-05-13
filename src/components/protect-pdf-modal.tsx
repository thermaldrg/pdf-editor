import { useCallback, useMemo, useState } from 'react';
import type { ExportCompression } from './export-menu';
import { COMPRESSION_LEVELS } from '../types/compression-level';
import type { CompressionLevelDefinition } from '../types/compression-level';
import { Button } from './button';

const MIN_PASSWORD_LENGTH: number = 4;

interface ProtectPdfModalProps {
  readonly isProtecting: boolean;
  readonly errorMessage: string | null;
  readonly onClose: () => void;
  readonly onConfirm: (
    password: string,
    compression: ExportCompression,
  ) => void;
}

export function ProtectPdfModal({
  isProtecting,
  errorMessage,
  onClose,
  onConfirm,
}: ProtectPdfModalProps) {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [compression, setCompression] = useState<ExportCompression>('none');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const validation: ValidationResult = useMemo(
    () => validatePassword({ password, confirmPassword }),
    [password, confirmPassword],
  );
  const canSubmit: boolean = validation.isValid && !isProtecting;
  const handleSubmit = useCallback((): void => {
    if (!canSubmit) return;
    onConfirm(password, compression);
  }, [canSubmit, compression, onConfirm, password]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      handleSubmit();
    },
    [handleSubmit],
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Protect with password
          </h3>
          <p className="text-sm text-slate-500">
            Encrypts the downloaded PDF with AES-256. Anyone opening the file
            will need this password.
          </p>
        </div>
        <PasswordField
          label="Password"
          value={password}
          autoFocus
          showPassword={showPassword}
          disabled={isProtecting}
          onChange={setPassword}
          onToggleVisibility={() => setShowPassword((current) => !current)}
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          showPassword={showPassword}
          disabled={isProtecting}
          onChange={setConfirmPassword}
          onToggleVisibility={() => setShowPassword((current) => !current)}
        />
        <CompressionPicker
          selected={compression}
          disabled={isProtecting}
          onSelect={setCompression}
        />
        {validation.warning && password.length > 0 && (
          <p className="mt-3 text-xs text-amber-600">{validation.warning}</p>
        )}
        {errorMessage && (
          <p className="mt-3 text-sm text-rose-600">{errorMessage}</p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isProtecting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isProtecting ? 'Protecting…' : 'Download protected PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  readonly label: string;
  readonly value: string;
  readonly showPassword: boolean;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
  readonly onChange: (value: string) => void;
  readonly onToggleVisibility: () => void;
}

function PasswordField({
  label,
  value,
  showPassword,
  disabled,
  autoFocus,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <label className="mb-3 flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <div className="relative flex items-center">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  );
}

interface CompressionPickerProps {
  readonly selected: ExportCompression;
  readonly disabled: boolean;
  readonly onSelect: (value: ExportCompression) => void;
}

function CompressionPicker({
  selected,
  disabled,
  onSelect,
}: CompressionPickerProps) {
  return (
    <fieldset className="mt-2 mb-1 flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-slate-700">
        Compression
      </legend>
      <CompressionOption
        id="none"
        label="None"
        description="Keep original quality."
        isSelected={selected === 'none'}
        disabled={disabled}
        onSelect={onSelect}
      />
      {COMPRESSION_LEVELS.map((definition: CompressionLevelDefinition) => (
        <CompressionOption
          key={definition.id}
          id={definition.id}
          label={definition.label}
          description={definition.description}
          isSelected={selected === definition.id}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </fieldset>
  );
}

interface CompressionOptionProps {
  readonly id: ExportCompression;
  readonly label: string;
  readonly description: string;
  readonly isSelected: boolean;
  readonly disabled: boolean;
  readonly onSelect: (value: ExportCompression) => void;
}

function CompressionOption({
  id,
  label,
  description,
  isSelected,
  disabled,
  onSelect,
}: CompressionOptionProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors ${
        isSelected
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="radio"
        name="protect-compression"
        value={id}
        checked={isSelected}
        disabled={disabled}
        onChange={() => onSelect(id)}
        className="mt-1 h-4 w-4 text-indigo-600"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly warning: string | null;
}

interface ValidatePasswordArgs {
  readonly password: string;
  readonly confirmPassword: string;
}

function validatePassword({
  password,
  confirmPassword,
}: ValidatePasswordArgs): ValidationResult {
  if (password.length === 0) {
    return { isValid: false, warning: null };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      warning: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (confirmPassword.length === 0) {
    return { isValid: false, warning: 'Please confirm the password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, warning: 'Passwords do not match.' };
  }
  return { isValid: true, warning: null };
}
