import type { ShapeAnnotation } from '../types/annotation';
import { getShapeDefinition } from '../lib/shape-geometry';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface ShapeAnnotationViewProps {
  readonly annotation: ShapeAnnotation;
  readonly pagePixelSize: PageSize;
}

const STROKE_MIN_PX: number = 1.5;

export function ShapeAnnotationView({
  annotation,
  pagePixelSize,
}: ShapeAnnotationViewProps) {
  const widthPx: number = annotation.width * pagePixelSize.width;
  const heightPx: number = annotation.height * pagePixelSize.height;
  const strokePx: number = Math.max(
    STROKE_MIN_PX,
    annotation.strokeWidth * pagePixelSize.height,
  );
  const { segments } = getShapeDefinition(annotation.shape);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none h-full w-full overflow-visible"
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      preserveAspectRatio="none"
    >
      <g
        stroke={annotation.color}
        strokeWidth={strokePx}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {segments.map((segment, index) => (
          <line
            key={index}
            x1={segment.x1 * widthPx}
            y1={segment.y1 * heightPx}
            x2={segment.x2 * widthPx}
            y2={segment.y2 * heightPx}
          />
        ))}
      </g>
    </svg>
  );
}
