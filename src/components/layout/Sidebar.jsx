import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { NAV_ITEMS } from '../../nav'
import { BrandMark } from '../ui/BrandMark'

export function Sidebar({ onClose }) {
  const { user, profile, isOwner, signOut } = useAuth()
  const displayName = profile?.full_name || user?.email || 'Account'
  const initial = displayName.trim().charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/8 bg-[#091310]/95 px-4 py-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 px-1 pb-6">
        <BrandMark size={38} />
        <div className="min-w-0">
          <p className="font-display text-[1.1rem] font-semibold leading-tight text-white tracking-tight">J&amp;G Farm</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] font-medium tracking-wide text-emerald-400/90">Calamansi ops</p>
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</span>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.05] to-transparent p-3.5 shadow-inner">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="truncate text-[10px] capitalize font-medium text-slate-400">{profile?.role || 'Farm Staff'}</p>
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
