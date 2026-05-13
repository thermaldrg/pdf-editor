import { memo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { FormFieldCheckbox } from './form-fields/form-field-checkbox';
import { FormFieldDropdown } from './form-fields/form-field-dropdown';
import { FormFieldListbox } from './form-fields/form-field-listbox';
import { FormFieldRadio } from './form-fields/form-field-radio';
import { FormFieldText } from './form-fields/form-field-text';
import { rotateBoundingBox } from '../lib/rotation-transforms';
import type { FormField, FormFieldRect } from '../types/form-field';
import type { FormFieldValue, FormFieldValues } from '../types/form-values';
import type { PageRotation } from '../types/page-operation';

interface PagePixelSize {
  readonly width: number;
  readonly height: number;
}

interface FormFieldOverlayProps {
  readonly fields: ReadonlyArray<FormField>;
  readonly values: FormFieldValues;
  readonly rotation: PageRotation;
  readonly pagePixelSize: PagePixelSize;
  readonly isDisabled?: boolean;
  readonly onSetText: (fieldName: string, value: string) => void;
  readonly onSetCheckbox: (fieldName: string, value: boolean) => void;
  readonly onSetRadio: (fieldName: string, value: string | null) => void;
  readonly onSetDropdown: (fieldName: string, value: string) => void;
  readonly onSetListbox: (
    fieldName: string,
    values: ReadonlyArray<string>,
  ) => void;
}

const MIN_FONT_PX: number = 9;
const MAX_FONT_PX: number = 16;
const FONT_HEIGHT_RATIO: number = 0.55;

function FormFieldOverlayImpl({
  fields,
  values,
  rotation,
  pagePixelSize,
  isDisabled = false,
  onSetText,
  onSetCheckbox,
  onSetRadio,
  onSetDropdown,
  onSetListbox,
}: FormFieldOverlayProps) {
  if (fields.length === 0) return null;
  return (
    <>
      {fields.map((field) => (
        <FormFieldSlot
          key={field.id}
          field={field}
          value={values.get(field.name)}
          rotation={rotation}
          pagePixelSize={pagePixelSize}
          isDisabled={isDisabled}
          onSetText={onSetText}
          onSetCheckbox={onSetCheckbox}
          onSetRadio={onSetRadio}
          onSetDropdown={onSetDropdown}
          onSetListbox={onSetListbox}
        />
      ))}
    </>
  );
}

interface FormFieldSlotProps {
  readonly field: FormField;
  readonly value: FormFieldValue | undefined;
  readonly rotation: PageRotation;
  readonly pagePixelSize: PagePixelSize;
  readonly isDisabled: boolean;
  readonly onSetText: (fieldName: string, value: string) => void;
  readonly onSetCheckbox: (fieldName: string, value: boolean) => void;
  readonly onSetRadio: (fieldName: string, value: string | null) => void;
  readonly onSetDropdown: (fieldName: string, value: string) => void;
  readonly onSetListbox: (
    fieldName: string,
    values: ReadonlyArray<string>,
  ) => void;
}

function FormFieldSlot({
  field,
  value,
  rotation,
  pagePixelSize,
  isDisabled,
  onSetText,
  onSetCheckbox,
  onSetRadio,
  onSetDropdown,
  onSetListbox,
}: FormFieldSlotProps) {
  const displayedRect: FormFieldRect = rotateBoundingBox(field.rect, rotation);
  const style: CSSProperties = {
    position: 'absolute',
    left: `${displayedRect.x * 100}%`,
    top: `${displayedRect.y * 100}%`,
    width: `${displayedRect.width * 100}%`,
    height: `${displayedRect.height * 100}%`,
    pointerEvents: isDisabled ? 'none' : 'auto',
  };
  const handleChildPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      event.stopPropagation();
    },
    [],
  );
  return (
    <div
      style={style}
      onPointerDown={handleChildPointer}
      onPointerUp={handleChildPointer}
    >
      <FormFieldControl
        field={field}
        value={value}
        pagePixelSize={pagePixelSize}
        displayedRect={displayedRect}
        onSetText={onSetText}
        onSetCheckbox={onSetCheckbox}
        onSetRadio={onSetRadio}
        onSetDropdown={onSetDropdown}
        onSetListbox={onSetListbox}
      />
    </div>
  );
}

