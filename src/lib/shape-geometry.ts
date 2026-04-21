/**
 * Shared geometry for stamp shapes.
 *
 * Each segment is expressed in the shape's local unit square (0..1, 0..1)
 * with (0,0) at the top-left. Consumers (the UI renderer and the pdf-lib
 * exporter) multiply these coordinates by the concrete box dimensions and
 * flip the Y axis if required.
 */

import type { ShapeKind } from '../types/annotation';

export interface ShapeSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface ShapeDefinition {
  readonly segments: ReadonlyArray<ShapeSegment>;
  readonly visualAspectRatio: number;
  readonly defaultWidth: number;
  readonly allowNonUniformResize: boolean;
}

const SHAPE_DEFINITIONS: Record<ShapeKind, ShapeDefinition> = {
  cross: {
    segments: [
      { x1: 0, y1: 0, x2: 1, y2: 1 },
      { x1: 1, y1: 0, x2: 0, y2: 1 },
    ],
    visualAspectRatio: 1,
    defaultWidth: 0.04,
    allowNonUniformResize: false,
  },
  tick: {
    segments: [
      { x1: 0.1, y1: 0.55, x2: 0.38, y2: 0.85 },
      { x1: 0.38, y1: 0.85, x2: 0.92, y2: 0.15 },
    ],
    visualAspectRatio: 1.4,
    defaultWidth: 0.06,
    allowNonUniformResize: false,
  },
  dash: {
    segments: [{ x1: 0, y1: 0.5, x2: 1, y2: 0.5 }],
    visualAspectRatio: 6,
    defaultWidth: 0.12,
    allowNonUniformResize: true,
  },
};

export function getShapeDefinition(shape: ShapeKind): ShapeDefinition {
  return SHAPE_DEFINITIONS[shape];
}

export const DEFAULT_SHAPE_STROKE_WIDTH: number = 0.004;

export const DEFAULT_SHAPE_COLOR: string = '#000000';

export const SHAPE_COLOR_PRESETS: ReadonlyArray<{
  readonly value: string;
  readonly label: string;
}> = [
  { value: '#000000', label: 'Black' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#7c3aed', label: 'Purple' },
];
