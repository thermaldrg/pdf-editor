import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { RadioFormField } from '../../types/form-field';

interface FormFieldRadioProps {
  readonly field: RadioFormField;
  readonly selectedValue: string | null;
  readonly onChange: (next: string) => void;
}

export function FormFieldRadio({
  field,
  selectedValue,
  onChange,
}: FormFieldRadioProps) {
  const isChecked: boolean = selectedValue === field.exportValue;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      if (event.target.checked) onChange(field.exportValue);
    },
    [field.exportValue, onChange],
  );
  return (
    <label className="flex h-full w-full cursor-pointer items-center justify-center rounded-full border border-indigo-300 bg-white/95 hover:bg-indigo-50">
      <input
        type="radio"
        className="h-3/4 w-3/4 accent-indigo-600"
        name={field.name}
        value={field.exportValue}
        checked={isChecked}
        disabled={field.readOnly}
        onChange={handleChange}
      />
    </label>
  );
}
