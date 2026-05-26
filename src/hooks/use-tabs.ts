import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  addAnnotation as addAnnotationOp,
  removeAnnotation as removeAnnotationOp,
  removeAnnotationsForPage as removeAnnotationsForPageOp,
  rotateAnnotationsForPage as rotateAnnotationsForPageOp,
  updateAnnotation as updateAnnotationOp,
} from '../lib/annotations-store';
import {
  buildInitialPageOperations,
  movePageDownAt,
  movePageUpAt,
  removePageAt,
  rotatePageAt,
  type RemovePageResult,
  type RotatePageResult,
} from '../lib/build-page-operations';
import { createId } from '../lib/create-id';
import {
  areFormValuesDirty,
  buildInitialFormValues,
  setFormValue,
} from '../lib/form-values-store';
import { loadPdf, PdfPasswordRequiredError } from '../lib/load-pdf';
import {
  applyRedo,
  applyUndo,
  buildEmptyHistory,
  commitHistory,
  hasRedo,
  hasUndo,
  markBoundary,
} from '../lib/tab-history';
import type { Annotation } from '../types/annotation';
import type { FormFieldValue } from '../types/form-values';
import type { PageRotation } from '../types/page-operation';
import type { LoadedPdf } from '../types/pdf';
import type { PendingPlacement } from '../types/placement';
import type { TabState } from '../types/tab';

const DEFAULT_ZOOM: number = 1.25;

const EMPTY_VALUES: ReadonlyMap<string, FormFieldValue> = new Map();

function buildEmptyTab(id: string): TabState {
  return {
    id,
    status: 'empty',
    loadingFileName: null,
    errorMessage: null,
    pendingPasswordFile: null,
    passwordPrompt: null,
    pdf: null,
    annotations: [],
    selectedAnnotationId: null,
    pageOperations: [],
    formValues: EMPTY_VALUES,
    pendingPlacement: null,
    zoom: DEFAULT_ZOOM,
    isSidebarOpen: true,
    ...buildEmptyHistory(),
  };
}

interface TabsRootState {
  readonly tabs: ReadonlyArray<TabState>;
  readonly activeId: string;
}

type TabPatch = (tab: TabState) => TabState;

interface HistoryOptions {
  readonly coalesceKey: string | null;
  readonly now: number;
}

type Action =
  | {
      readonly type: 'patch_tab';
      readonly id: string;
      readonly patch: TabPatch;
      readonly history?: HistoryOptions;
    }
  | { readonly type: 'create_tab'; readonly id: string }
  | { readonly type: 'close_tab'; readonly id: string; readonly fallbackId: string }
  | { readonly type: 'activate_tab'; readonly id: string }
  | { readonly type: 'reorder_tabs'; readonly nextOrder: ReadonlyArray<string> }
  | { readonly type: 'undo'; readonly id: string }
  | { readonly type: 'redo'; readonly id: string }
  | { readonly type: 'mark_history_boundary'; readonly id: string };

