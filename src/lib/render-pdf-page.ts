import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from 'pdfjs-dist';
import type { PageRotation } from '../types/page-operation';

interface RenderPdfPageArgs {
  readonly document: PDFDocumentProxy;
  readonly pageIndex: number;
  readonly canvas: HTMLCanvasElement;
  readonly scale: number;
  readonly userRotation: PageRotation;
}

export interface RenderPdfPageHandle {
  readonly promise: Promise<void>;
  readonly cancel: () => void;
}

const FULL_TURN: number = 360;

/**
 * Schedules a PDF page render onto the supplied canvas. The returned handle
 * exposes a `cancel` method that aborts the in-flight render task and prevents
 * stale renders from racing newer ones (e.g. during rapid zoom changes). The
 * `promise` resolves to undefined either on completion or cancellation, never
 * rejecting for cancellation, so call sites can rely on a single resolution.
 */
export function renderPdfPage({
  document,
  pageIndex,
  canvas,
  scale,
  userRotation,
}: RenderPdfPageArgs): RenderPdfPageHandle {
  let cancelled: boolean = false;
  let activeTask: RenderTask | null = null;
  let activePage: PDFPageProxy | null = null;
  const promise: Promise<void> = (async (): Promise<void> => {
    const page: PDFPageProxy = await document.getPage(pageIndex + 1);
    if (cancelled) {
      page.cleanup();
      return;
    }
    activePage = page;
    const totalRotation: number = ((page.rotate || 0) + userRotation) % FULL_TURN;
    const viewport = page.getViewport({ scale, rotation: totalRotation });
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to get 2D context for canvas');
    }
    const dpr: number = globalThis.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const transform: number[] | undefined =
      dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
    const task: RenderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform,
    });
    activeTask = task;
    try {
      await task.promise;
    } catch (err) {
      if (!cancelled) throw err;
    } finally {
      activeTask = null;
      page.cleanup();
    }
  })();
  return {
    promise,
    cancel: (): void => {
      cancelled = true;
      if (activeTask) {
        try {
          activeTask.cancel();
        } catch {
          // pdf.js cancel can throw synchronously when the task already settled.
        }
      }
      if (activePage) {
        try {
          activePage.cleanup();
        } catch {
          // best-effort cleanup; ignore cleanup races.
        }
      }
    },
  };
}
