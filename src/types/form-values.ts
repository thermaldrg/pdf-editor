/**
 * Mutable user-supplied values for native PDF form fields.
 *
 * Values are keyed by the PDF field name (not the per-widget id) so that radio
 * groups and identically-named widgets stay consistent. Pushbuttons and
 * signature fields are not represented because they have no fillable value.
 */

export type FormFieldValue =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'checkbox'; readonly value: boolean }
  | { readonly kind: 'radio'; readonly value: string | null }
  | { readonly kind: 'dropdown'; readonly value: string }
  | { readonly kind: 'listbox'; readonly value: ReadonlyArray<string> };

export type FormFieldValues = ReadonlyMap<string, FormFieldValue>;
