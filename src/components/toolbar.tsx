import type { ShapeKind } from '../types/annotation';
import { Button } from './button';
import { ShapesMenu } from './shapes-menu';

export type ToolbarTool = 'text' | 'signature' | 'date' | ShapeKind;

const SHAPE_TOOLS: ReadonlySet<ToolbarTool> = new Set<ToolbarTool>([
  'cross',
  'tick',
  'dash',
]);

interface ToolbarProps {
  readonly pendingTool: ToolbarTool | null;
  readonly canExport: boolean;
  readonly isExporting: boolean;
  readonly zoom: number;
  readonly onActivateText: () => void;
  readonly onActivateSignature: () => void;
  readonly onActivateDate: () => void;
  readonly onActivateShape: (shape: ShapeKind) => void;
  readonly onCancelPlacement: () => void;
  readonly onExport: () => void;
  readonly onReplaceFile: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}

export function Toolbar({
  pendingTool,
  canExport,
  isExporting,
  zoom,
  onActivateText,
  onActivateSignature,
  onActivateDate,
  onActivateShape,
  onCancelPlacement,
  onExport,
  onReplaceFile,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ToolbarProps) {
  const activeShape: ShapeKind | null =
    pendingTool && SHAPE_TOOLS.has(pendingTool)
      ? (pendingTool as ShapeKind)
      : null;
  return (
    <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-2.5">
        <Button
          variant={pendingTool === 'text' ? 'primary' : 'secondary'}
          onClick={
            pendingTool === 'text' ? onCancelPlacement : onActivateText
          }
        >
          <IconText />
          {pendingTool === 'text' ? 'Click to place' : 'Add text'}
        </Button>
        <Button
          variant={pendingTool === 'date' ? 'primary' : 'secondary'}
          onClick={
            pendingTool === 'date' ? onCancelPlacement : onActivateDate
          }
        >
          <IconCalendar />
          {pendingTool === 'date' ? 'Click to place' : 'Add date'}
        </Button>
        <Button
          variant={pendingTool === 'signature' ? 'primary' : 'secondary'}
          onClick={
            pendingTool === 'signature' ? onCancelPlacement : onActivateSignature
          }
        >
          <IconSignature />
          {pendingTool === 'signature' ? 'Click to place' : 'Add signature'}
        </Button>
        <ShapesMenu
          activeShape={activeShape}
          onSelectShape={onActivateShape}
          onCancelPlacement={onCancelPlacement}
        />

        <div className="ml-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={onZoomOut}
            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="min-w-[56px] rounded-md px-2 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onReplaceFile}>
            Replace PDF
          </Button>
          <Button
            variant="primary"
            disabled={!canExport || isExporting}
            onClick={onExport}
          >
            <IconDownload />
            {isExporting ? 'Exporting…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconText() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M5 4h14a1 1 0 010 2h-6v13a1 1 0 01-2 0V6H5a1 1 0 010-2z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function IconSignature() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13L2.25 21.75l.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zM19.5 7.125l-2.625-2.625"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}
