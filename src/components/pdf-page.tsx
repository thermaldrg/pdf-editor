import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Annotation } from "../types/annotation";
import type { FormField } from "../types/form-field";
import type { FormFieldValues } from "../types/form-values";
import type {
  PendingPlacement,
  PendingPlacementKind,
} from "../types/placement";
import type { PageRotation } from "../types/page-operation";
import { renderPdfPage } from "../lib/render-pdf-page";
import type { RenderPdfPageHandle } from "../lib/render-pdf-page";
import { useInView } from "../hooks/use-in-view";
import { FormFieldOverlay } from "./form-field-overlay";
import { ImageAnnotationRenderer } from "./image-annotation-renderer";
import { PageToolbar } from "./page-toolbar";
import { ShapeAnnotationRenderer } from "./shape-annotation-renderer";
import { SignatureAnnotationRenderer } from "./signature-annotation-renderer";
import { TextAnnotationRenderer } from "./text-annotation-renderer";

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface PdfPageProps {
  readonly document: PDFDocumentProxy;
  readonly originalPageIndex: number;
  readonly displayIndex: number;
  readonly totalPages: number;
  readonly pdfPointSize: PageSize;
  readonly rotation: PageRotation;
  readonly zoom: number;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly formFields: ReadonlyArray<FormField>;
  readonly formValues: FormFieldValues;
  readonly selectedId: string | null;
  readonly pendingPlacement: PendingPlacement | null;
  readonly onSelect: (id: string | null) => void;
  readonly onPlaceAt: (
    originalPageIndex: number,
    xFraction: number,
    yFraction: number,
  ) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
  readonly onRotatePage: (displayIndex: number) => void;
  readonly onRemovePage: (displayIndex: number) => void;
  readonly onMovePageUp: (displayIndex: number) => void;
  readonly onMovePageDown: (displayIndex: number) => void;
  readonly onSetFormText: (fieldName: string, value: string) => void;
  readonly onSetFormCheckbox: (fieldName: string, value: boolean) => void;
  readonly onSetFormRadio: (
    fieldName: string,
    value: string | null,
  ) => void;
  readonly onSetFormDropdown: (fieldName: string, value: string) => void;
  readonly onSetFormListbox: (
    fieldName: string,
    values: ReadonlyArray<string>,
  ) => void;
}

function PdfPageImpl({
  document,
  originalPageIndex,
  displayIndex,
  totalPages,
  pdfPointSize,
  rotation,
  zoom,
  annotations,
  formFields,
  formValues,
  selectedId,
  pendingPlacement,
  onSelect,
  onPlaceAt,
  onUpdate,
  onDelete,
  onRotatePage,
  onRemovePage,
  onMovePageUp,
  onMovePageDown,
  onSetFormText,
  onSetFormCheckbox,
  onSetFormRadio,
  onSetFormDropdown,
  onSetFormListbox,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const isInView: boolean = useInView({ target: container });

  const displayedPointSize: PageSize = useMemo(
    () => computeDisplayedPointSize(pdfPointSize, rotation),
    [pdfPointSize, rotation],
  );

  const pixelSize: PageSize = useMemo(
    () => ({
      width: displayedPointSize.width * zoom,
      height: displayedPointSize.height * zoom,
    }),
    [displayedPointSize.height, displayedPointSize.width, zoom],
  );

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null): void => {
      containerRef.current = node;
      setContainer(node);
    },
    [],
  );

  useEffect((): (() => void) | void => {
    if (!isInView) return;
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    setIsRendered(false);
    const handle: RenderPdfPageHandle = renderPdfPage({
      document,
      pageIndex: originalPageIndex,
      canvas,
      scale: zoom,
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
  }, [document, isInView, originalPageIndex, rotation, zoom]);

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
      onPlaceAt(originalPageIndex, xFraction, yFraction);
    },
    [onPlaceAt, onSelect, originalPageIndex, pendingPlacement],
  );

  const handleRotate = useCallback((): void => {
    onRotatePage(displayIndex);
  }, [displayIndex, onRotatePage]);

  const handleRemove = useCallback((): void => {
    onRemovePage(displayIndex);
  }, [displayIndex, onRemovePage]);

  const handleMoveUp = useCallback((): void => {
    onMovePageUp(displayIndex);
  }, [displayIndex, onMovePageUp]);

  const handleMoveDown = useCallback((): void => {
    onMovePageDown(displayIndex);
  }, [displayIndex, onMovePageDown]);

  const cursorStyle: string = resolveCursorStyle(pagePlacementCursor);

  return (
    <div ref={setContainerRef} className="mx-auto flex flex-col items-center">
      <div className="mb-2 flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400">
          Page {displayIndex + 1}
        </span>
        <PageToolbar
          displayIndex={displayIndex}
          totalPages={totalPages}
          onRotate={handleRotate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDelete={handleRemove}
        />
      </div>
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-slate-200"
        style={{
          width: `${pixelSize.width}px`,
          height: `${pixelSize.height}px`,
        }}
      >
        <canvas ref={canvasRef} className="block" />
        {(!isInView || !isRendered) && <PageSkeleton />}
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
            if (annotation.kind === "image") {
              return (
                <ImageAnnotationRenderer
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
        {formFields.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden={pendingPlacement !== null}
          >
            <FormFieldOverlay
              fields={formFields}
              values={formValues}
              rotation={rotation}
              pagePixelSize={pixelSize}
              isDisabled={pendingPlacement !== null}
              onSetText={onSetFormText}
              onSetCheckbox={onSetFormCheckbox}
              onSetRadio={onSetFormRadio}
              onSetDropdown={onSetFormDropdown}
              onSetListbox={onSetFormListbox}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function computeDisplayedPointSize(
  pdfPointSize: PageSize,
  rotation: PageRotation,
): PageSize {
  if (rotation === 90 || rotation === 270) {
    return { width: pdfPointSize.height, height: pdfPointSize.width };
  }
  return pdfPointSize;
}

function resolveCursorStyle(kind: PendingPlacementKind | undefined): string {
  if (kind === "text") return "text";
  if (kind === "signature" || kind === "shape" || kind === "image") {
    return "crosshair";
  }
  return "default";
}

function PageSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
    </div>
  );
}

export const PdfPage = memo(PdfPageImpl);
