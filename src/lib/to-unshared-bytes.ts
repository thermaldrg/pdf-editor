/**
 * Returns a fresh `Uint8Array` that owns its bytes, so callers can hand it to
 * libraries that take ownership of the underlying buffer without affecting
 * the original input.
 */
export function toUnsharedBytes(
  input: ArrayBuffer | Uint8Array,
): Uint8Array {
  if (input instanceof Uint8Array) {
    const copy: Uint8Array = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy;
  }
  return new Uint8Array(input.slice(0));
}
