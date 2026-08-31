import { NavLink } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../../utils/cn'
import { MODULE_SELECT_PATH } from '../../constants/modules'

export function SwitchModuleLink({ className, onClick, compact = false }) {
  return (
    <NavLink
      to={MODULE_SELECT_PATH}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center justify-center gap-2 rounded-xl border border-app bg-app-hover text-sm font-medium text-app-secondary transition-all duration-150 hover:border-app-strong hover:text-app-primary sm:justify-start',
          compact ? 'h-10 w-10 px-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2.5' : 'px-3 py-2.5',
          isActive && 'border-app-strong bg-farm-accent/10 text-app-accent',
          className
        )
      }
    >
      <LayoutGrid size={compact ? 16 : 18} className="shrink-0 text-app-accent group-hover:text-app-accent" />
      <span className={cn(compact && 'hidden sm:inline')}>{compact ? 'Modules' : 'Switch Module'}</span>
    </NavLink>
  )
}
