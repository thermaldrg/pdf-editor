import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import { toUnsharedBytes } from './to-unshared-bytes';

interface LoadPdfLibDocumentArgs {
  readonly bytes: ArrayBuffer | Uint8Array;
}

/**
 * Loads a PDF with `pdf-lib`. If the document carries an `/Encrypt`
 * dictionary `pdf-lib` refuses to decrypt content streams — even when the
 * user password is empty (e.g. permission-only protected files) — which
 * would yield blank pages after rewriting. In that case the bytes are first
 * cleaned via the mupdf-backed helper which extracts every page into a
 * fresh, unprotected PDF, and the resulting bytes are reparsed.
 */
export async function loadPdfLibDocument({
  bytes,
}: LoadPdfLibDocumentArgs): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(toUnsharedBytes(bytes));
  } catch (err) {
    if (!(err instanceof EncryptedPDFError)) throw err;
    const { stripPdfEncryption } = await import('./strip-pdf-encryption');
    const cleaned: Uint8Array = await stripPdfEncryption({ bytes });
    return PDFDocument.load(cleaned);
  }
}
