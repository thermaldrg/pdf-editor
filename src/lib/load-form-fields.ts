import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type {
  CheckboxFormField,
  DropdownFormField,
  FormField,
  FormFieldChoiceOption,
  FormFieldRect,
  ListboxFormField,
  RadioFormField,
  SignatureFormField,
  TextFormField,
} from '../types/form-field';

/**
 * Walks every page of the document and returns the list of native form field
 * widgets, normalized so the UI can render them without having to understand
 * pdf.js's annotation dictionary shape.
 *
 * Pushbuttons are skipped because they carry no fillable value.
 */
export async function loadFormFields(
  document: PDFDocumentProxy,
): Promise<ReadonlyArray<FormField>> {
  const pageNumbers: number[] = [];
  for (let i: number = 1; i <= document.numPages; i += 1) {
    pageNumbers.push(i);
  }
  const perPage: ReadonlyArray<ReadonlyArray<FormField>> = await Promise.all(
    pageNumbers.map((pageNumber) => readPageFormFields({ document, pageNumber })),
  );
  return perPage.flat();
}

interface ReadPageFormFieldsArgs {
  readonly document: PDFDocumentProxy;
  readonly pageNumber: number;
}

async function readPageFormFields({
  document,
  pageNumber,
}: ReadPageFormFieldsArgs): Promise<ReadonlyArray<FormField>> {
  const page: PDFPageProxy = await document.getPage(pageNumber);
  const intrinsicViewport = page.getViewport({ scale: 1, rotation: 0 });
  const intrinsicWidth: number = intrinsicViewport.width;
  const intrinsicHeight: number = intrinsicViewport.height;
  const rawAnnotations: ReadonlyArray<RawAnnotation> = (await page.getAnnotations({
    intent: 'display',
  })) as ReadonlyArray<RawAnnotation>;
  const fields: FormField[] = [];
  for (const raw of rawAnnotations) {
    if (raw.subtype !== 'Widget') continue;
    const field: FormField | null = buildField({
      raw,
      pageIndex: pageNumber - 1,
      intrinsicWidth,
      intrinsicHeight,
    });
    if (field) fields.push(field);
  }
  return fields;
}

interface BuildFieldArgs {
  readonly raw: RawAnnotation;
  readonly pageIndex: number;
  readonly intrinsicWidth: number;
  readonly intrinsicHeight: number;
}

function buildField({
  raw,
  pageIndex,
  intrinsicWidth,
  intrinsicHeight,
}: BuildFieldArgs): FormField | null {
  const name: string | null = readFieldName(raw);
  if (!name) return null;
  const rect: FormFieldRect | null = normalizeRect({
    rect: raw.rect,
    intrinsicWidth,
    intrinsicHeight,
  });
  if (!rect) return null;
  const id: string = buildWidgetId({ raw, pageIndex });
  const readOnly: boolean = Boolean(raw.readOnly);
  if (raw.fieldType === 'Tx') {
    const text: TextFormField = {
      id,
      name,
      pageIndex,
      rect,
      readOnly,
      kind: 'text',
      multiline: Boolean(raw.multiLine),
      password: Boolean(raw.password),
      maxLength:
        typeof raw.maxLen === 'number' && raw.maxLen > 0 ? raw.maxLen : null,
      defaultValue: readStringValue(raw.fieldValue) ?? '',
    };
    return text;
  }
  if (raw.fieldType === 'Btn') {
    if (raw.pushButton) return null;
    if (raw.radioButton) {
      const radio: RadioFormField | null = buildRadio({
        raw,
        id,
        name,
        pageIndex,
        rect,
        readOnly,
      });
      return radio;
    }
    if (raw.checkBox) {
      const checkbox: CheckboxFormField = buildCheckbox({
        raw,
        id,
        name,
        pageIndex,
        rect,
        readOnly,
      });
      return checkbox;
    }
    return null;
  }
  if (raw.fieldType === 'Ch') {
    if (raw.combo) {
      const dropdown: DropdownFormField = {
        id,
        name,
        pageIndex,
        rect,
        readOnly,
        kind: 'dropdown',
        options: normalizeOptions(raw.options),
        editable: Boolean(raw.edit),
        defaultValue: readStringValue(raw.fieldValue) ?? '',
      };
      return dropdown;
    }
    const listbox: ListboxFormField = {
      id,
      name,
      pageIndex,
      rect,
      readOnly,
      kind: 'listbox',
      options: normalizeOptions(raw.options),
      multiSelect: Boolean(raw.multiSelect),
      defaultValues: readStringArrayValue(raw.fieldValue),
    };
    return listbox;
  }
  if (raw.fieldType === 'Sig') {
    const signature: SignatureFormField = {
      id,
      name,
      pageIndex,
      rect,
      readOnly: true,
      kind: 'signature',
    };
    return signature;
  }
  return null;
}

