import type { ShapeKind } from './annotation';

export type PendingPlacementKind = 'text' | 'signature' | 'shape';

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

export type PendingPlacement =
  | PendingTextPlacement
  | PendingSignaturePlacement
  | PendingShapePlacement;
