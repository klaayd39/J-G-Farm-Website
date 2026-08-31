const VARIANTS = {
  primary:
    'bg-farm-accent text-[color:var(--app-accent-contrast)] hover:opacity-90',
  secondary:
    'border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] hover:text-white',
  ghost: 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
  danger: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/15',
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
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
