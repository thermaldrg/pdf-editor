import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AppHeader } from "./components/app-header";
import { EmptyState } from "./components/empty-state";
import { PdfViewer } from "./components/pdf-viewer";
import { PlacementBanner } from "./components/placement-banner";
import { Toolbar } from "./components/toolbar";

const SignaturePadModal = lazy(() =>
  import("./components/signature-pad-modal").then((mod) => ({
    default: mod.SignaturePadModal,
  })),
);
const MergePdfsModal = lazy(() =>
  import("./components/merge-pdfs-modal").then((mod) => ({
    default: mod.MergePdfsModal,
  })),
);
const CompressPdfModal = lazy(() =>
  import("./components/compress-pdf-modal").then((mod) => ({
    default: mod.CompressPdfModal,
  })),
);
const ProtectPdfModal = lazy(() =>
  import("./components/protect-pdf-modal").then((mod) => ({
    default: mod.ProtectPdfModal,
  })),
);
const PasswordPromptModal = lazy(() =>
  import("./components/password-prompt-modal").then((mod) => ({
    default: mod.PasswordPromptModal,
  })),
);
import type { ExportCompression } from "./components/export-menu";
import type { ToolbarTool } from "./components/toolbar";
import { useAnnotations } from "./hooks/use-annotations";
import { usePageOperations } from "./hooks/use-page-operations";
import { usePdfDocument } from "./hooks/use-pdf-document";
import { useSavedSignatures } from "./hooks/use-saved-signatures";
import { awaitDownloadResult } from "./lib/await-download-result";
import type { CompressPdfResult } from "./lib/compress-pdf";
import { createId } from "./lib/create-id";
import { downloadBlob } from "./lib/download-blob";
import { formatBytes } from "./lib/format-bytes";
import { formatDateDdMmYyyy } from "./lib/format-date";
import type { CompressMode } from "./types/compress-mode";
import type { CompressionLevel } from "./types/compression-level";
import type { MergeMode } from "./types/merge-mode";
import {
  DEFAULT_SHAPE_COLOR,
  DEFAULT_SHAPE_STROKE_WIDTH,
  getShapeDefinition,
} from "./lib/shape-geometry";
import type { Annotation, ShapeKind } from "./types/annotation";
import type { DownloadResult } from "./types/download-result";
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
  const {
    pdf,
    isLoading,
    error,
    passwordPrompt,
    openFile,
    submitPassword,
    cancelPasswordPrompt,
    closeFile,
  } = usePdfDocument();
  const {
    annotations,
    selectedId,
    selectAnnotation,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    removeAnnotationsForPage,
    rotateAnnotationsForPage,
    clearAnnotations,
  } = useAnnotations();
  const {
    operations: pageOperations,
    resetForPageCount,
    rotatePage,
    removePage,
    movePageUp,
    movePageDown,
  } = usePageOperations();
  const {
    signatures: savedSignatures,
    saveSignature,
    removeSignature,
  } = useSavedSignatures();
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] =
    useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportingCompression, setExportingCompression] =
    useState<ExportCompression | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergingMode, setMergingMode] = useState<MergeMode | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [isCompressModalOpen, setIsCompressModalOpen] =
    useState<boolean>(false);
  const [compressingMode, setCompressingMode] = useState<CompressMode | null>(
    null,
  );
  const [compressError, setCompressError] = useState<string | null>(null);
  const [isProtectModalOpen, setIsProtectModalOpen] = useState<boolean>(false);
  const [isProtecting, setIsProtecting] = useState<boolean>(false);
  const [protectError, setProtectError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const pendingTool: ToolbarTool | null = useMemo(
    () => resolvePendingTool(pendingPlacement),
    [pendingPlacement],
  );

  const hasPageEdits: boolean = useMemo(
    () => hasPageOperationChanges(pageOperations, pdf?.pageSizes.length ?? 0),
    [pageOperations, pdf],
  );

  const canExport: boolean = annotations.length > 0 || hasPageEdits;

  useEffect(() => {
    resetForPageCount(pdf?.pageSizes.length ?? 0);
  }, [pdf, resetForPageCount]);

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
      const operation = pageOperations.find(
        (op) => op.originalIndex === pageIndex,
      );
      const isRotatedQuarter: boolean =
        operation?.rotation === 90 || operation?.rotation === 270;
      const displayedWidth: number = isRotatedQuarter
        ? pageSize.height
        : pageSize.width;
      const displayedHeight: number = isRotatedQuarter
        ? pageSize.width
        : pageSize.height;
      const annotation: Annotation = buildAnnotation({
        placement,
        pageIndex,
        xFraction,
        yFraction,
        pageAspectRatio: displayedWidth / displayedHeight,
      });
      addAnnotation(annotation);
      setPendingPlacement(null);
    },
    [addAnnotation, pageOperations, pdf, pendingPlacement],
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Annotation>): void => {
      updateAnnotation(id, patch);
    },
    [updateAnnotation],
  );

  const handleRotatePage = useCallback(
    (displayIndex: number): void => {
      const event = rotatePage(displayIndex);
      if (!event) return;
      const delta = (event.nextRotation - event.previousRotation + 360) % 360;
      rotateAnnotationsForPage(event.originalIndex, delta as 0 | 90 | 180 | 270);
    },
    [rotatePage, rotateAnnotationsForPage],
  );

  const handleRemovePage = useCallback(
    (displayIndex: number): void => {
      const event = removePage(displayIndex);
      if (!event) return;
      removeAnnotationsForPage(event.originalIndex);
    },
    [removePage, removeAnnotationsForPage],
  );

  const handleExport = useCallback(
    async (compression: ExportCompression): Promise<void> => {
      if (!pdf) return;
      setIsExporting(true);
      setExportingCompression(compression);
      try {
        const { exportPdf } = await import("./lib/export-pdf");
        const exportedBytes: Uint8Array = await exportPdf({
          sourceBytes: pdf.sourceBytes,
          annotations,
          pageOperations,
        });
        if (compression === "none") {
          deliverExportDownload({
            bytes: exportedBytes,
            sourceName: pdf.fileName,
          });
          return;
        }
        const { compressPdfBytes } = await import("./lib/compress-pdf");
        const result: CompressPdfResult = await compressPdfBytes({
          bytes: exportedBytes,
          level: compression,
          sourceLabel: pdf.fileName,
        });
        deliverCompressedExportDownload({
          result,
          sourceName: pdf.fileName,
        });
      } finally {
        setIsExporting(false);
        setExportingCompression(null);
      }
    },
    [annotations, pageOperations, pdf],
  );

  const handleOpenProtect = useCallback((): void => {
    setProtectError(null);
    setIsProtectModalOpen(true);
  }, []);

  const handleCloseProtect = useCallback((): void => {
    if (isProtecting) return;
    setIsProtectModalOpen(false);
    setProtectError(null);
  }, [isProtecting]);

  const handleProtectConfirm = useCallback(
    async (
      password: string,
      compression: ExportCompression,
    ): Promise<void> => {
      if (!pdf) return;
      setIsProtecting(true);
      setProtectError(null);
      try {
        const { exportPdf } = await import("./lib/export-pdf");
        const exportedBytes: Uint8Array = await exportPdf({
          sourceBytes: pdf.sourceBytes,
          annotations,
          pageOperations,
        });
        const compressed: CompressedExport = await maybeCompressExport({
          bytes: exportedBytes,
          compression,
          sourceLabel: pdf.fileName,
        });
        const { protectPdfBytes } = await import("./lib/protect-pdf");
        const protectedBytes: Uint8Array = await protectPdfBytes({
          bytes: compressed.bytes,
          userPassword: password,
        });
        deliverProtectedExportDownload({
          bytes: protectedBytes,
          sourceName: pdf.fileName,
          isCompressed: compressed.isCompressed,
        });
        setIsProtectModalOpen(false);
      } catch (err) {
        setProtectError(
          err instanceof Error
            ? err.message
            : "Failed to protect PDF with password.",
        );
      } finally {
        setIsProtecting(false);
      }
    },
    [annotations, pageOperations, pdf],
  );

  const handleOpenMerge = useCallback((): void => {
    setMergeError(null);
    setIsMergeModalOpen(true);
  }, []);

  const handleCloseMerge = useCallback((): void => {
    if (mergingMode !== null) return;
    setIsMergeModalOpen(false);
    setMergeError(null);
  }, [mergingMode]);

  const handleMergeConfirm = useCallback(
    async (files: ReadonlyArray<File>, mode: MergeMode): Promise<void> => {
      setMergingMode(mode);
      setMergeError(null);
      try {
        const { mergePdfs } = await import("./lib/merge-pdfs");
        const bytes: Uint8Array = await mergePdfs({ files });
        const mergedName: string = buildMergedFileName(files);
        if (mode === "download") {
          deliverMergedDownload({ bytes, mergedName });
        } else {
          await openMergedForEditing({
            bytes,
            mergedName,
            openFile: handleOpenFile,
          });
        }
        setIsMergeModalOpen(false);
      } catch (err) {
        setMergeError(
          err instanceof Error ? err.message : "Failed to merge PDFs",
        );
      } finally {
        setMergingMode(null);
      }
    },
    [handleOpenFile],
  );

  const handleOpenCompress = useCallback((): void => {
    setCompressError(null);
    setIsCompressModalOpen(true);
  }, []);

  const handleCloseCompress = useCallback((): void => {
    if (compressingMode !== null) return;
    setIsCompressModalOpen(false);
    setCompressError(null);
  }, [compressingMode]);

  const handleCompressConfirm = useCallback(
    async (
      file: File,
      level: CompressionLevel,
      mode: CompressMode,
    ): Promise<void> => {
      setCompressingMode(mode);
      setCompressError(null);
      try {
        const { compressPdf } = await import("./lib/compress-pdf");
        const result: CompressPdfResult = await compressPdf({ file, level });
        const compressedName: string = buildCompressedFileName(file.name);
        if (mode === "download") {
          deliverCompressedDownload({
            bytes: result.bytes,
            compressedName,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
          });
        } else {
          await openCompressedForEditing({
            bytes: result.bytes,
            compressedName,
            openFile: handleOpenFile,
          });
        }
        setIsCompressModalOpen(false);
      } catch (err) {
        setCompressError(
          err instanceof Error ? err.message : "Failed to compress PDF",
        );
      } finally {
        setCompressingMode(null);
      }
    },
    [handleOpenFile],
  );

  const handleZoomIn = useCallback((): void => {
    setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);
  const handleZoomOut = useCallback((): void => {
    setZoom((z) => clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);
  const handleResetZoom = useCallback((): void => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  const handleToggleSidebar = useCallback((): void => {
    setIsSidebarOpen((open) => !open);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        fileName={pdf?.fileName ?? null}
        hasDocument={pdf !== null}
        canExport={canExport}
        isExporting={isExporting}
        exportingCompression={exportingCompression}
        onExport={handleExport}
        onOpenProtect={handleOpenProtect}
        onReplaceFile={handleReplaceFile}
        onOpenMerge={handleOpenMerge}
        onOpenCompress={handleOpenCompress}
      />
      {pdf && (
        <Toolbar
          pendingTool={pendingTool}
          zoom={zoom}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onActivateText={handleActivateText}
          onActivateDate={handleActivateDate}
          onActivateSignature={handleActivateSignature}
          onActivateShape={handleActivateShape}
          onCancelPlacement={handleCancelPlacement}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      )}
      <main className="flex flex-1 flex-col">
        {pdf ? (
          <PdfViewer
            pdf={pdf}
            pageOperations={pageOperations}
            zoom={zoom}
            annotations={annotations}
            selectedId={selectedId}
            pendingPlacement={pendingPlacement}
            isSidebarOpen={isSidebarOpen}
            onSelect={selectAnnotation}
            onPlaceAt={handlePlaceAt}
            onUpdate={handleUpdate}
            onDelete={removeAnnotation}
            onRotatePage={handleRotatePage}
            onRemovePage={handleRemovePage}
            onMovePageUp={movePageUp}
            onMovePageDown={movePageDown}
          />
        ) : (
          <EmptyState
            onOpenFile={handleOpenFile}
            onOpenMerge={handleOpenMerge}
            onOpenCompress={handleOpenCompress}
            errorMessage={error}
            isLoading={isLoading}
          />
        )}
      </main>
      {pendingTool && (
        <PlacementBanner tool={pendingTool} onCancel={handleCancelPlacement} />
      )}
      <Suspense fallback={null}>
        {isSignatureModalOpen && (
          <SignaturePadModal
            isOpen={isSignatureModalOpen}
            savedSignatures={savedSignatures}
            onClose={() => setIsSignatureModalOpen(false)}
            onConfirm={handleSignatureConfirm}
            onSaveSignature={saveSignature}
            onRemoveSavedSignature={removeSignature}
          />
        )}
        {isMergeModalOpen && (
          <MergePdfsModal
            isMerging={mergingMode !== null}
            mergingMode={mergingMode}
            errorMessage={mergeError}
            onClose={handleCloseMerge}
            onConfirm={(files, mode) => void handleMergeConfirm(files, mode)}
          />
        )}
        {isCompressModalOpen && (
          <CompressPdfModal
            isCompressing={compressingMode !== null}
            compressingMode={compressingMode}
            errorMessage={compressError}
            onClose={handleCloseCompress}
            onConfirm={(file, level, mode) =>
              void handleCompressConfirm(file, level, mode)
            }
          />
        )}
        {isProtectModalOpen && (
          <ProtectPdfModal
            isProtecting={isProtecting}
            errorMessage={protectError}
            onClose={handleCloseProtect}
            onConfirm={(password, compression) =>
              void handleProtectConfirm(password, compression)
            }
          />
        )}
        {passwordPrompt && (
          <PasswordPromptModal
            fileName={passwordPrompt.fileName}
            isIncorrect={passwordPrompt.isIncorrect}
            isSubmitting={passwordPrompt.isSubmitting}
            errorMessage={passwordPrompt.errorMessage}
            onSubmit={(password) => void submitPassword(password)}
            onCancel={cancelPasswordPrompt}
          />
        )}
      </Suspense>
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

function hasPageOperationChanges(
  operations: ReadonlyArray<{ readonly originalIndex: number; readonly rotation: number }>,
  sourcePageCount: number,
): boolean {
  if (operations.length !== sourcePageCount) return true;
  for (let i: number = 0; i < operations.length; i += 1) {
    const op = operations[i];
    if (!op) continue;
    if (op.originalIndex !== i) return true;
    if (op.rotation !== 0) return true;
  }
  return false;
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

function buildMergedFileName(files: ReadonlyArray<File>): string {
  const first: File | undefined = files[0];
  if (!first) return "merged.pdf";
  const baseName: string = first.name.replace(/\.pdf$/i, "");
  return `${baseName}-merged.pdf`;
}

interface DeliverExportDownloadArgs {
  readonly bytes: Uint8Array;
  readonly sourceName: string;
}

function deliverExportDownload({
  bytes,
  sourceName,
}: DeliverExportDownloadArgs): void {
  const exportedName: string = buildExportFileName(sourceName);
  const blob: Blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });
  const resultPromise: Promise<DownloadResult> = awaitDownloadResult({
    fallbackFileName: exportedName,
  });
  downloadBlob(blob, exportedName);
  void resultPromise.then(notifyDownloadResult);
}

interface DeliverCompressedExportDownloadArgs {
  readonly result: CompressPdfResult;
  readonly sourceName: string;
}

function deliverCompressedExportDownload({
  result,
  sourceName,
}: DeliverCompressedExportDownloadArgs): void {
  const exportedName: string = buildCompressedExportFileName(sourceName);
  const blob: Blob = new Blob([result.bytes as BlobPart], {
    type: "application/pdf",
  });
  const resultPromise: Promise<DownloadResult> = awaitDownloadResult({
    fallbackFileName: exportedName,
  });
  downloadBlob(blob, exportedName);
  void resultPromise.then((downloadResult) =>
    notifyCompressDownloadResult({
      result: downloadResult,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
    }),
  );
}

function buildCompressedExportFileName(sourceName: string): string {
  const baseName: string = sourceName.replace(/\.pdf$/i, "");
  return `${baseName}-edited-compressed.pdf`;
}

interface CompressedExport {
  readonly bytes: Uint8Array;
  readonly isCompressed: boolean;
}

interface MaybeCompressExportArgs {
  readonly bytes: Uint8Array;
  readonly compression: ExportCompression;
  readonly sourceLabel: string;
}

async function maybeCompressExport({
  bytes,
  compression,
  sourceLabel,
}: MaybeCompressExportArgs): Promise<CompressedExport> {
  if (compression === "none") {
    return { bytes, isCompressed: false };
  }
  const { compressPdfBytes } = await import("./lib/compress-pdf");
  const result: CompressPdfResult = await compressPdfBytes({
    bytes,
    level: compression,
    sourceLabel,
  });
  return { bytes: result.bytes, isCompressed: true };
}

interface DeliverProtectedExportDownloadArgs {
  readonly bytes: Uint8Array;
  readonly sourceName: string;
  readonly isCompressed: boolean;
}

function deliverProtectedExportDownload({
  bytes,
  sourceName,
  isCompressed,
}: DeliverProtectedExportDownloadArgs): void {
  const exportedName: string = buildProtectedExportFileName({
    sourceName,
    isCompressed,
  });
  const blob: Blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });
  const resultPromise: Promise<DownloadResult> = awaitDownloadResult({
    fallbackFileName: exportedName,
  });
  downloadBlob(blob, exportedName);
  void resultPromise.then(notifyDownloadResult);
}

interface BuildProtectedExportFileNameArgs {
  readonly sourceName: string;
  readonly isCompressed: boolean;
}

function buildProtectedExportFileName({
  sourceName,
  isCompressed,
}: BuildProtectedExportFileNameArgs): string {
  const baseName: string = sourceName.replace(/\.pdf$/i, "");
  const middle: string = isCompressed ? "-edited-compressed" : "-edited";
  return `${baseName}${middle}-protected.pdf`;
}

interface DeliverMergedDownloadArgs {
  readonly bytes: Uint8Array;
  readonly mergedName: string;
}

function deliverMergedDownload({
  bytes,
  mergedName,
}: DeliverMergedDownloadArgs): void {
  const blob: Blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });
  const resultPromise: Promise<DownloadResult> = awaitDownloadResult({
    fallbackFileName: mergedName,
  });
  downloadBlob(blob, mergedName);
  void resultPromise.then(notifyDownloadResult);
}

interface OpenMergedForEditingArgs {
  readonly bytes: Uint8Array;
  readonly mergedName: string;
  readonly openFile: (file: File) => Promise<void>;
}

async function openMergedForEditing({
  bytes,
  mergedName,
  openFile,
}: OpenMergedForEditingArgs): Promise<void> {
  const file: File = new File([bytes as BlobPart], mergedName, {
    type: "application/pdf",
  });
  await openFile(file);
}

function buildCompressedFileName(sourceName: string): string {
  const baseName: string = sourceName.replace(/\.pdf$/i, "");
  return `${baseName}-compressed.pdf`;
}

interface DeliverCompressedDownloadArgs {
  readonly bytes: Uint8Array;
  readonly compressedName: string;
  readonly originalSize: number;
  readonly compressedSize: number;
}

function deliverCompressedDownload({
  bytes,
  compressedName,
  originalSize,
  compressedSize,
}: DeliverCompressedDownloadArgs): void {
  const blob: Blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });
  const resultPromise: Promise<DownloadResult> = awaitDownloadResult({
    fallbackFileName: compressedName,
  });
  downloadBlob(blob, compressedName);
  void resultPromise.then((result) =>
    notifyCompressDownloadResult({ result, originalSize, compressedSize }),
  );
}

