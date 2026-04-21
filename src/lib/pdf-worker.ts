import { GlobalWorkerOptions } from 'pdfjs-dist';
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let workerConfigured: boolean = false;

export function ensurePdfWorker(): void {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = PdfWorkerUrl;
  workerConfigured = true;
}
