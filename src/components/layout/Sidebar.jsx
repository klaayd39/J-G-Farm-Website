import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Trees,
  FileBarChart,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/harvests', label: 'Harvests', icon: Trees },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]

export function Sidebar({ onClose }) {
  const { user, profile, signOut } = useAuth()

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-800 bg-slate-950/90 p-4 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">J&G FARM</h1>
            <p className="text-[11px] font-medium text-emerald-400">Calamansi Tracker</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold text-white">
              {profile?.full_name || user?.email || 'User'}
            </p>
            <p className="truncate text-[10px] text-emerald-400/80 uppercase tracking-wider">
              {profile?.role || 'Staff'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
