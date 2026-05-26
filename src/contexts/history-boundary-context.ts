import { createContext, useContext } from 'react';

/**
 * React context that lets deeply nested UI (annotation drag handles, inline
 * editors) signal that a new undoable gesture has begun. The reducer uses the
 * signal to break history coalescing so each gesture lands as its own undo
 * step regardless of how many internal state updates it fires.
 */
const noop = (): void => {};

export const HistoryBoundaryContext = createContext<() => void>(noop);

export function useHistoryBoundary(): () => void {
  return useContext(HistoryBoundaryContext);
}
