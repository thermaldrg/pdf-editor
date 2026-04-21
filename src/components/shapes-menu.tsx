import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShapeKind } from '../types/annotation';
import {
  DEFAULT_SHAPE_COLOR,
  getShapeDefinition,
} from '../lib/shape-geometry';

interface ShapesMenuProps {
  readonly activeShape: ShapeKind | null;
  readonly onSelectShape: (shape: ShapeKind) => void;
  readonly onCancelPlacement: () => void;
}

const SHAPE_OPTIONS: ReadonlyArray<{
  readonly kind: ShapeKind;
  readonly label: string;
}> = [
  { kind: 'cross', label: 'Cross' },
  { kind: 'tick', label: 'Tick' },
  { kind: 'dash', label: 'Dash' },
];

export function ShapesMenu({
  activeShape,
  onSelectShape,
  onCancelPlacement,
}: ShapesMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect((): (() => void) | undefined => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent): void => {
      const container: HTMLDivElement | null = containerRef.current;
      if (!container) return;
      if (container.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return (): void => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);
  const handleTriggerClick = useCallback((): void => {
    if (activeShape) {
      onCancelPlacement();
      return;
    }
    setIsOpen((current) => !current);
  }, [activeShape, onCancelPlacement]);
  const handleSelect = useCallback(
    (shape: ShapeKind): void => {
      setIsOpen(false);
      onSelectShape(shape);
    },
    [onSelectShape],
  );
  const isActive: boolean = activeShape !== null;
  const triggerVariantClasses: string = isActive
    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm';
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${triggerVariantClasses}`}
      >
        <IconShapes />
        {isActive ? 'Click to place' : 'Add shape'}
        {!isActive && <IconChevronDown />}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 flex min-w-[10rem] flex-col rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {SHAPE_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              onClick={() => handleSelect(option.kind)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              <ShapePreview kind={option.kind} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ShapePreviewProps {
  readonly kind: ShapeKind;
}

function ShapePreview({ kind }: ShapePreviewProps) {
  const { segments } = getShapeDefinition(kind);
  const sizePx: number = 18;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizePx}
      height={sizePx}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="flex-shrink-0"
    >
      <g
        stroke={DEFAULT_SHAPE_COLOR}
        strokeWidth={0.12}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {segments.map((segment, index) => (
          <line
            key={index}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
          />
        ))}
      </g>
    </svg>
  );
}

function IconShapes() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 4.5l6 6m0-6l-6 6M14 15.5l2 2.5 3.5-5M4 17h7"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}