function reducer(state: TabsRootState, action: Action): TabsRootState {
  if (action.type === 'patch_tab') {
    const history: HistoryOptions | undefined = action.history;
    const nextTabs: ReadonlyArray<TabState> = state.tabs.map((tab) => {
      if (tab.id !== action.id) return tab;
      const patched: TabState = action.patch(tab);
      if (patched === tab) return tab;
      if (!history) return patched;
      return commitHistory({
        previous: tab,
        next: patched,
        coalesceKey: history.coalesceKey,
        now: history.now,
      });
    });
    if (nextTabs === state.tabs) return state;
    return { ...state, tabs: nextTabs };
  }
  if (action.type === 'undo') {
    return mapTab(state, action.id, applyUndo);
  }
  if (action.type === 'redo') {
    return mapTab(state, action.id, applyRedo);
  }
  if (action.type === 'mark_history_boundary') {
    return mapTab(state, action.id, markBoundary);
  }
  if (action.type === 'create_tab') {
    return {
      tabs: [...state.tabs, buildEmptyTab(action.id)],
      activeId: action.id,
    };
  }
  if (action.type === 'close_tab') {
    const remaining: ReadonlyArray<TabState> = state.tabs.filter(
      (tab) => tab.id !== action.id,
    );
    if (remaining.length === 0) {
      return { tabs: [buildEmptyTab(action.fallbackId)], activeId: action.fallbackId };
    }
    const nextActiveId: string =
      state.activeId === action.id
        ? pickAdjacentTabId(state.tabs, action.id) ?? remaining[0]!.id
        : state.activeId;
    return { tabs: remaining, activeId: nextActiveId };
  }
  if (action.type === 'activate_tab') {
    if (state.activeId === action.id) return state;
    return { ...state, activeId: action.id };
  }
  if (action.type === 'reorder_tabs') {
    const byId: Map<string, TabState> = new Map(state.tabs.map((tab) => [tab.id, tab]));
    const next: TabState[] = [];
    for (const id of action.nextOrder) {
      const tab: TabState | undefined = byId.get(id);
      if (tab) next.push(tab);
    }
    if (next.length !== state.tabs.length) return state;
    return { ...state, tabs: next };
  }
  return state;
}

function mapTab(
  state: TabsRootState,
  id: string,
  transform: (tab: TabState) => TabState,
): TabsRootState {
  const nextTabs: ReadonlyArray<TabState> = state.tabs.map((tab) =>
    tab.id === id ? transform(tab) : tab,
  );
  if (nextTabs === state.tabs) return state;
  return { ...state, tabs: nextTabs };
}

function pickAdjacentTabId(
  tabs: ReadonlyArray<TabState>,
  closingId: string,
): string | null {
  const index: number = tabs.findIndex((tab) => tab.id === closingId);
  if (index < 0) return null;
  const next: TabState | undefined = tabs[index + 1];
  if (next) return next.id;
  const prev: TabState | undefined = tabs[index - 1];
  if (prev) return prev.id;
  return null;
}

