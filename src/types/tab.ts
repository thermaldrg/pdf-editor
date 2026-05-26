import type { Annotation } from './annotation';
import type { FormFieldValues } from './form-values';
import type { PageOperation } from './page-operation';
import type { LoadedPdf } from './pdf';
import type { PendingPlacement } from './placement';

/**
 * Lifecycle status of a single editor tab.
 *
 * Tabs are first-class state objects living next to each other in the tabs
 * reducer. A tab is `empty` when the user has opened a new tab but not yet
 * picked a file; `loading` while the file is being parsed; `ready` once a PDF
 * is fully loaded and editable; `error` on a hard load failure; and
 * `needs-password` when the PDF is encrypted and waiting on user input.
 */
export type TabStatus =
  | 'empty'
  | 'loading'
  | 'ready'
  | 'error'
  | 'needs-password';

export interface TabPasswordPromptState {
  readonly fileName: string;
  readonly isIncorrect: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
}

/**
 * Snapshot of the editable parts of a tab. The history stacks store these so
 * that undo/redo only touches user-authored content and never the transient
 * UI state (zoom, sidebar, pending placement, etc.).
 */
export interface TabHistoryEntry {
  readonly annotations: ReadonlyArray<Annotation>;
  readonly pageOperations: ReadonlyArray<PageOperation>;
  readonly formValues: FormFieldValues;
  readonly selectedAnnotationId: string | null;
}

/**
 * The complete editing state for a single tab. Holding all per-tab state in
 * one object keeps the tabs reducer simple and lets us swap the active tab
 * with O(1) reads and zero re-parsing of the PDF.
 *
 * `past` / `future` form an undo stack. `lastHistoryCoalesceKey` and
 * `lastHistoryAt` let consecutive small edits (a drag gesture, a burst of
 * typing) collapse into a single undo step.
 */
export interface TabState {
  readonly id: string;
  readonly status: TabStatus;
  readonly loadingFileName: string | null;
  readonly errorMessage: string | null;
  readonly pendingPasswordFile: File | null;
  readonly passwordPrompt: TabPasswordPromptState | null;
  readonly pdf: LoadedPdf | null;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly selectedAnnotationId: string | null;
  readonly pageOperations: ReadonlyArray<PageOperation>;
  readonly formValues: FormFieldValues;
  readonly pendingPlacement: PendingPlacement | null;
  readonly zoom: number;
  readonly isSidebarOpen: boolean;
  readonly past: ReadonlyArray<TabHistoryEntry>;
  readonly future: ReadonlyArray<TabHistoryEntry>;
  readonly lastHistoryCoalesceKey: string | null;
  readonly lastHistoryAt: number | null;
}
