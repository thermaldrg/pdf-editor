import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedPdf } from '../types/pdf';
import type { Annotation } from '../types/annotation';
import type { PageOperation } from '../types/page-operation';
import type { PendingPlacement } from '../types/placement';
import { PageSidebar } from './page-sidebar';
import { PdfPage } from './pdf-page';

interface PdfViewerProps {
  readonly pdf: LoadedPdf;
  readonly pageOperations: ReadonlyArray<PageOperation>;
  readonly zoom: number;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly selectedId: string | null;
  readonly pendingPlacement: PendingPlacement | null;
  readonly isSidebarOpen: boolean;
  readonly onSelect: (id: string | null) => void;
  readonly onPlaceAt: (
    originalPageIndex: number,
    xFraction: number,
    yFraction: number,
  ) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
  readonly onRotatePage: (displayIndex: number) => void;
  readonly onRemovePage: (displayIndex: number) => void;
  readonly onMovePageUp: (displayIndex: number) => void;
  readonly onMovePageDown: (displayIndex: number) => void;
}

const SCROLL_TOP_OFFSET_PX: number = 120;
const VISIBILITY_THRESHOLDS: number[] = buildThresholds();

export function PdfViewer({
  pdf,
  pageOperations,
  zoom,
  annotations,
  selectedId,
  pendingPlacement,
  isSidebarOpen,
  onSelect,
  onPlaceAt,
  onUpdate,
  onDelete,
  onRotatePage,
  onRemovePage,
  onMovePageUp,
  onMovePageDown,
}: PdfViewerProps) {
  const pageNodesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const [activeDisplayIndex, setActiveDisplayIndex] = useState<number>(0);
  const annotationsByPage = useMemo(
    () => groupAnnotationsByPage(annotations),
    [annotations],
  );
  const pageCount: number = pageOperations.length;
  const clampedActiveIndex: number =
    pageCount === 0 ? 0 : Math.min(activeDisplayIndex, pageCount - 1);
  useEffect((): (() => void) | void => {
    if (pageCount === 0) return;
    const ratios: Map<number, number> = new Map();
    const observer: IntersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const indexAttr: string | null =
            entry.target.getAttribute('data-display-index');
          if (indexAttr === null) continue;
          const index: number = Number.parseInt(indexAttr, 10);
          if (Number.isNaN(index)) continue;
          ratios.set(index, entry.intersectionRatio);
        }
        const next: number = pickMostVisibleIndex(ratios);
        if (next >= 0) setActiveDisplayIndex(next);
      },
      { threshold: VISIBILITY_THRESHOLDS },
    );
    for (const node of pageNodesRef.current.values()) {
      observer.observe(node);
    }
    return (): void => observer.disconnect();
  }, [pageCount]);
  const handleSelectPage = useCallback((displayIndex: number): void => {
    const node: HTMLDivElement | undefined =
      pageNodesRef.current.get(displayIndex);
    if (!node) return;
    const top: number =
      node.getBoundingClientRect().top + window.scrollY - SCROLL_TOP_OFFSET_PX;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);
  const setPageRef = useCallback(
    (displayIndex: number, node: HTMLDivElement | null): void => {
      const map: Map<number, HTMLDivElement> = pageNodesRef.current;
      if (node) {
        map.set(displayIndex, node);
      } else {
        map.delete(displayIndex);
      }
    },
    [],
  );
  return (
    <div className="flex flex-1">
      {isSidebarOpen && (
        <PageSidebar
          document={pdf.document}
          pageOperations={pageOperations}
          pageSizes={pdf.pageSizes}
          activeDisplayIndex={clampedActiveIndex}
          onSelectPage={handleSelectPage}
        />
      )}
      <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8">
        {pageOperations.map((operation, displayIndex) => {
          const pageSize = pdf.pageSizes[operation.originalIndex];
          if (!pageSize) return null;
          return (
            <PageSlot
              key={`${pdf.fileName}-${operation.originalIndex}`}
              displayIndex={displayIndex}
              setPageRef={setPageRef}
            >
              <PdfPage
                document={pdf.document}
                originalPageIndex={operation.originalIndex}
                displayIndex={displayIndex}
                totalPages={pageOperations.length}
                pdfPointSize={pageSize}
                rotation={operation.rotation}
                zoom={zoom}
                annotations={annotationsByPage.get(operation.originalIndex) ?? []}
                selectedId={selectedId}
                pendingPlacement={pendingPlacement}
                onSelect={onSelect}
                onPlaceAt={onPlaceAt}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onRotatePage={onRotatePage}
                onRemovePage={onRemovePage}
                onMovePageUp={onMovePageUp}
                onMovePageDown={onMovePageDown}
              />
            </PageSlot>
          );
        })}
      </div>
    </div>
  );
}

interface PageSlotProps {
  readonly displayIndex: number;
  readonly setPageRef: (
    displayIndex: number,
    node: HTMLDivElement | null,
  ) => void;
  readonly children: React.ReactNode;
}

function PageSlot({ displayIndex, setPageRef, children }: PageSlotProps) {
  const ref = useCallback(
    (node: HTMLDivElement | null): void => {
      setPageRef(displayIndex, node);
    },
    [displayIndex, setPageRef],
  );
  return (
    <div
      ref={ref}
      data-display-index={displayIndex}
      id={buildPageDomId(displayIndex)}
      className="scroll-mt-32"
    >
      {children}
    </div>
  );
}

function buildPageDomId(displayIndex: number): string {
  return `pdf-page-${displayIndex}`;
}

function buildThresholds(): number[] {
  const steps: number[] = [];
  for (let i: number = 0; i <= 10; i += 1) {
    steps.push(i / 10);
  }
  return steps;
}

function pickMostVisibleIndex(ratios: ReadonlyMap<number, number>): number {
  let bestIndex: number = -1;
  let bestRatio: number = 0;
  for (const [index, ratio] of ratios) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function groupAnnotationsByPage(
  annotations: ReadonlyArray<Annotation>,
): ReadonlyMap<number, ReadonlyArray<Annotation>> {
  const map: Map<number, Annotation[]> = new Map();
  for (const annotation of annotations) {
    const list: Annotation[] = map.get(annotation.pageIndex) ?? [];
    list.push(annotation);
    map.set(annotation.pageIndex, list);
  }
  return map;
}
