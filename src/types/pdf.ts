import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface PdfPageSize {
  readonly width: number;
  readonly height: number;
}

export interface LoadedPdf {
  readonly fileName: string;
  readonly sourceBytes: ArrayBuffer;
  readonly document: PDFDocumentProxy;
  readonly pageSizes: ReadonlyArray<PdfPageSize>;
}
