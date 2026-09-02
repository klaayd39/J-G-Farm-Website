import { NavLink } from 'react-router-dom'
import { JUICE_NAV_ITEMS } from '../../juice/nav'

export function JuiceMobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-400/10 bg-app-header px-4 pt-1 backdrop-blur-lg md:hidden pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex h-14 max-w-md items-stretch justify-around">
        {JUICE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-amber-300' : 'text-app-muted hover:text-app-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-amber-500/15 text-amber-400' : ''
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
                  </span>
                  <span className="truncate text-center leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
