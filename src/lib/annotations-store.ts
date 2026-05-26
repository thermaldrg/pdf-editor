import type { Annotation } from '../types/annotation';
import type { PageRotation } from '../types/page-operation';
import { rotateBoundingBox } from './rotation-transforms';

/**
 * Pure helpers for mutating an annotation list. Kept separate from the tabs
 * reducer so the same code path is reused by any future undo/redo or
 * collaboration layer that needs to apply patches deterministically.
 */

export function addAnnotation(
  annotations: ReadonlyArray<Annotation>,
  annotation: Annotation,
): ReadonlyArray<Annotation> {
  return [...annotations, annotation];
}

export function updateAnnotation(
  annotations: ReadonlyArray<Annotation>,
  id: string,
  patch: Partial<Annotation>,
): ReadonlyArray<Annotation> {
  return annotations.map((a) =>
    a.id === id ? ({ ...a, ...patch } as Annotation) : a,
  );
}

export function removeAnnotation(
  annotations: ReadonlyArray<Annotation>,
  id: string,
): ReadonlyArray<Annotation> {
  return annotations.filter((a) => a.id !== id);
}

export function removeAnnotationsForPage(
  annotations: ReadonlyArray<Annotation>,
  originalPageIndex: number,
): ReadonlyArray<Annotation> {
  return annotations.filter((a) => a.pageIndex !== originalPageIndex);
}

export function rotateAnnotationsForPage(
  annotations: ReadonlyArray<Annotation>,
  originalPageIndex: number,
  rotation: PageRotation,
): ReadonlyArray<Annotation> {
  if (rotation === 0) return annotations;
  return annotations.map((annotation) => {
    if (annotation.pageIndex !== originalPageIndex) return annotation;
    const rotated = rotateBoundingBox(annotation, rotation);
    return { ...annotation, ...rotated } as Annotation;
  });
}
