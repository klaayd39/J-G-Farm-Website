import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { BrandMark } from '../components/ui/BrandMark'
import { MODULES } from '../constants/modules'
import { cn } from '../utils/cn'

const ACCENT = {
  emerald: {
    icon: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
    glow: 'group-hover:shadow-emerald-500/10',
    border: 'group-hover:border-emerald-400/30',
    badge: 'bg-emerald-500/15 text-emerald-300',
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-300 ring-amber-400/25',
    glow: 'group-hover:shadow-amber-500/10',
    border: 'group-hover:border-amber-400/30',
    badge: 'bg-amber-500/15 text-amber-300',
  },
  blue: {
    icon: 'bg-sky-500/15 text-sky-300 ring-sky-400/25',
    glow: 'group-hover:shadow-sky-500/10',
    border: 'group-hover:border-sky-400/30',
    badge: 'bg-sky-500/15 text-sky-300',
  },
}

export function ModuleSelect() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505] text-[#d7ffe0] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(215,255,224,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(215,255,224,0.05),transparent_45%)]" />

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <div>
            <p className="font-display text-lg font-semibold text-white sm:text-xl">J&amp;G Farm</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Operations Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-12 sm:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7ffe0]/15 bg-[#d7ffe0]/5 px-3 py-1 text-[11px] font-semibold text-[#d7ffe0]/90">
            <Sparkles size={13} />
            Welcome back, {displayName}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Choose a module
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Select the farm operation you want to manage. Your session stays active as you switch between modules.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = module.icon
            const accent = ACCENT[module.accent] || ACCENT.emerald
            const isComingSoon = module.status === 'coming-soon'

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => navigate(module.to)}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-2xl border border-[#d7ffe0]/10 bg-[#0a0a0a]/90 p-5 text-left shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-6',
                  accent.border,
                  accent.glow
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={cn('rounded-xl p-3 ring-1 transition-transform duration-200 group-hover:scale-105', accent.icon)}>
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  {isComingSoon ? (
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide', accent.badge)}>
                      Coming Soon
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#d7ffe0]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#d7ffe0]">
                      Active
                    </span>
                  )}
                </div>

                <h2 className="mt-4 font-display text-lg font-semibold text-white">{module.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">{module.description}</p>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#d7ffe0]/80 transition-colors group-hover:text-[#d7ffe0]">
                  {isComingSoon ? 'Open module' : 'Enter module'}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
