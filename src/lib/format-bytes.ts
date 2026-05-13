const BYTES_PER_KB: number = 1024;
const BYTES_PER_MB: number = BYTES_PER_KB * 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
  }
  if (bytes >= BYTES_PER_KB) {
    return `${(bytes / BYTES_PER_KB).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}
