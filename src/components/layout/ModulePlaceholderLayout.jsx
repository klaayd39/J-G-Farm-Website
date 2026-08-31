import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BrandMark } from '../ui/BrandMark'
import { SwitchModuleLink } from '../ui/SwitchModuleLink'

export function ModulePlaceholderLayout({ eyebrow, title, children }) {
  const { user, profile, signOut } = useAuth()
  const displayName = profile?.full_name || user?.email || 'Account'

  return (
    <div className="flex min-h-screen flex-col bg-farm-bg text-[#d7ffe0] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(215,255,224,0.06),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(215,255,224,0.04),transparent_40%)]" />

      <header className="relative z-10 border-b border-[#d7ffe0]/10 bg-[#050505]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark size={32} />
            <div className="min-w-0">
              {eyebrow && (
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">{eyebrow}</p>
              )}
              <p className="truncate font-display text-base font-medium text-white sm:text-lg">{title}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SwitchModuleLink compact />
            <button
              type="button"
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:font-semibold"
              title="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      <footer className="relative z-10 border-t border-[#d7ffe0]/8 px-4 py-3 text-center text-[11px] text-slate-500">
        Signed in as <span className="text-slate-400">{displayName}</span>
      </footer>
    </div>
  )
}
