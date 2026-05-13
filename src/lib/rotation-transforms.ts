import type { PageRotation } from '../types/page-operation';

/**
 * Rotation utilities for axis-aligned bounding boxes expressed as fractions of
 * a page (top-left origin, x/y/width/height all in [0, 1]).
 *
 * "Rotate" here always means clockwise by 0/90/180/270 degrees. After
 * rotating the page by R, a bounding box (x, y, width, height) on the
 * pre-rotation page maps to a bounding box on the post-rotation page where
 * the page's width and height swap when R is 90 or 270.
 */

const FULL_TURN: number = 360;

const VALID_ROTATIONS: ReadonlyArray<PageRotation> = [0, 90, 180, 270];

interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

export function isPageRotation(value: number): value is PageRotation {
  return (VALID_ROTATIONS as ReadonlyArray<number>).includes(value);
}

export function normalizeRotation(degreesCw: number): PageRotation {
  const rounded: number = Math.round(degreesCw / 90) * 90;
  const wrapped: number = ((rounded % FULL_TURN) + FULL_TURN) % FULL_TURN;
  if (!isPageRotation(wrapped)) {
    throw new Error(`Invalid rotation: ${degreesCw}`);
  }
  return wrapped;
}

export function addRotation(
  base: PageRotation,
  delta: PageRotation,
): PageRotation {
  return normalizeRotation(base + delta);
}

export function inverseRotation(rotation: PageRotation): PageRotation {
  return normalizeRotation(FULL_TURN - rotation);
}

/**
 * Rotates a fractional bounding box clockwise by `rotation` degrees.
 *
 * The input box is expressed in fractions of the *pre-rotation* page; the
 * output box is in fractions of the *post-rotation* page (whose width and
 * height are swapped when rotation is 90 or 270).
 */
export function rotateBoundingBox(
  box: BoundingBox,
  rotation: PageRotation,
): BoundingBox {
  if (rotation === 0) return box;
  if (rotation === 90) {
    return {
      x: 1 - box.y - box.height,
      y: box.x,
      width: box.height,
      height: box.width,
    };
  }
  if (rotation === 180) {
    return {
      x: 1 - box.x - box.width,
      y: 1 - box.y - box.height,
      width: box.width,
      height: box.height,
    };
  }
  return {
    x: box.y,
    y: 1 - box.x - box.width,
    width: box.height,
    height: box.width,
  };
}

/**
 * Rotates a fractional point clockwise by `rotation` degrees about the page
 * center. Returns the point in fractions of the post-rotation page.
 */
export function rotatePoint(point: Point, rotation: PageRotation): Point {
  if (rotation === 0) return point;
  if (rotation === 90) return { x: 1 - point.y, y: point.x };
  if (rotation === 180) return { x: 1 - point.x, y: 1 - point.y };
  return { x: point.y, y: 1 - point.x };
}
