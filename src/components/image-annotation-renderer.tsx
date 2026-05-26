import { memo, useCallback } from 'react';
import type { Annotation, ImageAnnotation } from '../types/annotation';
import { AnnotationBox } from './annotation-box';
import { ImageAnnotationView } from './image-annotation-view';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface ImageAnnotationRendererProps {
  readonly annotation: ImageAnnotation;
  readonly isSelected: boolean;
  readonly pagePixelSize: PageSize;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

function ImageAnnotationRendererImpl({
  annotation,
  isSelected,
  pagePixelSize,
  onSelect,
  onUpdate,
  onDelete,
}: ImageAnnotationRendererProps) {
  const handleMove = useCallback(
    (id: string, x: number, y: number): void => {
      onUpdate(id, { x, y });
    },
    [onUpdate],
  );

  const handleResize = useCallback(
    (id: string, width: number, height: number): void => {
      onUpdate(id, { width, height });
    },
    [onUpdate],
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
      uniformResize
    >
      <ImageAnnotationView annotation={annotation} />
    </AnnotationBox>
  );
}

export const ImageAnnotationRenderer = memo(ImageAnnotationRendererImpl);
