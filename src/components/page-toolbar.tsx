interface PageToolbarProps {
  readonly displayIndex: number;
  readonly totalPages: number;
  readonly onRotate: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDelete: () => void;
}

export function PageToolbar({
  displayIndex,
  totalPages,
  onRotate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: PageToolbarProps) {
  const canMoveUp: boolean = displayIndex > 0;
  const canMoveDown: boolean = displayIndex < totalPages - 1;
  const canDelete: boolean = totalPages > 1;
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
      <PageToolbarButton
        label="Move page up"
        onClick={onMoveUp}
        disabled={!canMoveUp}
      >
        <IconArrowUp />
      </PageToolbarButton>
      <PageToolbarButton
        label="Move page down"
        onClick={onMoveDown}
        disabled={!canMoveDown}
      >
        <IconArrowDown />
      </PageToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
      <PageToolbarButton label="Rotate page 90 degrees" onClick={onRotate}>
        <IconRotate />
      </PageToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
      <PageToolbarButton
        label="Remove page"
        onClick={onDelete}
        disabled={!canDelete}
        tone="danger"
      >
        <IconTrash />
      </PageToolbarButton>
    </div>
  );
}

interface PageToolbarButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly tone?: 'default' | 'danger';
  readonly children: React.ReactNode;
}

function PageToolbarButton({
  label,
  onClick,
  disabled = false,
  tone = 'default',
  children,
}: PageToolbarButtonProps) {
  const toneClass: string =
    tone === 'danger'
      ? 'text-rose-600 hover:bg-rose-50 disabled:text-rose-200'
      : 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent ${toneClass}`}
    >
      {children}
    </button>
  );
}

function IconArrowUp() {
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
        d="M12 19.5V4.5m0 0L5.25 11.25M12 4.5l6.75 6.75"
      />
    </svg>
  );
}

function IconArrowDown() {
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
        d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"
      />
    </svg>
  );
}

function IconRotate() {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function IconTrash() {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