interface OpenCompressedForEditingArgs {
  readonly bytes: Uint8Array;
  readonly compressedName: string;
  readonly openFile: (file: File) => Promise<void>;
}

async function openCompressedForEditing({
  bytes,
  compressedName,
  openFile,
}: OpenCompressedForEditingArgs): Promise<void> {
  const file: File = new File([bytes as BlobPart], compressedName, {
    type: "application/pdf",
  });
  await openFile(file);
}

interface NotifyCompressDownloadResultArgs {
  readonly result: DownloadResult;
  readonly originalSize: number;
  readonly compressedSize: number;
}

function notifyCompressDownloadResult({
  result,
  originalSize,
  compressedSize,
}: NotifyCompressDownloadResultArgs): void {
  if (result.state !== "completed") {
    notifyDownloadResult(result);
    return;
  }
  const savedBytes: number = Math.max(0, originalSize - compressedSize);
  const ratio: number =
    originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
  toast.success("PDF compressed successfully", {
    description: `${formatBytes(originalSize)} -> ${formatBytes(
      compressedSize,
    )} (${ratio}% smaller)`,
  });
}

function notifyDownloadResult(result: DownloadResult): void {
  if (result.state === "completed") {
    toast.success("PDF downloaded successfully", {
      description: result.savedPath ?? result.fileName,
    });
    return;
  }
  if (result.state === "cancelled") {
    toast.info("Download cancelled");
    return;
  }
  toast.error("Download interrupted");
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
