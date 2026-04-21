import { useEffect, useRef, useState } from 'react';
import type { SavedSignature } from '../hooks/use-saved-signatures';
import { Button } from './button';

interface SignatureResult {
  readonly dataUrl: string;
  readonly aspectRatio: number;
}

interface SaveSignatureInput {
  readonly dataUrl: string;
  readonly aspectRatio: number;
}

interface SignaturePadModalProps {
  readonly isOpen: boolean;
  readonly savedSignatures: ReadonlyArray<SavedSignature>;
  readonly onClose: () => void;
  readonly onConfirm: (result: SignatureResult) => void;
  readonly onSaveSignature: (input: SaveSignatureInput) => SavedSignature;
  readonly onRemoveSavedSignature: (id: string) => void;
}

const CANVAS_WIDTH: number = 640;
const CANVAS_HEIGHT: number = 220;
const STROKE_WIDTH: number = 2.5;
const STROKE_COLOR: string = '#0f172a';

export function SignaturePadModal({
  isOpen,
  savedSignatures,
  onClose,
  onConfirm,
  onSaveSignature,
  onRemoveSavedSignature,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState<boolean>(false);
  const [shouldSave, setShouldSave] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    clearCanvas(canvas);
    setHasInk(false);
    setShouldSave(true);
  }, [isOpen]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(canvas, event);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    if (!isDrawingRef.current) return;
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;
    const previous = lastPointRef.current;
    const current = getCanvasPoint(canvas, event);
    if (!previous) return;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    lastPointRef.current = current;
    if (!hasInk) setHasInk(true);
  };

  const handlePointerUp = (): void => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = (): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    clearCanvas(canvas);
    setHasInk(false);
  };

  const handleConfirm = (): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas || !hasInk) return;
    const cropped: HTMLCanvasElement = cropCanvasToInk(canvas);
    const dataUrl: string = cropped.toDataURL('image/png');
    const aspectRatio: number = cropped.width / cropped.height;
    if (shouldSave) {
      onSaveSignature({ dataUrl, aspectRatio });
    }
    onConfirm({ dataUrl, aspectRatio });
  };

  const handleUseSaved = (signature: SavedSignature): void => {
    onConfirm({
      dataUrl: signature.dataUrl,
      aspectRatio: signature.aspectRatio,
    });
  };

  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Draw your signature
          </h3>
          <p className="text-sm text-slate-500">
            Use your mouse, trackpad, or finger. You can resize it after placing.
          </p>
        </div>
        {savedSignatures.length > 0 && (
          <SavedSignatureGallery
            signatures={savedSignatures}
            onUse={handleUseSaved}
            onRemove={onRemoveSavedSignature}
          />
        )}
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="signature-cursor block w-full touch-none bg-white"
            style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={shouldSave}
            onChange={(e) => setShouldSave(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
          />
          Save this signature for next time
        </label>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!hasInk}
              onClick={handleConfirm}
            >
              Use signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SavedSignatureGalleryProps {
  readonly signatures: ReadonlyArray<SavedSignature>;
  readonly onUse: (signature: SavedSignature) => void;
  readonly onRemove: (id: string) => void;
}

function SavedSignatureGallery({
  signatures,
  onUse,
  onRemove,
}: SavedSignatureGalleryProps) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Saved signatures
        </span>
        <span className="text-xs text-slate-400">
          Click one to use, or draw a new one below
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {signatures.map((signature) => (
          <SavedSignatureThumb
            key={signature.id}
            signature={signature}
            onUse={onUse}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

interface SavedSignatureThumbProps {
  readonly signature: SavedSignature;
  readonly onUse: (signature: SavedSignature) => void;
  readonly onRemove: (id: string) => void;
}

function SavedSignatureThumb({
  signature,
  onUse,
  onRemove,
}: SavedSignatureThumbProps) {
  const handleRemove = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onRemove(signature.id);
  };
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={() => onUse(signature)}
        className="flex h-20 w-36 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
        aria-label="Use saved signature"
      >
        <img
          src={signature.dataUrl}
          alt="Saved signature"
          className="max-h-full max-w-full object-contain"
        />
      </button>
      <button
        type="button"
        onClick={handleRemove}
        className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white shadow hover:bg-rose-600 group-hover:flex"
        aria-label="Delete saved signature"
      >
        &times;
      </button>
    </div>
  );
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>,
): { x: number; y: number } {
  const rect: DOMRect = canvas.getBoundingClientRect();
  const scaleX: number = canvas.width / rect.width;
  const scaleY: number = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function cropCanvasToInk(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx: CanvasRenderingContext2D | null = source.getContext('2d');
  if (!ctx) return source;
  const imageData: ImageData = ctx.getImageData(
    0,
    0,
    source.width,
    source.height,
  );
  const bounds = findInkBounds(imageData);
  if (!bounds) return source;
  const padding: number = 8;
  const x: number = Math.max(0, bounds.minX - padding);
  const y: number = Math.max(0, bounds.minY - padding);
  const width: number = Math.min(source.width - x, bounds.maxX - x + padding);
  const height: number = Math.min(source.height - y, bounds.maxY - y + padding);
  const cropped: HTMLCanvasElement = document.createElement('canvas');
  cropped.width = width;
  cropped.height = height;
  const croppedCtx: CanvasRenderingContext2D | null = cropped.getContext('2d');
  if (!croppedCtx) return source;
  croppedCtx.drawImage(source, x, y, width, height, 0, 0, width, height);
  return cropped;
}

interface InkBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

function findInkBounds(imageData: ImageData): InkBounds | null {
  const { data, width, height } = imageData;
  let minX: number = width;
  let minY: number = height;
  let maxX: number = 0;
  let maxY: number = 0;
  let hasPixel: boolean = false;
  for (let y: number = 0; y < height; y += 1) {
    for (let x: number = 0; x < width; x += 1) {
      const alpha: number = data[(y * width + x) * 4 + 3];
      if (alpha === 0) continue;
      hasPixel = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!hasPixel) return null;
  return { minX, minY, maxX, maxY };
}
