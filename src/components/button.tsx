import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm',
  secondary:
    'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-sm',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm',
};

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base: string =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
  return (
    <button
      {...rest}
      className={`${base} ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
