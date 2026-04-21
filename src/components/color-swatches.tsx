import { useCallback } from 'react';
import type { ChangeEvent } from 'react';

export interface ColorSwatchOption {
  readonly value: string;
  readonly label: string;
}

interface ColorSwatchesProps {
  readonly selectedColor: string;
  readonly options: ReadonlyArray<ColorSwatchOption>;
  readonly onSelectColor: (color: string) => void;
  readonly allowCustom?: boolean;
}

export function ColorSwatches({
  selectedColor,
  options,
  onSelectColor,
  allowCustom = true,
}: ColorSwatchesProps) {
  const handleCustomChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      onSelectColor(event.target.value);
    },
    [onSelectColor],
  );
  const stopPropagation = useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      event.stopPropagation();
    },
    [],
  );
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg"
      onPointerDown={stopPropagation}
    >
      {options.map((option) => (
        <ColorSwatchButton
          key={option.value}
          option={option}
          isSelected={isSameColor(option.value, selectedColor)}
          onClick={() => onSelectColor(option.value)}
        />
      ))}
      {allowCustom && (
        <label
          aria-label="Custom color"
          className="relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)]"
        >
          <input
            type="color"
            value={selectedColor}
            onChange={handleCustomChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      )}
    </div>
  );
}

interface ColorSwatchButtonProps {
  readonly option: ColorSwatchOption;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

function ColorSwatchButton({
  option,
  isSelected,
  onClick,
}: ColorSwatchButtonProps) {
  const ringClass: string = isSelected
    ? 'ring-2 ring-offset-2 ring-indigo-500'
    : 'ring-1 ring-slate-200 hover:ring-slate-400';
  return (
    <button
      type="button"
      aria-label={option.label}
      title={option.label}
      onClick={onClick}
      className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${ringClass}`}
      style={{ backgroundColor: option.value }}
    />
  );
}

function isSameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
