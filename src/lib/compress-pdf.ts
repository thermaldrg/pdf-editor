import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import type { PDFImage } from 'pdf-lib';
import type {
  CompressionLevel,
  CompressionLevelDefinition,
} from '../types/compression-level';
import { getCompressionLevelDefinition } from '../types/compression-level';
import { ensurePdfWorker } from './pdf-worker';

interface CompressPdfArgs {
  readonly file: File;
  readonly level: CompressionLevel;
}

interface CompressPdfBytesArgs {
  readonly bytes: ArrayBuffer | Uint8Array;
  readonly level: CompressionLevel;
  readonly sourceLabel?: string;
}

export interface CompressPdfResult {
  readonly bytes: Uint8Array;
  readonly originalSize: number;
  readonly compressedSize: number;
}

/**
 * Re-encodes every page of a PDF (provided as a File) as a single JPEG image
 * embedded in a fresh PDF. Convenience wrapper around `compressPdfBytes`.
 */
export async function compressPdf({
  file,
  level,
}: CompressPdfArgs): Promise<CompressPdfResult> {
  const sourceBytes: ArrayBuffer = await file.arrayBuffer();
  return compressPdfBytes({
    bytes: sourceBytes,
    level,
    sourceLabel: file.name,
  });
}

/**
 * Re-encodes every page of the supplied PDF bytes as a JPEG image embedded in
 * a fresh PDF. The approach trades vector fidelity for predictable, often
 * substantial size reduction. Used both for standalone "Compress PDF" flows
 * and for compressing exported edits before download.
 */
export async function compressPdfBytes({
  bytes,
  level,
  sourceLabel = 'PDF',
}: CompressPdfBytesArgs): Promise<CompressPdfResult> {
  ensurePdfWorker();
  const definition: CompressionLevelDefinition =
    getCompressionLevelDefinition(level);
  const sourceBuffer: ArrayBuffer = toArrayBuffer(bytes);
  const originalSize: number = sourceBuffer.byteLength;
  const document: PDFDocumentProxy = await loadPdfDocument(
    sourceBuffer,
    sourceLabel,
  );
  try {
    const output: PDFDocument = await PDFDocument.create();
    for (
      let pageNumber: number = 1;
      pageNumber <= document.numPages;
      pageNumber += 1
    ) {
      await renderAndAppendPage({
        document,
        pageNumber,
        output,
        definition,
      });
    }
    const compressed: Uint8Array = await output.save({ useObjectStreams: true });
    return {
      bytes: compressed,
      originalSize,
      compressedSize: compressed.byteLength,
    };
  } finally {
    await document.destroy();
  }
}

function toArrayBuffer(input: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof Uint8Array) {
    const copy: ArrayBuffer = new ArrayBuffer(input.byteLength);
    new Uint8Array(copy).set(input);
    return copy;
  }
  return input;
}

async function loadPdfDocument(
  sourceBytes: ArrayBuffer,
  sourceLabel: string,
): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data: sourceBytes.slice(0) }).promise;
  } catch {
    throw new Error(`Could not read "${sourceLabel}". Is it a valid PDF?`);
  }
}

interface RenderAndAppendPageArgs {
  readonly document: PDFDocumentProxy;
  readonly pageNumber: number;
  readonly output: PDFDocument;
  readonly definition: CompressionLevelDefinition;
}

async function renderAndAppendPage({
  document,
  pageNumber,
  output,
  definition,
}: RenderAndAppendPageArgs): Promise<void> {
  const page: PDFPageProxy = await document.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const renderViewport = page.getViewport({ scale: definition.renderScale });
  const canvas: HTMLCanvasElement = createCanvas(
    renderViewport.width,
    renderViewport.height,
  );
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to get 2D context for canvas');
  }
  await page.render({
    canvas,
    canvasContext: context,
    viewport: renderViewport,
  }).promise;
  const jpegBytes: Uint8Array = await canvasToJpeg(canvas, definition.jpegQuality);
  const image: PDFImage = await output.embedJpg(jpegBytes);
  const newPage = output.addPage([baseViewport.width, baseViewport.height]);
  newPage.drawImage(image, {
    x: 0,
    y: 0,
    width: baseViewport.width,
    height: baseViewport.height,
  });
  page.cleanup();
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  return canvas;
}

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Uint8Array> {
  const blob: Blob | null = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
  });
  if (!blob) {
    throw new Error('Failed to encode page as JPEG');
  }
  const buffer: ArrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
