import { PDF } from '@libpdf/core';

interface DecryptPdfBytesArgs {
  readonly bytes: ArrayBuffer | Uint8Array;
  readonly password: string;
}

/**
 * Thrown when the supplied password fails to authenticate the document.
 */
export class IncorrectPdfPasswordError extends Error {
  constructor() {
    super('Incorrect password.');
    this.name = 'IncorrectPdfPasswordError';
  }
}

/**
 * Thrown when the supplied password authenticates as user-only access and the
 * document forbids modification, so the encryption cannot be removed for
 * editing.
 */
export class CannotEditProtectedPdfError extends Error {
  constructor() {
    super(
      'This PDF requires the owner password before it can be edited.',
    );
    this.name = 'CannotEditProtectedPdfError';
  }
}

/**
 * Decrypts an encrypted PDF and returns plain (unprotected) bytes that
 * downstream tools (pdfjs-dist, pdf-lib, ...) can read without a password.
 *
 * The same value is tried as both user and owner password by the underlying
 * library, so callers only need to surface a single password input.
 */
export async function decryptPdfBytes({
  bytes,
  password,
}: DecryptPdfBytesArgs): Promise<Uint8Array> {
  const document: PDF = await PDF.load(toUnsharedBytes(bytes), {
    credentials: password,
  });
  if (!document.isEncrypted) {
    return document.save();
  }
  if (!document.isAuthenticated) {
    throw new IncorrectPdfPasswordError();
  }
  try {
    document.removeProtection();
  } catch {
    throw new CannotEditProtectedPdfError();
  }
  return document.save();
}

function toUnsharedBytes(input: ArrayBuffer | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) {
    const copy: Uint8Array = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy;
  }
  return new Uint8Array(input.slice(0));
}
