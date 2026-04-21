import { useCallback, useEffect, useState } from 'react';
import type { Annotation, TextAnnotation } from '../types/annotation';
import { AnnotationBox } from './annotation-box';
import { TextAnnotationView } from './text-annotation-view';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface TextAnnotationRendererProps {
  readonly annotation: TextAnnotation;
  readonly isSelected: boolean;
  readonly pagePixelSize: PageSize;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

export function TextAnnotationRenderer({
  annotation,
  isSelected,
  pagePixelSize,
  onSelect,
  onUpdate,
  onDelete,
}: TextAnnotationRendererProps) {
  const [isEditing, setIsEditing] = useState<boolean>(
    annotation.text.length === 0,
  );

  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  const handleEnterEdit = useCallback((): void => {
    setIsEditing(true);
  }, []);

  const handleExitEdit = useCallback((): void => {
    setIsEditing(false);
  }, []);

  const handleMove = useCallback(
    (id: string, x: number, y: number): void => {
      onUpdate(id, { x, y });
    },
    [onUpdate],
  );

  const handleResize = useCallback(
    (id: string, width: number, height: number): void => {
      const safeHeight: number = annotation.height > 0 ? annotation.height : 1;
      const frameScale: number = height / safeHeight;
      onUpdate(id, {
        width,
        height,
        fontSize: annotation.fontSize * frameScale,
      });
    },
    [annotation.fontSize, annotation.height, onUpdate],
  );

  const handleChange = useCallback(
    (text: string): void => {
      onUpdate(annotation.id, { text });
    },
    [annotation.id, onUpdate],
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
      onDoubleClick={handleEnterEdit}
      interactiveChildren={isEditing}
      uniformResize
    >
      <TextAnnotationView
        annotation={annotation}
        isEditing={isEditing}
        pagePixelSize={pagePixelSize}
        onChange={handleChange}
        onExitEdit={handleExitEdit}
      />
    </AnnotationBox>
  );
}
