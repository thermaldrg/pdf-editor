import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { ensurePdfWorker } from './pdf-worker';
import type { LoadedPdf, PdfPageSize } from '../types/pdf';

interface LoadPdfArgs {
  readonly file: File;
}

export async function loadPdf({ file }: LoadPdfArgs): Promise<LoadedPdf> {
  ensurePdfWorker();
  const sourceBytes: ArrayBuffer = await file.arrayBuffer();
  const document: PDFDocumentProxy = await getDocument({
    data: sourceBytes.slice(0),
  }).promise;
  const pageSizes: PdfPageSize[] = await collectPageSizes(document);
  return {
    fileName: file.name,
    sourceBytes,
    document,
    pageSizes,
  };
}

async function collectPageSizes(
  document: PDFDocumentProxy,
): Promise<PdfPageSize[]> {
  const sizes: PdfPageSize[] = [];
  for (let i: number = 1; i <= document.numPages; i += 1) {
    const page: PDFPageProxy = await document.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    sizes.push({ width: viewport.width, height: viewport.height });
  }
  return sizes;
}
