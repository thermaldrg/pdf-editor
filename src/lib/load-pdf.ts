import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { ensurePdfWorker } from './pdf-worker';
import type { LoadedPdf, PdfPageSize } from '../types/pdf';

interface LoadPdfArgs {
  readonly file: File;
}

/**
 * Thrown when pdfjs-dist refuses to open the document because it is encrypted
 * and no (or an incorrect) password was provided.
 */
export class PdfPasswordRequiredError extends Error {
  readonly isIncorrect: boolean;

  constructor({ isIncorrect }: { readonly isIncorrect: boolean }) {
    super(
      isIncorrect
        ? 'Incorrect password for this PDF.'
        : 'This PDF is password protected.',
    );
    this.name = 'PdfPasswordRequiredError';
    this.isIncorrect = isIncorrect;
  }
}

export async function loadPdf({ file }: LoadPdfArgs): Promise<LoadedPdf> {
  ensurePdfWorker();
  const sourceBytes: ArrayBuffer = await file.arrayBuffer();
  const document: PDFDocumentProxy = await openWithPdfJs(sourceBytes);
  const pageSizes: PdfPageSize[] = await collectPageSizes(document);
  return {
    fileName: file.name,
    sourceBytes,
    document,
    pageSizes,
  };
}

async function openWithPdfJs(
  sourceBytes: ArrayBuffer,
): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data: sourceBytes.slice(0) }).promise;
  } catch (err) {
    if (isPasswordException(err)) {
      throw new PdfPasswordRequiredError({
        isIncorrect: getPasswordExceptionCode(err) === INCORRECT_PASSWORD_CODE,
      });
    }
    throw err;
  }
}

const NEED_PASSWORD_CODE: number = 1;
const INCORRECT_PASSWORD_CODE: number = 2;

function isPasswordException(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as { name?: unknown; code?: unknown };
  if (candidate.name === 'PasswordException') return true;
  return (
    candidate.code === NEED_PASSWORD_CODE ||
    candidate.code === INCORRECT_PASSWORD_CODE
  );
}

function getPasswordExceptionCode(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null;
  const candidate = err as { code?: unknown };
  return typeof candidate.code === 'number' ? candidate.code : null;
}

async function collectPageSizes(
  document: PDFDocumentProxy,
): Promise<PdfPageSize[]> {
  const pageNumbers: number[] = [];
  for (let i: number = 1; i <= document.numPages; i += 1) {
    pageNumbers.push(i);
  }
  return Promise.all(pageNumbers.map((i) => measurePage(document, i)));
}

async function measurePage(
  document: PDFDocumentProxy,
  pageNumber: number,
): Promise<PdfPageSize> {
  const page: PDFPageProxy = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  return { width: viewport.width, height: viewport.height };
}
