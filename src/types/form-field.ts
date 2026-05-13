/**
 * Native PDF form (AcroForm) field models.
 *
 * Each widget that exists on a page is represented as a discriminated union
 * variant. Coordinates are stored in *intrinsic* (un-user-rotated) page space,
 * normalized to [0, 1] with (0, 0) at the top-left of the page as drawn by
 * pdf.js. The user-applied rotation from page-operations is composed on top
 * of this at render time.
 */

export type FormFieldKind =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'listbox'
  | 'signature';

export interface FormFieldRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FormFieldChoiceOption {
  readonly value: string;
  readonly label: string;
}

interface BaseFormField {
  /** Stable identifier unique per widget; safe to use as a React key. */
  readonly id: string;
  /** PDF field name. Multiple radio widgets share this. */
  readonly name: string;
  readonly pageIndex: number;
  readonly rect: FormFieldRect;
  readonly readOnly: boolean;
}

export interface TextFormField extends BaseFormField {
  readonly kind: 'text';
  readonly multiline: boolean;
  readonly password: boolean;
  readonly maxLength: number | null;
  readonly defaultValue: string;
}

export interface CheckboxFormField extends BaseFormField {
  readonly kind: 'checkbox';
  /** PDF /AS export value indicating the "on" state (typically "Yes"). */
  readonly exportValue: string;
  readonly defaultChecked: boolean;
}

export interface RadioFormField extends BaseFormField {
  readonly kind: 'radio';
  /** This particular widget's selectable export value. */
  readonly exportValue: string;
  /** Whether this widget is the currently-selected one for its group. */
  readonly defaultSelected: boolean;
}

export interface DropdownFormField extends BaseFormField {
  readonly kind: 'dropdown';
  readonly options: ReadonlyArray<FormFieldChoiceOption>;
  readonly editable: boolean;
  readonly defaultValue: string;
}

export interface ListboxFormField extends BaseFormField {
  readonly kind: 'listbox';
  readonly options: ReadonlyArray<FormFieldChoiceOption>;
  readonly multiSelect: boolean;
  readonly defaultValues: ReadonlyArray<string>;
}

export interface SignatureFormField extends BaseFormField {
  readonly kind: 'signature';
}

export type FormField =
  | TextFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | ListboxFormField
  | SignatureFormField;
