import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { TextFormField } from '../../types/form-field';

interface FormFieldTextProps {
  readonly field: TextFormField;
  readonly value: string;
  readonly fontSizePx: number;
  readonly onChange: (next: string) => void;
}

export function FormFieldText({
  field,
  value,
  fontSizePx,
  onChange,
}: FormFieldTextProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      onChange(event.target.value);
    },
    [onChange],
  );
  const sharedClass: string =
    'h-full w-full resize-none rounded-sm border border-indigo-300 bg-white/95 px-1 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60';
  const style: React.CSSProperties = { fontSize: `${fontSizePx}px` };
  if (field.multiline) {
    return (
      <textarea
        className={sharedClass}
        style={style}
        value={value}
        disabled={field.readOnly}
        maxLength={field.maxLength ?? undefined}
        onChange={handleChange}
        spellCheck={false}
      />
    );
  }
  return (
    <input
      type={field.password ? 'password' : 'text'}
      className={sharedClass}
      style={style}
      value={value}
      disabled={field.readOnly}
      maxLength={field.maxLength ?? undefined}
      onChange={handleChange}
      spellCheck={false}
    />
  );
}
