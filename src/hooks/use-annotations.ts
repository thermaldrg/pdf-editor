import { useCallback, useState } from 'react';
import { rotateBoundingBox } from '../lib/rotation-transforms';
import type { Annotation } from '../types/annotation';
import type { PageRotation } from '../types/page-operation';

export interface AnnotationsApi {
  readonly annotations: ReadonlyArray<Annotation>;
  readonly selectedId: string | null;
  readonly selectAnnotation: (id: string | null) => void;
  readonly addAnnotation: (annotation: Annotation) => void;
  readonly updateAnnotation: (
    id: string,
    patch: Partial<Annotation>,
  ) => void;
  readonly removeAnnotation: (id: string) => void;
  readonly removeAnnotationsForPage: (originalPageIndex: number) => void;
  readonly rotateAnnotationsForPage: (
    originalPageIndex: number,
    rotation: PageRotation,
  ) => void;
  readonly clearAnnotations: () => void;
}

export function useAnnotations(): AnnotationsApi {
  const [annotations, setAnnotations] = useState<ReadonlyArray<Annotation>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addAnnotation = useCallback((annotation: Annotation): void => {
    setAnnotations((current) => [...current, annotation]);
    setSelectedId(annotation.id);
  }, []);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>): void => {
      setAnnotations((current) =>
        current.map((a) => (a.id === id ? ({ ...a, ...patch } as Annotation) : a)),
      );
    },
    [],
  );

  const removeAnnotation = useCallback((id: string): void => {
    setAnnotations((current) => current.filter((a) => a.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const removeAnnotationsForPage = useCallback(
    (originalPageIndex: number): void => {
      let kept: ReadonlyArray<Annotation> = [];
      setAnnotations((current) => {
        kept = current.filter((a) => a.pageIndex !== originalPageIndex);
        return kept;
      });
      setSelectedId((currentId) => {
        if (currentId === null) return null;
        const stillExists: boolean = kept.some((a) => a.id === currentId);
        return stillExists ? currentId : null;
      });
    },
    [],
  );

  const rotateAnnotationsForPage = useCallback(
    (originalPageIndex: number, rotation: PageRotation): void => {
      if (rotation === 0) return;
      setAnnotations((current) =>
        current.map((annotation) => {
          if (annotation.pageIndex !== originalPageIndex) return annotation;
          const rotated = rotateBoundingBox(annotation, rotation);
          return { ...annotation, ...rotated } as Annotation;
        }),
      );
    },
    [],
  );

  const clearAnnotations = useCallback((): void => {
    setAnnotations([]);
    setSelectedId(null);
  }, []);

  return {
    annotations,
    selectedId,
    selectAnnotation: setSelectedId,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    removeAnnotationsForPage,
    rotateAnnotationsForPage,
    clearAnnotations,
  };
}
