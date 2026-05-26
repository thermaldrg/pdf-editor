import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import { toUnsharedBytes } from './to-unshared-bytes';

interface LoadPdfLibDocumentArgs {
  readonly bytes: ArrayBuffer | Uint8Array;
}

const EMPTY_PASSWORD: string = '';

/**
 * Loads a PDF with `pdf-lib`. If the document carries an `/Encrypt` dictionary
 * (even one with an empty user password, e.g. permission-only protected
 * files) `pdf-lib` refuses to decrypt content streams, which would yield
 * blank pages after rewriting. In that case the bytes are first cleaned via
 * the mupdf-backed helper and the resulting unprotected bytes are reparsed.
 */
export async function loadPdfLibDocument({
  bytes,
}: LoadPdfLibDocumentArgs): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(toUnsharedBytes(bytes));
  } catch (err) {
    if (!(err instanceof EncryptedPDFError)) throw err;
    const { decryptPdfBytes } = await import('./decrypt-pdf');
    const decrypted: Uint8Array = await decryptPdfBytes({
      bytes: toUnsharedBytes(bytes),
      password: EMPTY_PASSWORD,
    });
    return PDFDocument.load(decrypted);
  }
}
