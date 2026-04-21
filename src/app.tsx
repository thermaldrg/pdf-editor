import { useCallback, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/app-header";
import { EmptyState } from "./components/empty-state";
import { PdfViewer } from "./components/pdf-viewer";
import { PlacementBanner } from "./components/placement-banner";
import { SignaturePadModal } from "./components/signature-pad-modal";
import { Toolbar } from "./components/toolbar";
import type { ToolbarTool } from "./components/toolbar";
import { useAnnotations } from "./hooks/use-annotations";
import { usePdfDocument } from "./hooks/use-pdf-document";
import { useSavedSignatures } from "./hooks/use-saved-signatures";
import { createId } from "./lib/create-id";
import { downloadBlob } from "./lib/download-blob";
import { exportPdf } from "./lib/export-pdf";
import { formatDateDdMmYyyy } from "./lib/format-date";
import {
  DEFAULT_SHAPE_COLOR,
  DEFAULT_SHAPE_STROKE_WIDTH,
  getShapeDefinition,
} from "./lib/shape-geometry";
import type { Annotation, ShapeKind } from "./types/annotation";
import type {
  PendingPlacement,
  PendingShapePlacement,
  PendingSignaturePlacement,
  PendingTextPlacement,
} from "./types/placement";

const MIN_ZOOM: number = 0.5;
const MAX_ZOOM: number = 2.5;
const ZOOM_STEP: number = 0.1;
const DEFAULT_ZOOM: number = 1.25;

const DEFAULT_TEXT_WIDTH: number = 0.3;
const DEFAULT_TEXT_HEIGHT: number = 0.04;
const DEFAULT_TEXT_FONT_SIZE: number = 0.022;
const DEFAULT_TEXT_COLOR: string = "#0f172a";

const DEFAULT_DATE_WIDTH: number = 0.16;

const DEFAULT_SIGNATURE_WIDTH: number = 0.25;

export function App() {
  const { pdf, isLoading, error, openFile, closeFile } = usePdfDocument();
  const {
    annotations,
    selectedId,
    selectAnnotation,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
  } = useAnnotations();
  const {
    signatures: savedSignatures,
    saveSignature,
    removeSignature,
  } = useSavedSignatures();
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] =
    useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const pendingTool: ToolbarTool | null = useMemo(
    () => resolvePendingTool(pendingPlacement),
    [pendingPlacement],
  );

  const handleOpenFile = useCallback(
    async (file: File): Promise<void> => {
      clearAnnotations();
      setPendingPlacement(null);
      await openFile(file);
    },
    [clearAnnotations, openFile],
  );

  const handleReplaceFile = useCallback((): void => {
    replaceInputRef.current?.click();
  }, []);

  const handleReplaceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file: File | undefined = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      void handleOpenFile(file);
    },
    [handleOpenFile],
  );

  const handleActivateText = useCallback((): void => {
    setPendingPlacement({ kind: "text" });
  }, []);

  const handleActivateDate = useCallback((): void => {
    const placement: PendingTextPlacement = {
      kind: "text",
      initialText: formatDateDdMmYyyy(new Date()),
    };
    setPendingPlacement(placement);
  }, []);

  const handleActivateSignature = useCallback((): void => {
    setIsSignatureModalOpen(true);
  }, []);

  const handleActivateShape = useCallback((shape: ShapeKind): void => {
    const placement: PendingShapePlacement = { kind: "shape", shape };
    setPendingPlacement(placement);
  }, []);

  const handleCancelPlacement = useCallback((): void => {
    setPendingPlacement(null);
  }, []);

  const handleSignatureConfirm = useCallback(
    (result: { dataUrl: string; aspectRatio: number }): void => {
      setIsSignatureModalOpen(false);
      const placement: PendingSignaturePlacement = {
        kind: "signature",
        dataUrl: result.dataUrl,
        aspectRatio: result.aspectRatio,
      };
      setPendingPlacement(placement);
    },
    [],
  );

  const handlePlaceAt = useCallback(
    (pageIndex: number, xFraction: number, yFraction: number): void => {
      const placement: PendingPlacement | null = pendingPlacement;
      if (!placement || !pdf) return;
      const pageSize = pdf.pageSizes[pageIndex];
      if (!pageSize) return;
      const annotation: Annotation = buildAnnotation({
        placement,
        pageIndex,
        xFraction,
        yFraction,
        pageAspectRatio: pageSize.width / pageSize.height,
      });
      addAnnotation(annotation);
      setPendingPlacement(null);
    },
    [addAnnotation, pdf, pendingPlacement],
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Annotation>): void => {
      updateAnnotation(id, patch);
    },
    [updateAnnotation],
  );

  const handleExport = useCallback(async (): Promise<void> => {
    if (!pdf) return;
    setIsExporting(true);
    try {
      const bytes: Uint8Array = await exportPdf({
        sourceBytes: pdf.sourceBytes,
        annotations,
      });
      const blob: Blob = new Blob([bytes as BlobPart], {
        type: "application/pdf",
      });
      const exportedName: string = buildExportFileName(pdf.fileName);
      downloadBlob(blob, exportedName);
    } finally {
      setIsExporting(false);
    }
  }, [annotations, pdf]);

  const handleZoomIn = useCallback((): void => {
    setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);
  const handleZoomOut = useCallback((): void => {
    setZoom((z) => clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);
  const handleResetZoom = useCallback((): void => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader fileName={pdf?.fileName ?? null} actions={null} />
      {pdf && (
        <Toolbar
          pendingTool={pendingTool}
          canExport={annotations.length > 0}
          isExporting={isExporting}
          zoom={zoom}
          onActivateText={handleActivateText}
          onActivateDate={handleActivateDate}
          onActivateSignature={handleActivateSignature}
          onActivateShape={handleActivateShape}
          onCancelPlacement={handleCancelPlacement}
          onExport={handleExport}
          onReplaceFile={handleReplaceFile}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      )}
      <main className="flex flex-1 flex-col">
        {pdf ? (
          <PdfViewer
            pdf={pdf}
            zoom={zoom}
            annotations={annotations}
            selectedId={selectedId}
            pendingPlacement={pendingPlacement}
            onSelect={selectAnnotation}
            onPlaceAt={handlePlaceAt}
            onUpdate={handleUpdate}
            onDelete={removeAnnotation}
          />
        ) : (
          <EmptyState
            onOpenFile={handleOpenFile}
            errorMessage={error}
            isLoading={isLoading}
          />
        )}
      </main>
      {pendingTool && (
        <PlacementBanner tool={pendingTool} onCancel={handleCancelPlacement} />
      )}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        savedSignatures={savedSignatures}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        onSaveSignature={saveSignature}
        onRemoveSavedSignature={removeSignature}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleReplaceChange}
      />
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        {pdf
          ? ` ${annotations.length} annotation${annotations.length === 1 ? "" : "s"} placed.`
          : " nothing is uploaded."}
        {pdf && (
          <button
            type="button"
            onClick={closeFile}
            className="ml-2 text-indigo-600 hover:underline"
          >
            Close document
          </button>
        )}
      </footer>
    </div>
  );
}

interface BuildAnnotationArgs {
  readonly placement: PendingPlacement;
  readonly pageIndex: number;
  readonly xFraction: number;
  readonly yFraction: number;
  readonly pageAspectRatio: number;
}

function buildAnnotation({
  placement,
  pageIndex,
  xFraction,
  yFraction,
  pageAspectRatio,
}: BuildAnnotationArgs): Annotation {
  if (placement.kind === "text") {
    const initialText: string = placement.initialText ?? "";
    const width: number =
      initialText.length > 0 ? DEFAULT_DATE_WIDTH : DEFAULT_TEXT_WIDTH;
    return {
      id: createId(),
      kind: "text",
      pageIndex,
      x: clamp(xFraction, 0, 1 - width),
      y: clamp(yFraction, 0, 1 - DEFAULT_TEXT_HEIGHT),
      width,
      height: DEFAULT_TEXT_HEIGHT,
      text: initialText,
      fontSize: DEFAULT_TEXT_FONT_SIZE,
      color: DEFAULT_TEXT_COLOR,
    };
  }
  if (placement.kind === "signature") {
    const widthFraction: number = DEFAULT_SIGNATURE_WIDTH;
    const heightFraction: number =
      (widthFraction * pageAspectRatio) / placement.aspectRatio;
    return {
      id: createId(),
      kind: "signature",
      pageIndex,
      x: clamp(xFraction - widthFraction / 2, 0, 1 - widthFraction),
      y: clamp(yFraction - heightFraction / 2, 0, 1 - heightFraction),
      width: widthFraction,
      height: heightFraction,
      dataUrl: placement.dataUrl,
    };
  }
  const definition = getShapeDefinition(placement.shape);
  const widthFraction: number = definition.defaultWidth;
  const heightFraction: number =
    (widthFraction * pageAspectRatio) / definition.visualAspectRatio;
  return {
    id: createId(),
    kind: "shape",
    shape: placement.shape,
    pageIndex,
    x: clamp(xFraction - widthFraction / 2, 0, 1 - widthFraction),
    y: clamp(yFraction - heightFraction / 2, 0, 1 - heightFraction),
    width: widthFraction,
    height: heightFraction,
    color: DEFAULT_SHAPE_COLOR,
    strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
  };
}

function resolvePendingTool(
  placement: PendingPlacement | null,
): ToolbarTool | null {
  if (!placement) return null;
  if (placement.kind === "signature") return "signature";
  if (placement.kind === "shape") return placement.shape;
  return placement.initialText !== undefined ? "date" : "text";
}

function buildExportFileName(sourceName: string): string {
  const withoutExt: string = sourceName.replace(/\.pdf$/i, "");
  return `${withoutExt}-edited.pdf`;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
