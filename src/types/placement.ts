import type { RasterImageMimeType, ShapeKind } from './annotation';

export type PendingPlacementKind = 'text' | 'signature' | 'shape' | 'image';

export interface PendingTextPlacement {
  readonly kind: 'text';
  readonly initialText?: string;
}

export interface PendingSignaturePlacement {
  readonly kind: 'signature';
  readonly dataUrl: string;
  readonly aspectRatio: number;
}

export interface PendingShapePlacement {
  readonly kind: 'shape';
  readonly shape: ShapeKind;
}

export interface PendingImagePlacement {
  readonly kind: 'image';
  readonly dataUrl: string;
  readonly aspectRatio: number;
  readonly mimeType: RasterImageMimeType;
}

export type PendingPlacement =
  | PendingTextPlacement
  | PendingSignaturePlacement
  | PendingShapePlacement
  | PendingImagePlacement;
