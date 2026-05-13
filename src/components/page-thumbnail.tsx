import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PageRotation } from '../types/page-operation';
import type { PdfPageSize } from '../types/pdf';
import { renderPdfPage } from '../lib/render-pdf-page';
import type { RenderPdfPageHandle } from '../lib/render-pdf-page';
import { useInView } from '../hooks/use-in-view';

interface PageThumbnailProps {
  readonly document: PDFDocumentProxy;
  readonly originalPageIndex: number;
  readonly displayIndex: number;
  readonly pdfPointSize: PdfPageSize;
  readonly rotation: PageRotation;
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly isActive: boolean;
  readonly onSelect: (displayIndex: number) => void;
}

interface ThumbnailBox {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

const THUMBNAIL_ROOT_MARGIN: string = '200px 0px';

function PageThumbnailImpl({
  document,
  originalPageIndex,
  displayIndex,
  pdfPointSize,
  rotation,
  maxWidth,
  maxHeight,
  isActive,
  onSelect,
}: PageThumbnailProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const isInView: boolean = useInView({
    target: button,
    rootMargin: THUMBNAIL_ROOT_MARGIN,
  });
  const box: ThumbnailBox = useMemo(
    () => computeBox(pdfPointSize, rotation, maxWidth, maxHeight),
    [maxHeight, maxWidth, pdfPointSize, rotation],
  );
  const setButtonRef = useCallback((node: HTMLButtonElement | null): void => {
    buttonRef.current = node;
    setButton(node);
  }, []);
  useEffect((): (() => void) | void => {
    if (!isInView) return;
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    setIsRendered(false);
    const handle: RenderPdfPageHandle = renderPdfPage({
      document,
      pageIndex: originalPageIndex,
      canvas,
      scale: box.scale,
      userRotation: rotation,
    });
    let cancelled: boolean = false;
    handle.promise
      .then(() => {
        if (!cancelled) setIsRendered(true);
      })
      .catch(() => {
        if (!cancelled) setIsRendered(true);
      });
    return (): void => {
      cancelled = true;
      handle.cancel();
    };
  }, [box.scale, document, isInView, originalPageIndex, rotation]);
  const handleClick = useCallback((): void => {
    onSelect(displayIndex);
  }, [displayIndex, onSelect]);
  const ringClass: string = isActive
    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-100'
    : 'ring-1 ring-slate-200 hover:ring-slate-300';
  const labelClass: string = isActive ? 'text-indigo-600' : 'text-slate-500';
  return (
    <button
      ref={setButtonRef}
      type="button"
      onClick={handleClick}
      aria-label={`Go to page ${displayIndex + 1}`}
      aria-current={isActive ? 'page' : undefined}
      className="group flex flex-col items-center gap-1.5 focus:outline-none"
    >
      <div
        className={`relative overflow-hidden rounded-sm bg-white shadow-sm transition ${ringClass}`}
        style={{ width: `${box.width}px`, height: `${box.height}px` }}
      >
        <canvas ref={canvasRef} className="block" />
        {(!isInView || !isRendered) && <ThumbnailSkeleton />}
      </div>
      <span className={`text-[11px] font-medium tabular-nums ${labelClass}`}>
        {displayIndex + 1}
      </span>
    </button>
  );
}

function computeBox(
  pdfPointSize: PdfPageSize,
  rotation: PageRotation,
  maxWidth: number,
  maxHeight: number,
): ThumbnailBox {
  const isQuarterTurn: boolean = rotation === 90 || rotation === 270;
  const displayedWidth: number = isQuarterTurn
    ? pdfPointSize.height
    : pdfPointSize.width;
  const displayedHeight: number = isQuarterTurn
    ? pdfPointSize.width
    : pdfPointSize.height;
  const scale: number = Math.min(
    maxWidth / displayedWidth,
    maxHeight / displayedHeight,
  );
  return {
    width: Math.round(displayedWidth * scale),
    height: Math.round(displayedHeight * scale),
    scale,
  };
}

function ThumbnailSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
    </div>
  );
}

export const PageThumbnail = memo(PageThumbnailImpl);
