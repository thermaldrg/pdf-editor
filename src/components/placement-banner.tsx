import type { ToolbarTool } from './toolbar';

interface PlacementBannerProps {
  readonly tool: ToolbarTool;
  readonly onCancel: () => void;
}

const MESSAGES: Record<ToolbarTool, string> = {
  text: 'Click anywhere on the page to drop a text field.',
  date: 'Click anywhere on the page to drop today\u2019s date.',
  signature: 'Click anywhere on the page to drop your signature.',
  cross: 'Click anywhere on the page to drop a cross.',
  tick: 'Click anywhere on the page to drop a tick.',
  dash: 'Click anywhere on the page to drop a dash.',
};

export function PlacementBanner({ tool, onCancel }: PlacementBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-28 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
        {MESSAGES[tool]}
        <button
          type="button"
          onClick={onCancel}
          className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
