export function downloadBlob(blob: Blob, fileName: string): void {
  const url: string = URL.createObjectURL(blob);
  const anchor: HTMLAnchorElement = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
