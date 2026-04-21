import { useCallback, useState } from 'react';
import type { Annotation } from '../types/annotation';

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
    clearAnnotations,
  };
}
