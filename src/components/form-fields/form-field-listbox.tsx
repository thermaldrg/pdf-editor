import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { ListboxFormField } from '../../types/form-field';

interface FormFieldListboxProps {
  readonly field: ListboxFormField;
  readonly selectedValues: ReadonlyArray<string>;
  readonly fontSizePx: number;
  readonly onChange: (next: ReadonlyArray<string>) => void;
}

export function FormFieldListbox({
  field,
  selectedValues,
  fontSizePx,
  onChange,
}: FormFieldListboxProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      const next: string[] = [];
      for (const option of Array.from(event.target.selectedOptions)) {
        next.push(option.value);
      }
      onChange(next);
    },
    [onChange],
  );
  return (
    <select
      multiple={field.multiSelect}
      className="h-full w-full rounded-sm border border-indigo-300 bg-white/95 px-1 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ fontSize: `${fontSizePx}px` }}
      value={field.multiSelect ? [...selectedValues] : (selectedValues[0] ?? '')}
      disabled={field.readOnly}
      onChange={handleChange}
    >
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
