import { PDFDocument } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import { loadPdfLibDocument } from './load-pdf-lib-document';

interface MergePdfsArgs {
  readonly files: ReadonlyArray<File>;
}

/**
 * Merges the provided PDF files into a single document, preserving the
 * given file order. Returns the serialized bytes of the merged PDF.
 */
export async function mergePdfs({ files }: MergePdfsArgs): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('Select at least one PDF to merge.');
  }
  const merged: PDFDocument = await PDFDocument.create();
  for (const file of files) {
    await appendFilePages({ file, merged });
  }
  return merged.save();
}

interface AppendFilePagesArgs {
  readonly file: File;
  readonly merged: PDFDocument;
}

async function appendFilePages({
  file,
  merged,
}: AppendFilePagesArgs): Promise<void> {
  const bytes: ArrayBuffer = await file.arrayBuffer();
  let source: PDFDocument;
  try {
    source = await loadPdfLibDocument({ bytes });
  } catch {
    throw new Error(`Could not read "${file.name}". Is it a valid PDF?`);
  }
  const indices: number[] = source.getPageIndices();
  const copied: PDFPage[] = await merged.copyPages(source, indices);
  for (const page of copied) {
    merged.addPage(page);
  }
}