export interface TabsApi {
  readonly tabs: ReadonlyArray<TabState>;
  readonly activeId: string;
  readonly activeTab: TabState;
  readonly createEmptyTab: () => string;
  readonly closeTab: (id: string) => void;
  readonly activateTab: (id: string) => void;
  readonly activateAtIndex: (index: number) => void;
  readonly reorderTabs: (nextOrder: ReadonlyArray<string>) => void;
  readonly openFileInActiveTab: (file: File) => Promise<void>;
  readonly openFileInNewTab: (file: File) => Promise<void>;
  readonly submitActivePassword: (password: string) => Promise<void>;
  readonly cancelActivePasswordPrompt: () => void;
  readonly closeActiveFile: () => void;
  readonly setActivePendingPlacement: (placement: PendingPlacement | null) => void;
  readonly addActiveAnnotation: (annotation: Annotation) => void;
  readonly updateActiveAnnotation: (id: string, patch: Partial<Annotation>) => void;
  readonly removeActiveAnnotation: (id: string) => void;
  readonly selectActiveAnnotation: (id: string | null) => void;
  readonly clearActiveAnnotations: () => void;
  readonly rotateActivePage: (displayIndex: number) => void;
  readonly removeActivePage: (displayIndex: number) => void;
  readonly moveActivePageUp: (displayIndex: number) => void;
  readonly moveActivePageDown: (displayIndex: number) => void;
  readonly setActiveFormText: (fieldName: string, value: string) => void;
  readonly setActiveFormCheckbox: (fieldName: string, value: boolean) => void;
  readonly setActiveFormRadio: (fieldName: string, value: string | null) => void;
  readonly setActiveFormDropdown: (fieldName: string, value: string) => void;
  readonly setActiveFormListbox: (
    fieldName: string,
    value: ReadonlyArray<string>,
  ) => void;
  readonly setActiveZoom: (zoom: number | ((current: number) => number)) => void;
  readonly toggleActiveSidebar: () => void;
  readonly hasActiveFormEdits: boolean;
  readonly undoActive: () => void;
  readonly redoActive: () => void;
  readonly markHistoryBoundary: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export function useTabs(): TabsApi {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const stateRef = useRef<TabsRootState>(state);
  useEffect((): void => {
    stateRef.current = state;
  }, [state]);
  const loadTokensRef = useRef<Map<string, number>>(new Map());

  const activeTab: TabState = useMemo(
    () => findTabOrFirst(state.tabs, state.activeId),
    [state.tabs, state.activeId],
  );

  const patchTab = useCallback((id: string, patch: TabPatch): void => {
    dispatch({ type: 'patch_tab', id, patch });
  }, []);

  const patchActiveTab = useCallback(
    (patch: TabPatch): void => {
      const targetId: string = stateRef.current.activeId;
      dispatch({ type: 'patch_tab', id: targetId, patch });
    },
    [],
  );

  const patchActiveTabWithHistory = useCallback(
    (patch: TabPatch, coalesceKey: string | null = null): void => {
      const targetId: string = stateRef.current.activeId;
      dispatch({
        type: 'patch_tab',
        id: targetId,
        patch,
        history: { coalesceKey, now: Date.now() },
      });
    },
    [],
  );

  const createEmptyTab = useCallback((): string => {
    const id: string = createId();
    dispatch({ type: 'create_tab', id });
    return id;
  }, []);

  const closeTab = useCallback((id: string): void => {
    bumpLoadToken(loadTokensRef.current, id);
    dispatch({ type: 'close_tab', id, fallbackId: createId() });
  }, []);

  const activateTab = useCallback((id: string): void => {
    dispatch({ type: 'activate_tab', id });
  }, []);

  const activateAtIndex = useCallback((index: number): void => {
    const list: ReadonlyArray<TabState> = stateRef.current.tabs;
    const tab: TabState | undefined = list[index];
    if (!tab) return;
    dispatch({ type: 'activate_tab', id: tab.id });
  }, []);

  const reorderTabs = useCallback((nextOrder: ReadonlyArray<string>): void => {
    dispatch({ type: 'reorder_tabs', nextOrder });
  }, []);

  const loadFileIntoTab = useCallback(
    async (tabId: string, file: File): Promise<void> => {
      const tokens: Map<string, number> = loadTokensRef.current;
      const token: number = bumpLoadToken(tokens, tabId);
      patchTab(tabId, (tab) => ({
        ...tab,
        status: 'loading',
        loadingFileName: file.name,
        errorMessage: null,
        pendingPasswordFile: null,
        passwordPrompt: null,
        pdf: null,
        annotations: [],
        selectedAnnotationId: null,
        pageOperations: [],
        formValues: EMPTY_VALUES,
        pendingPlacement: null,
        ...buildEmptyHistory(),
      }));
      try {
        const loaded: LoadedPdf = await loadPdf({ file });
        if (!isLatestLoad(tokens, tabId, token)) return;
        applyLoadedPdf(patchTab, tabId, loaded);
      } catch (err) {
        if (!isLatestLoad(tokens, tabId, token)) return;
        if (err instanceof PdfPasswordRequiredError) {
          applyPasswordPrompt(patchTab, tabId, file, err.isIncorrect, null, false);
          return;
        }
        const message: string =
          err instanceof Error ? err.message : 'Failed to load PDF';
        patchTab(tabId, (tab) => ({
          ...tab,
          status: 'error',
          loadingFileName: null,
          errorMessage: message,
          pdf: null,
        }));
      }
    },
    [patchTab],
  );

  const openFileInActiveTab = useCallback(
    async (file: File): Promise<void> => {
      const targetId: string = stateRef.current.activeId;
      await loadFileIntoTab(targetId, file);
    },
    [loadFileIntoTab],
  );

  const openFileInNewTab = useCallback(
    async (file: File): Promise<void> => {
      const id: string = createId();
      dispatch({ type: 'create_tab', id });
      await loadFileIntoTab(id, file);
    },
    [loadFileIntoTab],
  );

  const submitActivePassword = useCallback(
    async (password: string): Promise<void> => {
      const targetId: string = stateRef.current.activeId;
      const tab: TabState | undefined = stateRef.current.tabs.find(
        (item) => item.id === targetId,
      );
      const sourceFile: File | null = tab?.pendingPasswordFile ?? null;
      if (!sourceFile) return;
      patchTab(targetId, (current) => ({
        ...current,
        passwordPrompt: current.passwordPrompt
          ? { ...current.passwordPrompt, isSubmitting: true, errorMessage: null }
          : current.passwordPrompt,
      }));
      const tokens: Map<string, number> = loadTokensRef.current;
      const token: number = bumpLoadToken(tokens, targetId);
      try {
        const decryptedFile: File = await decryptToFile({ file: sourceFile, password });
        const loaded: LoadedPdf = await loadPdf({ file: decryptedFile });
        if (!isLatestLoad(tokens, targetId, token)) return;
        applyLoadedPdf(patchTab, targetId, loaded);
      } catch (err) {
        if (!isLatestLoad(tokens, targetId, token)) return;
        if (err instanceof PdfPasswordRequiredError) {
          applyPasswordPrompt(
            patchTab,
            targetId,
            sourceFile,
            true,
            'Incorrect password.',
            false,
          );
          return;
        }
        if (err instanceof Error && err.name === 'IncorrectPdfPasswordError') {
          applyPasswordPrompt(
            patchTab,
            targetId,
            sourceFile,
            true,
            'Incorrect password.',
            false,
          );
          return;
        }
        const message: string =
          err instanceof Error
            ? err.message
            : 'Could not unlock PDF with that password.';
        applyPasswordPrompt(patchTab, targetId, sourceFile, false, message, false);
      }
    },
    [patchTab],
  );

  const cancelActivePasswordPrompt = useCallback((): void => {
    patchActiveTab((tab) => {
      if (tab.passwordPrompt?.isSubmitting) return tab;
      return {
        ...tab,
        status: 'empty',
        passwordPrompt: null,
        pendingPasswordFile: null,
        loadingFileName: null,
      };
    });
  }, [patchActiveTab]);

  const closeActiveFile = useCallback((): void => {
    patchActiveTab((tab) => ({
      ...buildEmptyTab(tab.id),
      isSidebarOpen: tab.isSidebarOpen,
      zoom: tab.zoom,
    }));
  }, [patchActiveTab]);

  const setActivePendingPlacement = useCallback(
    (placement: PendingPlacement | null): void => {
      patchActiveTab((tab) => ({ ...tab, pendingPlacement: placement }));
    },
    [patchActiveTab],
  );

  const addActiveAnnotation = useCallback(
    (annotation: Annotation): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        annotations: addAnnotationOp(tab.annotations, annotation),
        selectedAnnotationId: annotation.id,
      }));
    },
    [patchActiveTabWithHistory],
  );

  const updateActiveAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>): void => {
      patchActiveTabWithHistory(
        (tab) => ({
          ...tab,
          annotations: updateAnnotationOp(tab.annotations, id, patch),
        }),
        `annotation:${id}`,
      );
    },
    [patchActiveTabWithHistory],
  );

  const removeActiveAnnotation = useCallback(
    (id: string): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        annotations: removeAnnotationOp(tab.annotations, id),
        selectedAnnotationId:
          tab.selectedAnnotationId === id ? null : tab.selectedAnnotationId,
      }));
    },
    [patchActiveTabWithHistory],
  );

  const selectActiveAnnotation = useCallback(
    (id: string | null): void => {
      patchActiveTab((tab) => ({ ...tab, selectedAnnotationId: id }));
    },
    [patchActiveTab],
  );

  const clearActiveAnnotations = useCallback((): void => {
    patchActiveTabWithHistory((tab) => ({
      ...tab,
      annotations: [],
      selectedAnnotationId: null,
    }));
  }, [patchActiveTabWithHistory]);

  const rotateActivePage = useCallback(
    (displayIndex: number): void => {
      patchActiveTabWithHistory((tab) => {
        const result: RotatePageResult | null = rotatePageAt(
          tab.pageOperations,
          displayIndex,
        );
        if (!result) return tab;
        const delta: PageRotation = normalizeDelta(
          result.previousRotation,
          result.nextRotation,
        );
        return {
          ...tab,
          pageOperations: result.operations,
          annotations: rotateAnnotationsForPageOp(
            tab.annotations,
            result.originalIndex,
            delta,
          ),
        };
      });
    },
    [patchActiveTabWithHistory],
  );

  const removeActivePage = useCallback(
    (displayIndex: number): void => {
      patchActiveTabWithHistory((tab) => {
        const result: RemovePageResult | null = removePageAt(
          tab.pageOperations,
          displayIndex,
        );
        if (!result) return tab;
        const filtered = removeAnnotationsForPageOp(
          tab.annotations,
          result.originalIndex,
        );
        const stillSelected: boolean = filtered.some(
          (a) => a.id === tab.selectedAnnotationId,
        );
        return {
          ...tab,
          pageOperations: result.operations,
          annotations: filtered,
          selectedAnnotationId: stillSelected ? tab.selectedAnnotationId : null,
        };
      });
    },
    [patchActiveTabWithHistory],
  );

  const moveActivePageUp = useCallback(
    (displayIndex: number): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        pageOperations: movePageUpAt(tab.pageOperations, displayIndex),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const moveActivePageDown = useCallback(
    (displayIndex: number): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        pageOperations: movePageDownAt(tab.pageOperations, displayIndex),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const setActiveFormText = useCallback(
    (fieldName: string, value: string): void => {
      patchActiveTabWithHistory(
        (tab) => ({
          ...tab,
          formValues: setFormValue(tab.formValues, fieldName, {
            kind: 'text',
            value,
          }),
        }),
        `form-text:${fieldName}`,
      );
    },
    [patchActiveTabWithHistory],
  );

  const setActiveFormCheckbox = useCallback(
    (fieldName: string, value: boolean): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        formValues: setFormValue(tab.formValues, fieldName, {
          kind: 'checkbox',
          value,
        }),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const setActiveFormRadio = useCallback(
    (fieldName: string, value: string | null): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        formValues: setFormValue(tab.formValues, fieldName, {
          kind: 'radio',
          value,
        }),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const setActiveFormDropdown = useCallback(
    (fieldName: string, value: string): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        formValues: setFormValue(tab.formValues, fieldName, {
          kind: 'dropdown',
          value,
        }),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const setActiveFormListbox = useCallback(
    (fieldName: string, value: ReadonlyArray<string>): void => {
      patchActiveTabWithHistory((tab) => ({
        ...tab,
        formValues: setFormValue(tab.formValues, fieldName, {
          kind: 'listbox',
          value,
        }),
      }));
    },
    [patchActiveTabWithHistory],
  );

  const undoActive = useCallback((): void => {
    dispatch({ type: 'undo', id: stateRef.current.activeId });
  }, []);

  const redoActive = useCallback((): void => {
    dispatch({ type: 'redo', id: stateRef.current.activeId });
  }, []);

  const markHistoryBoundary = useCallback((): void => {
    dispatch({
      type: 'mark_history_boundary',
      id: stateRef.current.activeId,
    });
  }, []);

  const setActiveZoom = useCallback(
    (zoom: number | ((current: number) => number)): void => {
      patchActiveTab((tab) => {
        const next: number = typeof zoom === 'function' ? zoom(tab.zoom) : zoom;
        if (next === tab.zoom) return tab;
        return { ...tab, zoom: next };
      });
    },
    [patchActiveTab],
  );

  const toggleActiveSidebar = useCallback((): void => {
    patchActiveTab((tab) => ({ ...tab, isSidebarOpen: !tab.isSidebarOpen }));
  }, [patchActiveTab]);

  const hasActiveFormEdits: boolean = useMemo(() => {
    if (!activeTab.pdf) return false;
    const baseline = buildInitialFormValues(activeTab.pdf.formFields);
    return areFormValuesDirty(baseline, activeTab.formValues);
  }, [activeTab.pdf, activeTab.formValues]);

  const canUndo: boolean = hasUndo(activeTab);
  const canRedo: boolean = hasRedo(activeTab);

  return {
    tabs: state.tabs,
    activeId: state.activeId,
    activeTab,
    createEmptyTab,
    closeTab,
    activateTab,
    activateAtIndex,
    reorderTabs,
    openFileInActiveTab,
    openFileInNewTab,
    submitActivePassword,
    cancelActivePasswordPrompt,
    closeActiveFile,
    setActivePendingPlacement,
    addActiveAnnotation,
    updateActiveAnnotation,
    removeActiveAnnotation,
    selectActiveAnnotation,
    clearActiveAnnotations,
    rotateActivePage,
    removeActivePage,
    moveActivePageUp,
    moveActivePageDown,
    setActiveFormText,
    setActiveFormCheckbox,
    setActiveFormRadio,
    setActiveFormDropdown,
    setActiveFormListbox,
    setActiveZoom,
    toggleActiveSidebar,
    hasActiveFormEdits,
    undoActive,
    redoActive,
    markHistoryBoundary,
    canUndo,
    canRedo,
  };
}

function buildInitialState(): TabsRootState {
  const id: string = createId();
  return { tabs: [buildEmptyTab(id)], activeId: id };
}

function findTabOrFirst(
  tabs: ReadonlyArray<TabState>,
  id: string,
): TabState {
  const found: TabState | undefined = tabs.find((tab) => tab.id === id);
  if (found) return found;
  return tabs[0] as TabState;
}

function bumpLoadToken(tokens: Map<string, number>, tabId: string): number {
  const current: number = tokens.get(tabId) ?? 0;
  const next: number = current + 1;
  tokens.set(tabId, next);
  return next;
}

function isLatestLoad(
  tokens: Map<string, number>,
  tabId: string,
  token: number,
): boolean {
  return tokens.get(tabId) === token;
}

function applyLoadedPdf(
  patch: (id: string, patch: TabPatch) => void,
  tabId: string,
  loaded: LoadedPdf,
): void {
  patch(tabId, (tab) => ({
    ...tab,
    status: 'ready',
    loadingFileName: null,
    errorMessage: null,
    pendingPasswordFile: null,
    passwordPrompt: null,
    pdf: loaded,
    annotations: [],
    selectedAnnotationId: null,
    pageOperations: buildInitialPageOperations(loaded.pageSizes.length),
    formValues: buildInitialFormValues(loaded.formFields),
    pendingPlacement: null,
    ...buildEmptyHistory(),
  }));
}

function applyPasswordPrompt(
  patch: (id: string, patch: TabPatch) => void,
  tabId: string,
  file: File,
  isIncorrect: boolean,
  errorMessage: string | null,
  isSubmitting: boolean,
): void {
  patch(tabId, (tab) => ({
    ...tab,
    status: 'needs-password',
    loadingFileName: file.name,
    pendingPasswordFile: file,
    passwordPrompt: {
      fileName: file.name,
      isIncorrect,
      isSubmitting,
      errorMessage,
    },
    pdf: null,
    annotations: [],
    selectedAnnotationId: null,
    pageOperations: [],
    formValues: EMPTY_VALUES,
    pendingPlacement: null,
    ...buildEmptyHistory(),
  }));
}

function normalizeDelta(
  previous: PageRotation,
  next: PageRotation,
): PageRotation {
  const delta: number = (next - previous + 360) % 360;
  if (delta === 0) return 0;
  if (delta === 90) return 90;
  if (delta === 180) return 180;
  return 270;
}

interface DecryptToFileArgs {
  readonly file: File;
  readonly password: string;
}

async function decryptToFile({
  file,
  password,
}: DecryptToFileArgs): Promise<File> {
  const sourceBytes: ArrayBuffer = await file.arrayBuffer();
  const { decryptPdfBytes } = await import('../lib/decrypt-pdf');
  const decrypted: Uint8Array = await decryptPdfBytes({
    bytes: sourceBytes,
    password,
  });
  return new File([decrypted as BlobPart], file.name, {
    type: 'application/pdf',
  });
}
