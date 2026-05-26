import type { FormField } from '../types/form-field';
import type { FormFieldValue, FormFieldValues } from '../types/form-values';

/**
 * Pure helpers for seeding, updating, and comparing form-field value maps.
 *
 * The tabs reducer owns the actual `FormFieldValues` map and only ever mutates
 * it through these helpers, which keeps the reducer thin and lets us treat
 * "has the user edited this PDF's form fields?" as a derived predicate.
 */

const EMPTY_VALUES: FormFieldValues = new Map();

export function buildInitialFormValues(
  fields: ReadonlyArray<FormField>,
): FormFieldValues {
  if (fields.length === 0) return EMPTY_VALUES;
  const map: Map<string, FormFieldValue> = new Map();
  for (const field of fields) {
    seedFieldValue({ field, map });
  }
  return map;
}

export function setFormValue(
  values: FormFieldValues,
  fieldName: string,
  next: FormFieldValue,
): FormFieldValues {
  const updated: Map<string, FormFieldValue> = new Map(values);
  updated.set(fieldName, next);
  return updated;
}

export function areFormValuesDirty(
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
