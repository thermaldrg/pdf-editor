import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Annotation } from '../types/annotation';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface AnnotationBoxProps {
  readonly annotation: Annotation;
  readonly isSelected: boolean;
  readonly pagePixelSize: PageSize;
  readonly onSelect: (id: string) => void;
  readonly onMove: (id: string, x: number, y: number) => void;
  readonly onResize: (id: string, width: number, height: number) => void;
  readonly onDelete: (id: string) => void;
  readonly onDoubleClick?: () => void;
  readonly resizable?: boolean;
  readonly uniformResize?: boolean;
  readonly interactiveChildren?: boolean;
  readonly selectionToolbar?: ReactNode;
  readonly children: ReactNode;
}

interface DragState {
  readonly mode: 'move' | 'resize';
  readonly startPointerX: number;
  readonly startPointerY: number;
  readonly startX: number;
  readonly startY: number;
  readonly startWidth: number;
  readonly startHeight: number;
}

const MIN_SIZE_FRACTION: number = 0.02;

export function AnnotationBox({
  annotation,
  isSelected,
  pagePixelSize,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onDoubleClick,
  resizable = true,
  uniformResize = false,
  interactiveChildren = false,
  selectionToolbar,
  children,
}: AnnotationBoxProps) {
  const dragStateRef = useRef<DragState | null>(null);

  const pixelLeft: number = annotation.x * pagePixelSize.width;
  const pixelTop: number = annotation.y * pagePixelSize.height;
  const pixelWidth: number = annotation.width * pagePixelSize.width;
  const pixelHeight: number = annotation.height * pagePixelSize.height;

  const beginDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      mode: 'move' | 'resize',
    ): void => {
      event.stopPropagation();
      event.preventDefault();
      onSelect(annotation.id);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragStateRef.current = {
        mode,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startX: annotation.x,
        startY: annotation.y,
        startWidth: annotation.width,
        startHeight: annotation.height,
      };
    },
    [annotation, onSelect],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      const state: DragState | null = dragStateRef.current;
      if (!state) return;
      const deltaXFraction: number =
        (event.clientX - state.startPointerX) / pagePixelSize.width;
      const deltaYFraction: number =
        (event.clientY - state.startPointerY) / pagePixelSize.height;
      if (state.mode === 'move') {
        const nextX: number = clamp(
          state.startX + deltaXFraction,
          0,
          1 - annotation.width,
        );
        const nextY: number = clamp(
          state.startY + deltaYFraction,
          0,
          1 - annotation.height,
        );
        onMove(annotation.id, nextX, nextY);
        return;
      }
      const { width: nextWidth, height: nextHeight } = computeResize({
        state,
        deltaXFraction,
        deltaYFraction,
        maxWidth: 1 - annotation.x,
        maxHeight: 1 - annotation.y,
        uniform: uniformResize,
      });
      onResize(annotation.id, nextWidth, nextHeight);
    },
    [
      annotation.id,
      annotation.width,
      annotation.height,
      annotation.x,
      annotation.y,
      onMove,
      onResize,
      pagePixelSize.height,
      pagePixelSize.width,
      uniformResize,
    ],
  );

  const handlePointerUp = useCallback((): void => {
    dragStateRef.current = null;
  }, []);

  const handleSelect = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      event.stopPropagation();
      onSelect(annotation.id);
    },
    [annotation.id, onSelect],
  );

  const ringClass: string = isSelected
    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white'
    : 'ring-1 ring-transparent hover:ring-indigo-200';

  return (
    <div
      className={`absolute rounded ${ringClass}`}
      style={{
        left: `${pixelLeft}px`,
        top: `${pixelTop}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
      onPointerDown={handleSelect}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`${interactiveChildren ? '' : 'pointer-events-none'} h-full w-full`}
      >
        {children}
      </div>
      {!interactiveChildren && (
        <div
          className="absolute inset-0"
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => beginDrag(e, 'move')}
          onDoubleClick={onDoubleClick}
        />
      )}
      {isSelected && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(annotation.id);
          }}
          className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
          aria-label="Delete annotation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.36a1 1 0 111.414 1.414L13.414 10.586l4.361 4.36a1 1 0 01-1.414 1.415L12 12l-4.361 4.36a1 1 0 01-1.414-1.414l4.36-4.36-4.36-4.361a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
      {isSelected && resizable && (
        <div
          onPointerDown={(e) => beginDrag(e, 'resize')}
          className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white bg-indigo-500 shadow"
        />
      )}
      {isSelected && selectionToolbar && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2">
          {selectionToolbar}
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

interface ResizeArgs {
  readonly state: DragState;
  readonly deltaXFraction: number;
  readonly deltaYFraction: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly uniform: boolean;
}

interface ResizeResult {
  readonly width: number;
  readonly height: number;
}

function computeResize({
  state,
  deltaXFraction,
  deltaYFraction,
  maxWidth,
  maxHeight,
  uniform,
}: ResizeArgs): ResizeResult {
  if (!uniform) {
    return {
      width: clamp(
        state.startWidth + deltaXFraction,
        MIN_SIZE_FRACTION,
        maxWidth,
      ),
      height: clamp(
        state.startHeight + deltaYFraction,
        MIN_SIZE_FRACTION,
        maxHeight,
      ),
    };
  }
  const widthScale: number =
    (state.startWidth + deltaXFraction) / state.startWidth;
  const heightScale: number =
    (state.startHeight + deltaYFraction) / state.startHeight;
  const requestedScale: number =
    Math.abs(widthScale - 1) >= Math.abs(heightScale - 1)
      ? widthScale
      : heightScale;
  const maxScale: number = Math.min(
    maxWidth / state.startWidth,
    maxHeight / state.startHeight,
  );
  const minScale: number = Math.max(
    MIN_SIZE_FRACTION / state.startWidth,
    MIN_SIZE_FRACTION / state.startHeight,
  );
  const scale: number = clamp(requestedScale, minScale, maxScale);
  return {
    width: state.startWidth * scale,
    height: state.startHeight * scale,
  };
}
