import { useCallback, useMemo, useState } from 'react';
import type { FormField } from '../types/form-field';
import type { FormFieldValue, FormFieldValues } from '../types/form-values';

export interface FormValuesApi {
  readonly values: FormFieldValues;
  readonly isDirty: boolean;
  readonly setText: (fieldName: string, value: string) => void;
  readonly setCheckbox: (fieldName: string, value: boolean) => void;
  readonly setRadio: (fieldName: string, value: string | null) => void;
  readonly setDropdown: (fieldName: string, value: string) => void;
  readonly setListbox: (
    fieldName: string,
    values: ReadonlyArray<string>,
  ) => void;
}

interface UseFormValuesArgs {
  readonly fields: ReadonlyArray<FormField>;
}

export function useFormValues({ fields }: UseFormValuesArgs): FormValuesApi {
  const initialValues: FormFieldValues = useMemo(
    () => buildInitialValues(fields),
    [fields],
  );
  const [trackedFields, setTrackedFields] =
    useState<ReadonlyArray<FormField>>(fields);
  const [values, setValues] = useState<FormFieldValues>(initialValues);
  if (trackedFields !== fields) {
    setTrackedFields(fields);
    setValues(initialValues);
  }

  const updateValue = useCallback(
    (fieldName: string, next: FormFieldValue): void => {
      setValues((current) => {
        const updated: Map<string, FormFieldValue> = new Map(current);
        updated.set(fieldName, next);
        return updated;
      });
    },
    [],
  );

  const setText = useCallback(
    (fieldName: string, value: string): void => {
      updateValue(fieldName, { kind: 'text', value });
    },
    [updateValue],
  );

  const setCheckbox = useCallback(
    (fieldName: string, value: boolean): void => {
      updateValue(fieldName, { kind: 'checkbox', value });
    },
    [updateValue],
  );

  const setRadio = useCallback(
    (fieldName: string, value: string | null): void => {
      updateValue(fieldName, { kind: 'radio', value });
    },
    [updateValue],
  );

  const setDropdown = useCallback(
    (fieldName: string, value: string): void => {
      updateValue(fieldName, { kind: 'dropdown', value });
    },
    [updateValue],
  );

  const setListbox = useCallback(
    (fieldName: string, next: ReadonlyArray<string>): void => {
      updateValue(fieldName, { kind: 'listbox', value: next });
    },
    [updateValue],
  );

  const isDirty: boolean = useMemo(
    () => detectDirty(initialValues, values),
    [initialValues, values],
  );

  return {
    values,
    isDirty,
    setText,
    setCheckbox,
    setRadio,
    setDropdown,
    setListbox,
  };
}

function buildInitialValues(
  fields: ReadonlyArray<FormField>,
): FormFieldValues {
  const map: Map<string, FormFieldValue> = new Map();
  for (const field of fields) {
    seedFieldValue({ field, map });
  }
  return map;
}

interface SeedFieldValueArgs {
  readonly field: FormField;
  readonly map: Map<string, FormFieldValue>;
}

function seedFieldValue({ field, map }: SeedFieldValueArgs): void {
  if (field.kind === 'text') {
    map.set(field.name, { kind: 'text', value: field.defaultValue });
    return;
  }
  if (field.kind === 'checkbox') {
    map.set(field.name, { kind: 'checkbox', value: field.defaultChecked });
    return;
  }
  if (field.kind === 'radio') {
    const existing: FormFieldValue | undefined = map.get(field.name);
    if (existing && existing.kind === 'radio' && existing.value !== null) return;
    const value: string | null = field.defaultSelected ? field.exportValue : null;
    map.set(field.name, { kind: 'radio', value });
    return;
  }
  if (field.kind === 'dropdown') {
    map.set(field.name, { kind: 'dropdown', value: field.defaultValue });
    return;
  }
  if (field.kind === 'listbox') {
    map.set(field.name, { kind: 'listbox', value: field.defaultValues });
    return;
  }
}

function detectDirty(
  initial: FormFieldValues,
  current: FormFieldValues,
): boolean {
  if (initial.size !== current.size) return true;
  for (const [name, value] of current) {
    const baseline: FormFieldValue | undefined = initial.get(name);
    if (!baseline) return true;
    if (!areValuesEqual(baseline, value)) return true;
  }
  return false;
}

function areValuesEqual(a: FormFieldValue, b: FormFieldValue): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'text' && b.kind === 'text') return a.value === b.value;
  if (a.kind === 'checkbox' && b.kind === 'checkbox') return a.value === b.value;
  if (a.kind === 'radio' && b.kind === 'radio') return a.value === b.value;
  if (a.kind === 'dropdown' && b.kind === 'dropdown') return a.value === b.value;
  if (a.kind === 'listbox' && b.kind === 'listbox') {
    if (a.value.length !== b.value.length) return false;
    for (let i: number = 0; i < a.value.length; i += 1) {
      if (a.value[i] !== b.value[i]) return false;
    }
    return true;
  }
  return false;
}
