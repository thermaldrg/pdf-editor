import type { LoadedPdf } from '../types/pdf';
import type { Annotation } from '../types/annotation';
import type { PendingPlacement } from '../types/placement';
import { PdfPage } from './pdf-page';

interface PdfViewerProps {
  readonly pdf: LoadedPdf;
  readonly zoom: number;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly selectedId: string | null;
  readonly pendingPlacement: PendingPlacement | null;
  readonly onSelect: (id: string | null) => void;
  readonly onPlaceAt: (
    pageIndex: number,
    xFraction: number,
    yFraction: number,
  ) => void;
  readonly onUpdate: (id: string, patch: Partial<Annotation>) => void;
  readonly onDelete: (id: string) => void;
}

export function PdfViewer({
  pdf,
  zoom,
  annotations,
  selectedId,
  pendingPlacement,
  onSelect,
  onPlaceAt,
  onUpdate,
  onDelete,
}: PdfViewerProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8">
      {pdf.pageSizes.map((pageSize, index) => (
        <PdfPage
          key={`${pdf.fileName}-${index}`}
          document={pdf.document}
          pageIndex={index}
          pdfPointSize={pageSize}
          zoom={zoom}
          annotations={annotations.filter((a) => a.pageIndex === index)}
          selectedId={selectedId}
          pendingPlacement={pendingPlacement}
          onSelect={onSelect}
          onPlaceAt={onPlaceAt}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
