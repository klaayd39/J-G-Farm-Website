const VARIANTS = {
  primary:
    'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm shadow-emerald-500/20',
  secondary:
    'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white',
  ghost: 'text-slate-400 hover:bg-white/5 hover:text-white',
  danger: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/25 hover:bg-red-500/25',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
