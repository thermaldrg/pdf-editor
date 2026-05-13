import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PageOperation } from '../types/page-operation';
import type { PdfPageSize } from '../types/pdf';
import { PageThumbnail } from './page-thumbnail';

interface PageSidebarProps {
  readonly document: PDFDocumentProxy;
  readonly pageOperations: ReadonlyArray<PageOperation>;
  readonly pageSizes: ReadonlyArray<PdfPageSize>;
  readonly activeDisplayIndex: number;
  readonly onSelectPage: (displayIndex: number) => void;
}

const SIDEBAR_TOP_OFFSET_PX: number = 105;
const THUMBNAIL_MAX_WIDTH_PX: number = 140;
const THUMBNAIL_MAX_HEIGHT_PX: number = 180;

export function PageSidebar({
  document,
  pageOperations,
  pageSizes,
  activeDisplayIndex,
  onSelectPage,
}: PageSidebarProps) {
  return (
    <aside
      aria-label="Page thumbnails"
      className="sticky hidden shrink-0 self-start border-r border-slate-200 bg-slate-50/80 backdrop-blur md:block"
      style={{
        top: `${SIDEBAR_TOP_OFFSET_PX}px`,
        height: `calc(100vh - ${SIDEBAR_TOP_OFFSET_PX}px)`,
        width: '200px',
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Pages
          </h2>
          <span className="text-[11px] font-medium text-slate-400 tabular-nums">
            {pageOperations.length}
          </span>
        </div>
        <ol className="flex flex-1 flex-col items-center gap-3 overflow-y-auto px-3 pb-6">
          {pageOperations.map((operation, displayIndex) => {
            const pageSize: PdfPageSize | undefined =
              pageSizes[operation.originalIndex];
            if (!pageSize) return null;
            return (
              <li
                key={`thumb-${operation.originalIndex}`}
                className="flex flex-col items-center"
              >
                <PageThumbnail
                  document={document}
                  originalPageIndex={operation.originalIndex}
                  displayIndex={displayIndex}
                  pdfPointSize={pageSize}
                  rotation={operation.rotation}
                  maxWidth={THUMBNAIL_MAX_WIDTH_PX}
                  maxHeight={THUMBNAIL_MAX_HEIGHT_PX}
                  isActive={displayIndex === activeDisplayIndex}
                  onSelect={onSelectPage}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
