import type { TabHistoryEntry, TabState } from '../types/tab';

/**
 * Pure helpers for managing per-tab undo/redo history. Kept reducer-free so
 * the tabs reducer stays a thin orchestrator and these helpers can be unit
 * tested in isolation.
 */

const MAX_HISTORY_SIZE: number = 100;
const COALESCE_WINDOW_MS: number = 800;

export function extractHistoryEntry(tab: TabState): TabHistoryEntry {
  return {
    annotations: tab.annotations,
    pageOperations: tab.pageOperations,
    formValues: tab.formValues,
    selectedAnnotationId: tab.selectedAnnotationId,
  };
}

export function buildEmptyHistory(): HistoryFields {
  return {
    past: [],
    future: [],
    lastHistoryCoalesceKey: null,
    lastHistoryAt: null,
  };
}

export function hasUndo(tab: TabState): boolean {
  return tab.past.length > 0;
}

export function hasRedo(tab: TabState): boolean {
  return tab.future.length > 0;
}

interface CommitHistoryArgs {
  readonly previous: TabState;
  readonly next: TabState;
  readonly coalesceKey: string | null;
  readonly now: number;
}

export function commitHistory({
  previous,
  next,
  coalesceKey,
  now,
}: CommitHistoryArgs): TabState {
  const previousEntry: TabHistoryEntry = extractHistoryEntry(previous);
  const nextEntry: TabHistoryEntry = extractHistoryEntry(next);
  if (areEntriesEqual(previousEntry, nextEntry)) return next;
  if (canCoalesceInto({ previous, coalesceKey, now })) {
    return {
      ...next,
      past: previous.past,
      future: previous.future,
      lastHistoryCoalesceKey: coalesceKey,
      lastHistoryAt: now,
    };
  }
  return {
    ...next,
    past: appendCapped(previous.past, previousEntry, MAX_HISTORY_SIZE),
    future: [],
    lastHistoryCoalesceKey: coalesceKey,
    lastHistoryAt: now,
  };
}

export function applyUndo(tab: TabState): TabState {
  const previous: TabHistoryEntry | undefined = tab.past[tab.past.length - 1];
  if (!previous) return tab;
  const currentEntry: TabHistoryEntry = extractHistoryEntry(tab);
  return {
    ...tab,
    ...applyEntry(previous),
    pendingPlacement: null,
    past: tab.past.slice(0, -1),
    future: [...tab.future, currentEntry],
    lastHistoryCoalesceKey: null,
    lastHistoryAt: null,
  };
}

export function applyRedo(tab: TabState): TabState {
  const upcoming: TabHistoryEntry | undefined =
    tab.future[tab.future.length - 1];
  if (!upcoming) return tab;
  const currentEntry: TabHistoryEntry = extractHistoryEntry(tab);
  return {
    ...tab,
    ...applyEntry(upcoming),
    pendingPlacement: null,
    past: [...tab.past, currentEntry],
    future: tab.future.slice(0, -1),
    lastHistoryCoalesceKey: null,
    lastHistoryAt: null,
  };
}

export function markBoundary(tab: TabState): TabState {
  if (tab.lastHistoryCoalesceKey === null && tab.lastHistoryAt === null) {
    return tab;
  }
  return {
    ...tab,
    lastHistoryCoalesceKey: null,
    lastHistoryAt: null,
  };
}

export function resetHistory(tab: TabState): TabState {
  return { ...tab, ...buildEmptyHistory() };
}

interface HistoryFields {
  readonly past: ReadonlyArray<TabHistoryEntry>;
  readonly future: ReadonlyArray<TabHistoryEntry>;
  readonly lastHistoryCoalesceKey: string | null;
  readonly lastHistoryAt: number | null;
}

function applyEntry(entry: TabHistoryEntry): TabHistoryEntry {
  return {
    annotations: entry.annotations,
    pageOperations: entry.pageOperations,
    formValues: entry.formValues,
    selectedAnnotationId: entry.selectedAnnotationId,
  };
}

function areEntriesEqual(a: TabHistoryEntry, b: TabHistoryEntry): boolean {
  return (
    a.annotations === b.annotations &&
    a.pageOperations === b.pageOperations &&
    a.formValues === b.formValues &&
    a.selectedAnnotationId === b.selectedAnnotationId
  );
}

interface CanCoalesceArgs {
  readonly previous: TabState;
  readonly coalesceKey: string | null;
  readonly now: number;
}

function canCoalesceInto({
  previous,
  coalesceKey,
  now,
}: CanCoalesceArgs): boolean {
  if (!coalesceKey) return false;
  if (previous.lastHistoryCoalesceKey !== coalesceKey) return false;
  if (previous.lastHistoryAt === null) return false;
  return now - previous.lastHistoryAt <= COALESCE_WINDOW_MS;
}

function appendCapped<T>(
  list: ReadonlyArray<T>,
  item: T,
  max: number,
): ReadonlyArray<T> {
  if (list.length < max) return [...list, item];
  return [...list.slice(list.length - max + 1), item];
}
