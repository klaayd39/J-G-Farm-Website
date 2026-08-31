import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../utils/cn'

export function ThemeToggle({ className, showLabel = false, compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-xl border border-app bg-app-hover text-app-secondary transition-colors hover:border-app-strong hover:text-app-primary',
        compact ? 'h-10 w-10 px-0' : 'px-3 py-2 text-xs font-semibold',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun size={compact ? 18 : 16} className="shrink-0 text-amber-300 group-hover:text-amber-200" />
      ) : (
        <Moon size={compact ? 18 : 16} className="shrink-0 text-sky-600 group-hover:text-sky-700" />
      )}
      {showLabel && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
      {!showLabel && !compact && <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