interface BuildCheckboxArgs {
  readonly raw: RawAnnotation;
  readonly id: string;
  readonly name: string;
  readonly pageIndex: number;
  readonly rect: FormFieldRect;
  readonly readOnly: boolean;
}

function buildCheckbox({
  raw,
  id,
  name,
  pageIndex,
  rect,
  readOnly,
}: BuildCheckboxArgs): CheckboxFormField {
  const exportValue: string = readExportValue(raw) ?? 'Yes';
  const fieldValue: string | null = readStringValue(raw.fieldValue);
  const defaultChecked: boolean =
    fieldValue !== null && fieldValue !== 'Off' && fieldValue !== '';
  return {
    id,
    name,
    pageIndex,
    rect,
    readOnly,
    kind: 'checkbox',
    exportValue,
    defaultChecked,
  };
}

interface BuildRadioArgs {
  readonly raw: RawAnnotation;
  readonly id: string;
  readonly name: string;
  readonly pageIndex: number;
  readonly rect: FormFieldRect;
  readonly readOnly: boolean;
}

function buildRadio({
  raw,
  id,
  name,
  pageIndex,
  rect,
  readOnly,
}: BuildRadioArgs): RadioFormField | null {
  const exportValue: string | null = readExportValue(raw);
  if (!exportValue) return null;
  const fieldValue: string | null = readStringValue(raw.fieldValue);
  return {
    id,
    name,
    pageIndex,
    rect,
    readOnly,
    kind: 'radio',
    exportValue,
    defaultSelected: fieldValue === exportValue,
  };
}

interface NormalizeRectArgs {
  readonly rect: ReadonlyArray<number> | undefined;
  readonly intrinsicWidth: number;
  readonly intrinsicHeight: number;
}

function normalizeRect({
  rect,
  intrinsicWidth,
  intrinsicHeight,
}: NormalizeRectArgs): FormFieldRect | null {
  if (!rect || rect.length < 4) return null;
  const x1: number = Math.min(rect[0] as number, rect[2] as number);
  const x2: number = Math.max(rect[0] as number, rect[2] as number);
  const y1: number = Math.min(rect[1] as number, rect[3] as number);
  const y2: number = Math.max(rect[1] as number, rect[3] as number);
  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) return null;
  return {
    x: x1 / intrinsicWidth,
    y: (intrinsicHeight - y2) / intrinsicHeight,
    width: (x2 - x1) / intrinsicWidth,
    height: (y2 - y1) / intrinsicHeight,
  };
}

function normalizeOptions(
  options: ReadonlyArray<RawChoiceOption> | undefined,
): ReadonlyArray<FormFieldChoiceOption> {
  if (!options) return [];
  const result: FormFieldChoiceOption[] = [];
  for (const option of options) {
    const value: string =
      typeof option.exportValue === 'string'
        ? option.exportValue
        : typeof option.displayValue === 'string'
          ? option.displayValue
          : '';
    const label: string =
      typeof option.displayValue === 'string' ? option.displayValue : value;
    result.push({ value, label });
  }
  return result;
}

function readFieldName(raw: RawAnnotation): string | null {
  if (typeof raw.fieldName === 'string' && raw.fieldName.length > 0) {
    return raw.fieldName;
  }
  return null;
}

function readExportValue(raw: RawAnnotation): string | null {
  if (typeof raw.exportValue === 'string') return raw.exportValue;
  if (typeof raw.buttonValue === 'string') return raw.buttonValue;
  return null;
}

function readStringValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'Off';
  return null;
}

function readStringArrayValue(value: unknown): ReadonlyArray<string> {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  const single: string | null = readStringValue(value);
  return single ? [single] : [];
}

interface BuildWidgetIdArgs {
  readonly raw: RawAnnotation;
  readonly pageIndex: number;
}

function buildWidgetId({ raw, pageIndex }: BuildWidgetIdArgs): string {
  const ref: string =
    typeof raw.id === 'string' && raw.id.length > 0
      ? raw.id
      : `${raw.fieldName ?? 'field'}-${raw.rect?.join(',') ?? 'norect'}`;
  return `p${pageIndex}-${ref}`;
}

interface RawChoiceOption {
  readonly exportValue?: unknown;
  readonly displayValue?: unknown;
}

interface RawAnnotation {
  readonly id?: unknown;
  readonly subtype?: unknown;
  readonly fieldType?: unknown;
  readonly fieldName?: unknown;
  readonly rect?: ReadonlyArray<number>;
  readonly readOnly?: unknown;
  readonly multiLine?: unknown;
  readonly password?: unknown;
  readonly maxLen?: unknown;
  readonly fieldValue?: unknown;
  readonly defaultFieldValue?: unknown;
  readonly checkBox?: unknown;
  readonly radioButton?: unknown;
  readonly pushButton?: unknown;
  readonly combo?: unknown;
  readonly edit?: unknown;
  readonly multiSelect?: unknown;
  readonly exportValue?: unknown;
  readonly buttonValue?: unknown;
  readonly options?: ReadonlyArray<RawChoiceOption>;
}
