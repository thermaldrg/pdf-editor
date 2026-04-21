/**
 * Annotation models.
 *
 * Coordinates are stored in a normalized page space where (0,0) is the top-left
 * of the page and (1,1) is the bottom-right. This keeps the UI layer and the
 * export layer independent from the current zoom level or rendering scale.
 */

export type AnnotationKind = 'text' | 'signature' | 'shape';

export type ShapeKind = 'cross' | 'tick' | 'dash';

interface BaseAnnotation {
  readonly id: string;
  readonly pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  readonly kind: 'text';
  text: string;
  fontSize: number;
  color: string;
}

export interface SignatureAnnotation extends BaseAnnotation {
  readonly kind: 'signature';
  readonly dataUrl: string;
}

export interface ShapeAnnotation extends BaseAnnotation {
  readonly kind: 'shape';
  readonly shape: ShapeKind;
  color: string;
  strokeWidth: number;
}

export type Annotation = TextAnnotation | SignatureAnnotation | ShapeAnnotation;
