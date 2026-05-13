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
  readonly zoom: number;
  readonly isSidebarOpen: boolean;
  readonly onToggleSidebar: () => void;
  readonly onActivateText: () => void;
  readonly onActivateSignature: () => void;
  readonly onActivateDate: () => void;
  readonly onActivateShape: (shape: ShapeKind) => void;
  readonly onCancelPlacement: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}

export function Toolbar({
  pendingTool,
  zoom,
  isSidebarOpen,
  onToggleSidebar,
  onActivateText,
  onActivateSignature,
  onActivateDate,
  onActivateShape,
  onCancelPlacement,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ToolbarProps) {
  const activeShape: ShapeKind | null =
    pendingTool && SHAPE_TOOLS.has(pendingTool)
      ? (pendingTool as ShapeKind)
      : null;
  const sidebarLabel: string = isSidebarOpen
    ? 'Hide page thumbnails'
    : 'Show page thumbnails';
  return (
    <div className="sticky top-14 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-12 max-w-7xl flex-wrap items-center gap-2 px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarLabel}
          aria-pressed={isSidebarOpen}
          title={sidebarLabel}
          className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
            isSidebarOpen
              ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <IconSidebar />
        </button>
        <Divider />
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
            pendingTool === 'signature'
              ? onCancelPlacement
              : onActivateSignature
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

        <div className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={onZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
            aria-label="Zoom out"
          >
            <IconMinus />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="min-w-[3.25rem] rounded px-1.5 py-1 text-center text-xs font-medium tabular-nums text-slate-700 hover:bg-slate-100"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
            aria-label="Zoom in"
          >
            <IconPlus />
          </button>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />;
}

function IconSidebar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path strokeLinecap="round" d="M9.5 4.5v15" />
    </svg>
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

function IconMinus() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path strokeLinecap="round" d="M5 12h14" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
