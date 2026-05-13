import { memo, useCallback } from 'react';
import type { Annotation, SignatureAnnotation } from '../types/annotation';
import { AnnotationBox } from './annotation-box';
import { SignatureAnnotationView } from './signature-annotation-view';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface SignatureAnnotationRendererProps {
  readonly annotation: SignatureAnnotation;
  readonly isSelected: boolean;
  readonly pagePixelSize: PageSize;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

function SignatureAnnotationRendererImpl({
  annotation,
  isSelected,
  pagePixelSize,
  onSelect,
  onUpdate,
  onDelete,
}: SignatureAnnotationRendererProps) {
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
    >
      <SignatureAnnotationView annotation={annotation} />
    </AnnotationBox>
  );
}

export const SignatureAnnotationRenderer = memo(SignatureAnnotationRendererImpl);
