import { normalizeRotation } from './rotation-transforms';
import type { PageRotation } from '../types/page-operation';

/**
 * Geometry helpers used during PDF export to map annotation coordinates
 * stored in the *displayed* (rotated) page frame back to the *underlying*
 * page coordinates that pdf-lib uses for drawing.
 *
 * Coordinate conventions:
 * - Displayed-frame fractions: x, y ∈ [0, 1]; (0, 0) is the top-left of the
 *   page as the user sees it (after applying the user-defined rotation).
 * - Underlying screen point: pixel/point coordinates of the PDF page in its
 *   pre-rotation orientation, top-left origin (y-down).
 * - Underlying PDF point: y-up coordinates used by pdf-lib for drawing.
 */

export interface UnderlyingPageSizePt {
  readonly width: number;
  readonly height: number;
}

export interface DisplayedFractionPoint {
  readonly xFraction: number;
  readonly yFraction: number;
}

export interface UnderlyingScreenPoint {
  readonly xPt: number;
  readonly yPt: number;
}

export interface UnderlyingScreenBox {
  readonly xPt: number;
  readonly yPt: number;
  readonly widthPt: number;
  readonly heightPt: number;
}

export function getDisplayedSizePt(
  underlying: UnderlyingPageSizePt,
  rotation: number,
): UnderlyingPageSizePt {
  const normalized: PageRotation = normalizeRotation(rotation);
  if (normalized === 90 || normalized === 270) {
    return { width: underlying.height, height: underlying.width };
  }
  return underlying;
}

/**
 * Converts a displayed-frame fractional point to the underlying screen-space
 * point (top-left origin, y-down) on the unrotated page.
 */
export function toUnderlyingScreenPoint({
  point,
  underlying,
  rotation,
}: {
  readonly point: DisplayedFractionPoint;
  readonly underlying: UnderlyingPageSizePt;
  readonly rotation: number;
}): UnderlyingScreenPoint {
  const normalized: PageRotation = normalizeRotation(rotation);
  const displayed: UnderlyingPageSizePt = getDisplayedSizePt(
    underlying,
    normalized,
  );
  const xd: number = point.xFraction * displayed.width;
  const yd: number = point.yFraction * displayed.height;
  if (normalized === 0) return { xPt: xd, yPt: yd };
  if (normalized === 90) {
    return { xPt: yd, yPt: underlying.height - xd };
  }
  if (normalized === 180) {
    return {
      xPt: underlying.width - xd,
      yPt: underlying.height - yd,
    };
  }
  return { xPt: underlying.width - yd, yPt: xd };
}

/**
 * Converts a displayed-frame axis-aligned bounding box (fractional, top-left
 * origin) into the corresponding axis-aligned bounding box on the underlying
 * page in screen coordinates.
 */
export function toUnderlyingScreenBox({
  xFraction,
  yFraction,
  widthFraction,
  heightFraction,
  underlying,
  rotation,
}: {
  readonly xFraction: number;
  readonly yFraction: number;
  readonly widthFraction: number;
  readonly heightFraction: number;
  readonly underlying: UnderlyingPageSizePt;
  readonly rotation: number;
}): UnderlyingScreenBox {
  const corners: ReadonlyArray<DisplayedFractionPoint> = [
    { xFraction, yFraction },
    { xFraction: xFraction + widthFraction, yFraction },
    { xFraction, yFraction: yFraction + heightFraction },
    {
      xFraction: xFraction + widthFraction,
      yFraction: yFraction + heightFraction,
    },
  ];
  const mapped: ReadonlyArray<UnderlyingScreenPoint> = corners.map((point) =>
    toUnderlyingScreenPoint({ point, underlying, rotation }),
  );
  const xs: ReadonlyArray<number> = mapped.map((p) => p.xPt);
  const ys: ReadonlyArray<number> = mapped.map((p) => p.yPt);
  const minX: number = Math.min(...xs);
  const minY: number = Math.min(...ys);
  return {
    xPt: minX,
    yPt: minY,
    widthPt: Math.max(...xs) - minX,
    heightPt: Math.max(...ys) - minY,
  };
}

/**
 * Returns the rotation (in pdf-lib's degree convention, positive = CCW) that
 * should be applied to text or images so that, once the page is displayed
 * with the given user rotation, the content reads upright in the displayed
 * frame.
 */
export function getContentRotationDegrees(rotation: number): number {
  return normalizeRotation(rotation);
}
