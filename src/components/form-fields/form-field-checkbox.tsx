import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { CheckboxFormField } from '../../types/form-field';

interface FormFieldCheckboxProps {
  readonly field: CheckboxFormField;
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
}

export function FormFieldCheckbox({
  field,
  checked,
  onChange,
}: FormFieldCheckboxProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.checked);
    },
    [onChange],
  );
  return (
    <label className="flex h-full w-full cursor-pointer items-center justify-center rounded-sm border border-indigo-300 bg-white/95 hover:bg-indigo-50">
      <input
        type="checkbox"
        className="h-3/4 w-3/4 accent-indigo-600"
        checked={checked}
        disabled={field.readOnly}
        onChange={handleChange}
      />
    </label>
  );
}
