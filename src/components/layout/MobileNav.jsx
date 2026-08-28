import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAV_ITEMS } from '../../nav'

export function MobileNav() {
  const { isOwner } = useAuth()
  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-[#0b1411]/95 px-2 pt-1 backdrop-blur-lg md:hidden pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="flex h-14 items-stretch justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold ${
                  isActive ? 'text-emerald-300' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isActive ? 'bg-emerald-500/15' : ''
                    }`}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.75} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
