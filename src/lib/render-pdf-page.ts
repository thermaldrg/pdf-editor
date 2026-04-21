import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface RenderPdfPageArgs {
  readonly document: PDFDocumentProxy;
  readonly pageIndex: number;
  readonly canvas: HTMLCanvasElement;
  readonly scale: number;
}

export async function renderPdfPage({
  document,
  pageIndex,
  canvas,
  scale,
}: RenderPdfPageArgs): Promise<void> {
  const page: PDFPageProxy = await document.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to get 2D context for canvas');
  }
  const devicePixelRatio: number = globalThis.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * devicePixelRatio);
  canvas.height = Math.floor(viewport.height * devicePixelRatio);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  const transform: number[] | undefined =
    devicePixelRatio !== 1
      ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0]
      : undefined;
  await page.render({ canvas, canvasContext: context, viewport, transform })
    .promise;
}
