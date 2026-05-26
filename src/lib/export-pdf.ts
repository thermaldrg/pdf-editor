import { LineCapStyle, PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  Annotation,
  ShapeAnnotation,
  SignatureAnnotation,
  TextAnnotation,
} from '../types/annotation';
import type { FormFieldValues } from '../types/form-values';
import type { PageOperation } from '../types/page-operation';
import { applyFormFieldValues } from './apply-form-field-values';
import { hexToRgb } from './hex-to-rgb';
import {
  getContentRotationDegrees,
  toUnderlyingScreenPoint,
} from './export-pdf-geometry';
import type { UnderlyingPageSizePt } from './export-pdf-geometry';
import { getShapeDefinition } from './shape-geometry';

const FULL_TURN: number = 360;
const EMPTY_FORM_VALUES: FormFieldValues = new Map();

interface ExportPdfArgs {
  readonly sourceBytes: ArrayBuffer;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly pageOperations: ReadonlyArray<PageOperation>;
  readonly formValues?: FormFieldValues;
}

export async function exportPdf({
  sourceBytes,
  annotations,
  pageOperations,
  formValues = EMPTY_FORM_VALUES,
}: ExportPdfArgs): Promise<Uint8Array> {
  const sourceDocument: PDFDocument = await PDFDocument.load(
    sourceBytes.slice(0),
    { ignoreEncryption: true },
  );
  applyFormFieldValues({ document: sourceDocument, values: formValues });
  const outputDocument: PDFDocument = await PDFDocument.create();
  const font: PDFFont = await outputDocument.embedFont(StandardFonts.Helvetica);
  const sourceIndices: number[] = pageOperations.map((op) => op.originalIndex);
  const copiedPages: ReadonlyArray<PDFPage> = await outputDocument.copyPages(
    sourceDocument,
    sourceIndices,
  );
  for (let i: number = 0; i < pageOperations.length; i += 1) {
    const operation: PageOperation = pageOperations[i] as PageOperation;
    const page: PDFPage = copiedPages[i] as PDFPage;
    outputDocument.addPage(page);
    const intrinsicRotation: number = page.getRotation().angle;
    const totalRotation: number =
      (intrinsicRotation + operation.rotation) % FULL_TURN;
    page.setRotation(degrees(totalRotation));
    const mediaboxSize: UnderlyingPageSizePt = page.getSize();
    const pageAnnotations: ReadonlyArray<Annotation> = annotations.filter(
      (annotation) => annotation.pageIndex === operation.originalIndex,
    );
    for (const annotation of pageAnnotations) {
      await stampAnnotation({
        annotation,
        page,
        font,
        pdfDocument: outputDocument,
        underlying: mediaboxSize,
        totalRotation,
      });
    }
  }
  return outputDocument.save();
}

interface StampArgs {
  readonly annotation: Annotation;
  readonly page: PDFPage;
  readonly font: PDFFont;
  readonly pdfDocument: PDFDocument;
  readonly underlying: UnderlyingPageSizePt;
  readonly totalRotation: number;
}

async function stampAnnotation({
  annotation,
  page,
  font,
  pdfDocument,
  underlying,
  totalRotation,
}: StampArgs): Promise<void> {
  if (annotation.kind === 'text') {
    stampText({ annotation, page, font, underlying, totalRotation });
    return;
  }
  if (annotation.kind === 'signature') {
    await stampSignature({
      annotation,
      page,
      pdfDocument,
      underlying,
      totalRotation,
    });
    return;
  }
  stampShape({ annotation, page, underlying, totalRotation });
}

interface StampTextArgs {
  readonly annotation: TextAnnotation;
  readonly page: PDFPage;
  readonly font: PDFFont;
  readonly underlying: UnderlyingPageSizePt;
  readonly totalRotation: number;
}

function stampText({
  annotation,
  page,
  font,
  underlying,
  totalRotation,
}: StampTextArgs): void {
  const displayedHeight: number =
    totalRotation % 180 === 0 ? underlying.height : underlying.width;
  const fontSize: number = annotation.fontSize * displayedHeight;
  const ascent: number = font.heightAtSize(fontSize, { descender: false });
  const baselineYFractionDisplayed: number =
    annotation.y + ascent / displayedHeight;
  const anchor = toUnderlyingScreenPoint({
    point: {
      xFraction: annotation.x,
      yFraction: baselineYFractionDisplayed,
    },
    underlying,
    rotation: totalRotation,
  });
  const baselineYPdfUnderlying: number = underlying.height - anchor.yPt;
  const { r, g, b } = hexToRgb(annotation.color);
  page.drawText(annotation.text, {
    x: anchor.xPt,
    y: baselineYPdfUnderlying,
    size: fontSize,
    font,
    color: rgb(r, g, b),
    rotate: degrees(getContentRotationDegrees(totalRotation)),
  });
}

interface StampSignatureArgs {
  readonly annotation: SignatureAnnotation;
  readonly page: PDFPage;
  readonly pdfDocument: PDFDocument;
  readonly underlying: UnderlyingPageSizePt;
  readonly totalRotation: number;
}

async function stampSignature({
  annotation,
  page,
  pdfDocument,
  underlying,
  totalRotation,
}: StampSignatureArgs): Promise<void> {
  const image: PDFImage = await pdfDocument.embedPng(annotation.dataUrl);
  const displayedHeight: number =
    totalRotation % 180 === 0 ? underlying.height : underlying.width;
  const displayedWidth: number =
    totalRotation % 180 === 0 ? underlying.width : underlying.height;
  const drawWidthPt: number = annotation.width * displayedWidth;
  const drawHeightPt: number = annotation.height * displayedHeight;
  const anchorScreen = toUnderlyingScreenPoint({
    point: {
      xFraction: annotation.x,
      yFraction: annotation.y + annotation.height,
    },
    underlying,
    rotation: totalRotation,
  });
  const anchorYPdf: number = underlying.height - anchorScreen.yPt;
  page.drawImage(image, {
    x: anchorScreen.xPt,
    y: anchorYPdf,
    width: drawWidthPt,
    height: drawHeightPt,
    rotate: degrees(getContentRotationDegrees(totalRotation)),
  });
}

interface StampShapeArgs {
  readonly annotation: ShapeAnnotation;
  readonly page: PDFPage;
  readonly underlying: UnderlyingPageSizePt;
  readonly totalRotation: number;
}

function stampShape({
  annotation,
  page,
  underlying,
  totalRotation,
}: StampShapeArgs): void {
  const displayedHeight: number =
    totalRotation % 180 === 0 ? underlying.height : underlying.width;
  const thicknessPt: number = annotation.strokeWidth * displayedHeight;
  const { r, g, b } = hexToRgb(annotation.color);
  const { segments } = getShapeDefinition(annotation.shape);
  for (const segment of segments) {
    const start = toUnderlyingScreenPoint({
      point: {
        xFraction: annotation.x + segment.x1 * annotation.width,
        yFraction: annotation.y + segment.y1 * annotation.height,
      },
      underlying,
      rotation: totalRotation,
    });
    const end = toUnderlyingScreenPoint({
      point: {
        xFraction: annotation.x + segment.x2 * annotation.width,
        yFraction: annotation.y + segment.y2 * annotation.height,
      },
      underlying,
      rotation: totalRotation,
    });
    page.drawLine({
      start: { x: start.xPt, y: underlying.height - start.yPt },
      end: { x: end.xPt, y: underlying.height - end.yPt },
      thickness: thicknessPt,
      color: rgb(r, g, b),
      lineCap: LineCapStyle.Round,
    });
  }
}
