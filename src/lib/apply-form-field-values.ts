import type { PDFCheckBox, PDFDocument, PDFDropdown, PDFForm, PDFOptionList, PDFRadioGroup, PDFTextField } from 'pdf-lib';
import type { FormFieldValue, FormFieldValues } from '../types/form-values';

/**
 * Writes user-supplied form values into the document's AcroForm, then flattens
 * the form so the values are baked into page content and survive subsequent
 * `copyPages` operations. Unknown or read-only fields are skipped gracefully so
 * a single corrupt field never aborts the whole export.
 */
export function applyFormFieldValues({
  document,
  values,
}: {
  readonly document: PDFDocument;
  readonly values: FormFieldValues;
}): void {
  if (values.size === 0) return;
  const form: PDFForm = readForm(document);
  if (!form) return;
  for (const [fieldName, value] of values) {
    setFieldValueSafely({ form, fieldName, value });
  }
  flattenSafely(form);
}

function readForm(document: PDFDocument): PDFForm {
  return document.getForm();
}

interface SetFieldValueArgs {
  readonly form: PDFForm;
  readonly fieldName: string;
  readonly value: FormFieldValue;
}

function setFieldValueSafely({
  form,
  fieldName,
  value,
}: SetFieldValueArgs): void {
  try {
    setFieldValue({ form, fieldName, value });
  } catch {
    // Field is missing, read-only, or has an incompatible type. Skip silently
    // so one stale or renamed field cannot block the rest of the export.
  }
}

function setFieldValue({ form, fieldName, value }: SetFieldValueArgs): void {
  if (value.kind === 'text') {
    const field: PDFTextField = form.getTextField(fieldName);
    field.setText(value.value.length > 0 ? value.value : undefined);
    return;
  }
  if (value.kind === 'checkbox') {
    const field: PDFCheckBox = form.getCheckBox(fieldName);
    if (value.value) field.check();
    else field.uncheck();
    return;
  }
  if (value.kind === 'radio') {
    const field: PDFRadioGroup = form.getRadioGroup(fieldName);
    if (value.value === null) field.clear();
    else field.select(value.value);
    return;
  }
  if (value.kind === 'dropdown') {
    const field: PDFDropdown = form.getDropdown(fieldName);
    if (value.value.length === 0) field.clear();
    else field.select(value.value);
    return;
  }
  if (value.kind === 'listbox') {
    const field: PDFOptionList = form.getOptionList(fieldName);
    if (value.value.length === 0) field.clear();
    else field.select([...value.value]);
    return;
  }
}

function flattenSafely(form: PDFForm): void {
  try {
    form.flatten();
  } catch {
    // pdf-lib throws when no fields exist or appearance generation fails for a
    // single field; falling back to a non-flattened form is preferable to
    // aborting the export entirely.
  }
}
