import { PDF } from '@libpdf/core';
import { toUnsharedBytes } from './to-unshared-bytes';

interface StripPdfEncryptionArgs {
  readonly bytes: ArrayBuffer | Uint8Array;
}

const EMPTY_PASSWORD: string = '';

/**
 * Produces unencrypted PDF bytes for a document that does not require a user
 * password (typical "permission-only" files that block copy/print but open
 * without prompting). Every page is copied into a fresh PDF via mupdf's
 * `extractPages`, so the result is guaranteed to have no `/Encrypt`
 * dictionary regardless of the source document's permission flags, which
 * makes the file safe to hand to `pdf-lib` for rewriting.
 *
 * Throws when the document genuinely needs a password (i.e. empty
 * credentials fail to authenticate).
 */
export async function stripPdfEncryption({
  bytes,
}: StripPdfEncryptionArgs): Promise<Uint8Array> {
  const source: PDF = await PDF.load(toUnsharedBytes(bytes), {
    credentials: EMPTY_PASSWORD,
  });
  if (source.isEncrypted && !source.isAuthenticated) {
    throw new Error(
      'PDF is password protected and must be unlocked before it can be edited.',
    );
  }
  const pageCount: number = source.getPageCount();
  if (pageCount === 0) {
    throw new Error('PDF contains no pages.');
  }
  const fresh: PDF = await source.extractPages(buildIndexRange(pageCount));
  return fresh.save();
}

function buildIndexRange(count: number): number[] {
  const indices: number[] = [];
  for (let i: number = 0; i < count; i += 1) {
    indices.push(i);
  }
  return indices;
}
