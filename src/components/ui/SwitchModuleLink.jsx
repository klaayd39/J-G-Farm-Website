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
          'group flex items-center justify-center gap-2 rounded-xl border border-[#d7ffe0]/10 bg-white/[0.03] text-sm font-medium text-slate-300 transition-all duration-150 hover:border-[#d7ffe0]/20 hover:bg-white/[0.06] hover:text-white sm:justify-start',
          compact ? 'h-10 w-10 px-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2.5' : 'px-3 py-2.5',
          isActive && 'border-[#d7ffe0]/25 bg-[#d7ffe0]/10 text-[#d7ffe0]',
          className
        )
      }
    >
      <LayoutGrid size={compact ? 16 : 18} className="shrink-0 text-[#d7ffe0]/80 group-hover:text-[#d7ffe0]" />
      <span className={cn(compact && 'hidden sm:inline')}>{compact ? 'Modules' : 'Switch Module'}</span>
    </NavLink>
  )
}