interface FormFieldControlProps {
  readonly field: FormField;
  readonly value: FormFieldValue | undefined;
  readonly pagePixelSize: PagePixelSize;
  readonly displayedRect: FormFieldRect;
  readonly onSetText: (fieldName: string, value: string) => void;
  readonly onSetCheckbox: (fieldName: string, value: boolean) => void;
  readonly onSetRadio: (fieldName: string, value: string | null) => void;
  readonly onSetDropdown: (fieldName: string, value: string) => void;
  readonly onSetListbox: (
    fieldName: string,
    values: ReadonlyArray<string>,
  ) => void;
}

function FormFieldControl({
  field,
  value,
  pagePixelSize,
  displayedRect,
  onSetText,
  onSetCheckbox,
  onSetRadio,
  onSetDropdown,
  onSetListbox,
}: FormFieldControlProps) {
  const fontSizePx: number = pickFontSizePx({ displayedRect, pagePixelSize });
  if (field.kind === 'text') {
    return (
      <FormFieldText
        field={field}
        value={readTextValue(value)}
        fontSizePx={fontSizePx}
        onChange={(next) => onSetText(field.name, next)}
      />
    );
  }
  if (field.kind === 'checkbox') {
    return (
      <FormFieldCheckbox
        field={field}
        checked={readCheckboxValue(value)}
        onChange={(next) => onSetCheckbox(field.name, next)}
      />
    );
  }
  if (field.kind === 'radio') {
    return (
      <FormFieldRadio
        field={field}
        selectedValue={readRadioValue(value)}
        onChange={(next) => onSetRadio(field.name, next)}
      />
    );
  }
  if (field.kind === 'dropdown') {
    return (
      <FormFieldDropdown
        field={field}
        value={readDropdownValue(value)}
        fontSizePx={fontSizePx}
        onChange={(next) => onSetDropdown(field.name, next)}
      />
    );
  }
  if (field.kind === 'listbox') {
    return (
      <FormFieldListbox
        field={field}
        selectedValues={readListboxValue(value)}
        fontSizePx={fontSizePx}
        onChange={(next) => onSetListbox(field.name, next)}
      />
    );
  }
  return <SignatureFieldPlaceholder />;
}

function SignatureFieldPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50/60 text-[10px] uppercase tracking-wide text-slate-400">
      Signature
    </div>
  );
}

interface PickFontSizeArgs {
  readonly displayedRect: FormFieldRect;
  readonly pagePixelSize: PagePixelSize;
}

function pickFontSizePx({
  displayedRect,
  pagePixelSize,
}: PickFontSizeArgs): number {
  const heightPx: number = displayedRect.height * pagePixelSize.height;
  const raw: number = heightPx * FONT_HEIGHT_RATIO;
  if (raw < MIN_FONT_PX) return MIN_FONT_PX;
  if (raw > MAX_FONT_PX) return MAX_FONT_PX;
  return raw;
}

function readTextValue(value: FormFieldValue | undefined): string {
  if (value && value.kind === 'text') return value.value;
  return '';
}

function readCheckboxValue(value: FormFieldValue | undefined): boolean {
  if (value && value.kind === 'checkbox') return value.value;
  return false;
}

function readRadioValue(value: FormFieldValue | undefined): string | null {
  if (value && value.kind === 'radio') return value.value;
  return null;
}

function readDropdownValue(value: FormFieldValue | undefined): string {
  if (value && value.kind === 'dropdown') return value.value;
  return '';
}

function readListboxValue(
  value: FormFieldValue | undefined,
): ReadonlyArray<string> {
  if (value && value.kind === 'listbox') return value.value;
  return [];
}

export const FormFieldOverlay = memo(FormFieldOverlayImpl);
