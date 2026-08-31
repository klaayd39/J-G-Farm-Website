import { NavLink } from 'react-router-dom'
import { LogOut, Wheat } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SILAGE_NAV_ITEMS } from '../../nav-silage'
import { SwitchModuleLink } from '../ui/SwitchModuleLink'
import { ThemeToggle } from '../ui/ThemeToggle'

export function SilageSidebar({ onClose }) {
  const { user, profile, signOut } = useAuth()
  const displayName = profile?.full_name || user?.email || 'Account'
  const initial = displayName.trim().charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-full flex-col border-r border-sky-400/10 bg-app-header px-3.5 py-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 px-1.5 pb-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20">
          <Wheat size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[1.05rem] font-semibold leading-tight tracking-tight text-white">
            Super Napier
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-sky-400/80">Silage Module</p>
        </div>
      </div>

      <div className="mb-3 px-1">
        <SwitchModuleLink onClick={onClose} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {SILAGE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/25 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} className={`shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-4 space-y-2 rounded-2xl border border-app bg-app-hover p-3 shadow-inner">
        <ThemeToggle className="w-full" showLabel />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-xs font-bold text-[color:var(--app-accent-contrast)] shadow-md shadow-sky-400/20">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-app-primary">{displayName}</p>
            <p className="truncate text-[10px] font-medium text-app-secondary">{user?.email || 'Farm Account'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
