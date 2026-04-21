import { LineCapStyle, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  Annotation,
  ShapeAnnotation,
  SignatureAnnotation,
  TextAnnotation,
} from '../types/annotation';
import { hexToRgb } from './hex-to-rgb';
import { getShapeDefinition } from './shape-geometry';

interface ExportPdfArgs {
  readonly sourceBytes: ArrayBuffer;
  readonly annotations: ReadonlyArray<Annotation>;
}

export async function exportPdf({
  sourceBytes,
  annotations,
}: ExportPdfArgs): Promise<Uint8Array> {
  const pdfDocument: PDFDocument = await PDFDocument.load(sourceBytes.slice(0));
  const font: PDFFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pages: PDFPage[] = pdfDocument.getPages();
  for (const annotation of annotations) {
    const page: PDFPage | undefined = pages[annotation.pageIndex];
    if (!page) continue;
    await stampAnnotation({ annotation, page, font, pdfDocument });
  }
  return pdfDocument.save();
}

interface StampArgs {
  readonly annotation: Annotation;
  readonly page: PDFPage;
  readonly font: PDFFont;
  readonly pdfDocument: PDFDocument;
}

async function stampAnnotation({
  annotation,
  page,
  font,
  pdfDocument,
}: StampArgs): Promise<void> {
  if (annotation.kind === 'text') {
    stampText({ annotation, page, font });
    return;
  }
  if (annotation.kind === 'signature') {
    await stampSignature({ annotation, page, pdfDocument });
    return;
  }
  stampShape({ annotation, page });
}

interface StampTextArgs {
  readonly annotation: TextAnnotation;
  readonly page: PDFPage;
  readonly font: PDFFont;
}

function stampText({ annotation, page, font }: StampTextArgs): void {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const fontSize: number = annotation.fontSize * pageHeight;
  const xPt: number = annotation.x * pageWidth;
  const yTopPt: number = annotation.y * pageHeight;
  const ascent: number = font.heightAtSize(fontSize, { descender: false });
  const baselineY: number = pageHeight - yTopPt - ascent;
  const { r, g, b } = hexToRgb(annotation.color);
  page.drawText(annotation.text, {
    x: xPt,
    y: baselineY,
    size: fontSize,
    font,
    color: rgb(r, g, b),
  });
}

interface StampSignatureArgs {
  readonly annotation: SignatureAnnotation;
  readonly page: PDFPage;
  readonly pdfDocument: PDFDocument;
}

async function stampSignature({
  annotation,
  page,
  pdfDocument,
}: StampSignatureArgs): Promise<void> {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const image: PDFImage = await pdfDocument.embedPng(annotation.dataUrl);
  const widthPt: number = annotation.width * pageWidth;
  const heightPt: number = annotation.height * pageHeight;
  const xPt: number = annotation.x * pageWidth;
  const yTopPt: number = annotation.y * pageHeight;
  const yBottomPt: number = pageHeight - yTopPt - heightPt;
  page.drawImage(image, {
    x: xPt,
    y: yBottomPt,
    width: widthPt,
    height: heightPt,
  });
}

interface StampShapeArgs {
  readonly annotation: ShapeAnnotation;
  readonly page: PDFPage;
}

function stampShape({ annotation, page }: StampShapeArgs): void {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const widthPt: number = annotation.width * pageWidth;
  const heightPt: number = annotation.height * pageHeight;
  const xPt: number = annotation.x * pageWidth;
  const yTopPt: number = annotation.y * pageHeight;
  const yBottomPt: number = pageHeight - yTopPt - heightPt;
  const thicknessPt: number = annotation.strokeWidth * pageHeight;
  const { r, g, b } = hexToRgb(annotation.color);
  const { segments } = getShapeDefinition(annotation.shape);
  for (const segment of segments) {
    page.drawLine({
      start: {
        x: xPt + segment.x1 * widthPt,
        y: yBottomPt + (1 - segment.y1) * heightPt,
      },
      end: {
        x: xPt + segment.x2 * widthPt,
        y: yBottomPt + (1 - segment.y2) * heightPt,
      },
      thickness: thicknessPt,
      color: rgb(r, g, b),
      lineCap: LineCapStyle.Round,
    });
  }
}
