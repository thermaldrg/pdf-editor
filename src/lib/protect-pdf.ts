import { PDF } from '@libpdf/core';

interface ProtectPdfBytesArgs {
  readonly bytes: Uint8Array;
  readonly userPassword: string;
}

/**
 * Adds AES-256 password protection to a PDF.
 *
 * Re-saves the document through `@libpdf/core` with `setProtection()` so that
 * the user password is required to open it. The same value is used as the
 * owner password to keep the API intentionally simple: callers only need to
 * provide a single password.
 */
export async function protectPdfBytes({
  bytes,
  userPassword,
}: ProtectPdfBytesArgs): Promise<Uint8Array> {
  if (userPassword.length === 0) {
    throw new Error('Password must not be empty.');
  }
  const document: PDF = await PDF.load(toUnsharedBytes(bytes));
  document.setProtection({
    userPassword,
    ownerPassword: userPassword,
    algorithm: 'AES-256',
  });
  return document.save();
}

function toUnsharedBytes(bytes: Uint8Array): Uint8Array {
  const copy: Uint8Array = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}
