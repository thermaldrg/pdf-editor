import { useCallback } from 'react';
import type { Annotation, ShapeAnnotation } from '../types/annotation';
import {
  SHAPE_COLOR_PRESETS,
  getShapeDefinition,
} from '../lib/shape-geometry';
import { AnnotationBox } from './annotation-box';
import { ColorSwatches } from './color-swatches';
import { ShapeAnnotationView } from './shape-annotation-view';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface ShapeAnnotationRendererProps {
  readonly annotation: ShapeAnnotation;
  readonly isSelected: boolean;
  readonly pagePixelSize: PageSize;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

export function ShapeAnnotationRenderer({
  annotation,
  isSelected,
  pagePixelSize,
  onSelect,
  onUpdate,
  onDelete,
}: ShapeAnnotationRendererProps) {
  const { allowNonUniformResize } = getShapeDefinition(annotation.shape);
  const handleMove = useCallback(
    (id: string, x: number, y: number): void => {
      onUpdate(id, { x, y });
    },
    [onUpdate],
  );
  const handleResize = useCallback(
    (id: string, width: number, height: number): void => {
      const baseSide: number = Math.min(annotation.width, annotation.height);
      const nextSide: number = Math.min(width, height);
      const safeBase: number = baseSide > 0 ? baseSide : 1;
      const nextStrokeWidth: number =
        annotation.strokeWidth * (nextSide / safeBase);
      onUpdate(id, { width, height, strokeWidth: nextStrokeWidth });
    },
    [annotation.height, annotation.strokeWidth, annotation.width, onUpdate],
  );
  const handleColorChange = useCallback(
    (color: string): void => {
      onUpdate(annotation.id, { color });
    },
    [annotation.id, onUpdate],
  );
  const selectionToolbar = (
    <ColorSwatches
      selectedColor={annotation.color}
      options={SHAPE_COLOR_PRESETS}
      onSelectColor={handleColorChange}
    />
  );
  return (
    <AnnotationBox
      annotation={annotation}
      isSelected={isSelected}
      pagePixelSize={pagePixelSize}
      onSelect={onSelect}
      onMove={handleMove}
      onResize={handleResize}
      onDelete={onDelete}
      uniformResize={!allowNonUniformResize}
      selectionToolbar={selectionToolbar}
    >
      <ShapeAnnotationView
        annotation={annotation}
        pagePixelSize={pagePixelSize}
      />
    </AnnotationBox>
  );
}
