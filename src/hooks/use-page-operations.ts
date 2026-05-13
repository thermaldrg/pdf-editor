import { useCallback, useEffect, useRef, useState } from 'react';
import { addRotation } from '../lib/rotation-transforms';
import type { PageOperation, PageRotation } from '../types/page-operation';

export interface RotatePageEvent {
  readonly originalIndex: number;
  readonly previousRotation: PageRotation;
  readonly nextRotation: PageRotation;
}

export interface RemovePageEvent {
  readonly originalIndex: number;
}

export interface PageOperationsApi {
  readonly operations: ReadonlyArray<PageOperation>;
  readonly resetForPageCount: (pageCount: number) => void;
  readonly rotatePage: (displayIndex: number) => RotatePageEvent | null;
  readonly removePage: (displayIndex: number) => RemovePageEvent | null;
  readonly movePageUp: (displayIndex: number) => void;
  readonly movePageDown: (displayIndex: number) => void;
}

const ROTATION_STEP: PageRotation = 90;

export function usePageOperations(): PageOperationsApi {
  const [operations, setOperations] = useState<ReadonlyArray<PageOperation>>(
    [],
  );
  const operationsRef = useRef<ReadonlyArray<PageOperation>>(operations);
  useEffect((): void => {
    operationsRef.current = operations;
  }, [operations]);

  const resetForPageCount = useCallback((pageCount: number): void => {
    setOperations(buildInitialOperations(pageCount));
  }, []);

  const rotatePage = useCallback(
    (displayIndex: number): RotatePageEvent | null => {
      const list: ReadonlyArray<PageOperation> = operationsRef.current;
      const current: PageOperation | undefined = list[displayIndex];
      if (!current) return null;
      const nextRotation: PageRotation = addRotation(
        current.rotation,
        ROTATION_STEP,
      );
      setOperations((prev) =>
        prev.map((op, index) =>
          index === displayIndex ? { ...op, rotation: nextRotation } : op,
        ),
      );
      return {
        originalIndex: current.originalIndex,
        previousRotation: current.rotation,
        nextRotation,
      };
    },
    [],
  );

  const removePage = useCallback(
    (displayIndex: number): RemovePageEvent | null => {
      const list: ReadonlyArray<PageOperation> = operationsRef.current;
      const current: PageOperation | undefined = list[displayIndex];
      if (!current) return null;
      setOperations((prev) => prev.filter((_, index) => index !== displayIndex));
      return { originalIndex: current.originalIndex };
    },
    [],
  );

  const movePageUp = useCallback((displayIndex: number): void => {
    if (displayIndex <= 0) return;
    setOperations((list) => swapAt(list, displayIndex, displayIndex - 1));
  }, []);

  const movePageDown = useCallback((displayIndex: number): void => {
    setOperations((list) => {
      if (displayIndex >= list.length - 1) return list;
      return swapAt(list, displayIndex, displayIndex + 1);
    });
  }, []);

  return {
    operations,
    resetForPageCount,
    rotatePage,
    removePage,
    movePageUp,
    movePageDown,
  };
}

function buildInitialOperations(pageCount: number): ReadonlyArray<PageOperation> {
  const list: PageOperation[] = [];
  for (let i: number = 0; i < pageCount; i += 1) {
    list.push({ originalIndex: i, rotation: 0 });
  }
  return list;
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
