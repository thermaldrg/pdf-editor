import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Annotation } from "../types/annotation";
import type {
  PendingPlacement,
  PendingPlacementKind,
} from "../types/placement";
import { renderPdfPage } from "../lib/render-pdf-page";
import { TextAnnotationRenderer } from "./text-annotation-renderer";
import { SignatureAnnotationRenderer } from "./signature-annotation-renderer";
import { ShapeAnnotationRenderer } from "./shape-annotation-renderer";

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface PdfPageProps {
  readonly document: PDFDocumentProxy;
  readonly pageIndex: number;
  readonly pdfPointSize: PageSize;
  readonly zoom: number;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly selectedId: string | null;
  readonly pendingPlacement: PendingPlacement | null;
  readonly onSelect: (id: string | null) => void;
  readonly onPlaceAt: (
    pageIndex: number,
    xFraction: number,
    yFraction: number,
  ) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

export function PdfPage({
  document,
  pageIndex,
  pdfPointSize,
  zoom,
  annotations,
  selectedId,
  pendingPlacement,
  onSelect,
  onPlaceAt,
  onUpdate,
  onDelete,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  const pixelSize: PageSize = useMemo(
    () => ({
      width: pdfPointSize.width * zoom,
      height: pdfPointSize.height * zoom,
    }),
    [pdfPointSize.height, pdfPointSize.width, zoom],
  );

  useLayoutEffect(() => {
    let cancelled: boolean = false;
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    setIsRendered(false);
    renderPdfPage({ document, pageIndex, canvas, scale: zoom })
      .then(() => {
        if (!cancelled) setIsRendered(true);
      })
      .catch(() => {
        if (!cancelled) setIsRendered(true);
      });
    return (): void => {
      cancelled = true;
    };
  }, [document, pageIndex, zoom]);

  useEffect((): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (selectedId === null) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const active: Element | null = window.document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        return;
      }
      onDelete(selectedId);
    };
    window.addEventListener("keydown", handleKeyDown);
    return (): void => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, selectedId]);

  const pagePlacementCursor: PendingPlacementKind | undefined =
    pendingPlacement?.kind;

  const handleBackgroundPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (event.target !== event.currentTarget) return;
      if (!pendingPlacement) {
        onSelect(null);
        return;
      }
      const rect: DOMRect = event.currentTarget.getBoundingClientRect();
      const xFraction: number = (event.clientX - rect.left) / rect.width;
      const yFraction: number = (event.clientY - rect.top) / rect.height;
      onPlaceAt(pageIndex, xFraction, yFraction);
    },
    [onPlaceAt, onSelect, pageIndex, pendingPlacement],
  );

  const cursorStyle: string = resolveCursorStyle(pagePlacementCursor);

  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="mb-2 text-xs font-medium text-slate-400">
        Page {pageIndex + 1}
      </div>
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-slate-200"
        style={{
          width: `${pixelSize.width}px`,
          height: `${pixelSize.height}px`,
        }}
      >
        <canvas ref={canvasRef} className="block" />
        {!isRendered && <PageSkeleton />}
        <div
          className="absolute inset-0"
          style={{ cursor: cursorStyle }}
          onPointerDown={handleBackgroundPointerDown}
        >
          {annotations.map((annotation) => {
            if (annotation.kind === "text") {
              return (
                <TextAnnotationRenderer
                  key={annotation.id}
                  annotation={annotation}
                  isSelected={selectedId === annotation.id}
                  pagePixelSize={pixelSize}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              );
            }
            if (annotation.kind === "signature") {
              return (
                <SignatureAnnotationRenderer
                  key={annotation.id}
                  annotation={annotation}
                  isSelected={selectedId === annotation.id}
                  pagePixelSize={pixelSize}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              );
            }
            return (
              <ShapeAnnotationRenderer
                key={annotation.id}
                annotation={annotation}
                isSelected={selectedId === annotation.id}
                pagePixelSize={pixelSize}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function resolveCursorStyle(kind: PendingPlacementKind | undefined): string {
  if (kind === "text") return "text";
  if (kind === "signature" || kind === "shape") return "crosshair";
  return "default";
}

function PageSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
    </div>
  );
}
