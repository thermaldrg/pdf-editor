import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { DropdownFormField } from '../../types/form-field';

interface FormFieldDropdownProps {
  readonly field: DropdownFormField;
  readonly value: string;
  readonly fontSizePx: number;
  readonly onChange: (next: string) => void;
}

export function FormFieldDropdown({
  field,
  value,
  fontSizePx,
  onChange,
}: FormFieldDropdownProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>): void => {
      onChange(event.target.value);
    },
    [onChange],
  );
  const sharedClass: string =
    'h-full w-full rounded-sm border border-indigo-300 bg-white/95 px-1 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60';
  const style: React.CSSProperties = { fontSize: `${fontSizePx}px` };
  if (field.editable) {
    const listId: string = `form-options-${field.id}`;
    return (
      <>
        <input
          type="text"
          list={listId}
          className={sharedClass}
          style={style}
          value={value}
          disabled={field.readOnly}
          onChange={handleChange}
          spellCheck={false}
        />
        <datalist id={listId}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </>
    );
  }
  return (
    <select
      className={sharedClass}
      style={style}
      value={value}
      disabled={field.readOnly}
      onChange={handleChange}
    >
      <option value="" />
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
