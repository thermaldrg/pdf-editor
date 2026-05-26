import type { PageOperation, PageRotation } from '../types/page-operation';
import { addRotation } from './rotation-transforms';

/**
 * Pure helpers that drive `pageOperations` mutations. Centralising these here
 * keeps the tabs reducer compact and lets the same logic be unit-tested in
 * isolation from any React state container.
 */

const ROTATION_STEP: PageRotation = 90;

export function buildInitialPageOperations(
  pageCount: number,
): ReadonlyArray<PageOperation> {
  const list: PageOperation[] = [];
  for (let i: number = 0; i < pageCount; i += 1) {
    list.push({ originalIndex: i, rotation: 0 });
  }
  return list;
}

export interface RotatePageResult {
  readonly operations: ReadonlyArray<PageOperation>;
  readonly originalIndex: number;
  readonly previousRotation: PageRotation;
  readonly nextRotation: PageRotation;
}

export function rotatePageAt(
  operations: ReadonlyArray<PageOperation>,
  displayIndex: number,
): RotatePageResult | null {
  const current: PageOperation | undefined = operations[displayIndex];
  if (!current) return null;
  const nextRotation: PageRotation = addRotation(current.rotation, ROTATION_STEP);
  const next: ReadonlyArray<PageOperation> = operations.map((op, index) =>
    index === displayIndex ? { ...op, rotation: nextRotation } : op,
  );
  return {
    operations: next,
    originalIndex: current.originalIndex,
    previousRotation: current.rotation,
    nextRotation,
  };
}

export interface RemovePageResult {
  readonly operations: ReadonlyArray<PageOperation>;
  readonly originalIndex: number;
}

export function removePageAt(
  operations: ReadonlyArray<PageOperation>,
  displayIndex: number,
): RemovePageResult | null {
  const current: PageOperation | undefined = operations[displayIndex];
  if (!current) return null;
  const next: ReadonlyArray<PageOperation> = operations.filter(
    (_, index) => index !== displayIndex,
  );
  return { operations: next, originalIndex: current.originalIndex };
}

export function movePageUpAt(
  operations: ReadonlyArray<PageOperation>,
  displayIndex: number,
): ReadonlyArray<PageOperation> {
  if (displayIndex <= 0) return operations;
  return swapAt(operations, displayIndex, displayIndex - 1);
}

export function movePageDownAt(
  operations: ReadonlyArray<PageOperation>,
  displayIndex: number,
): ReadonlyArray<PageOperation> {
  if (displayIndex >= operations.length - 1) return operations;
  return swapAt(operations, displayIndex, displayIndex + 1);
}

function swapAt<T>(
  list: ReadonlyArray<T>,
  indexA: number,
  indexB: number,
): ReadonlyArray<T> {
  const next: T[] = list.slice();
  const tmp: T = next[indexA] as T;
  next[indexA] = next[indexB] as T;
  next[indexB] = tmp;
  return next;
}
