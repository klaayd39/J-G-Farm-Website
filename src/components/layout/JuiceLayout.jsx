import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, GlassWater } from 'lucide-react'
import { JuiceSidebar } from './JuiceSidebar'
import { JuiceMobileNav } from './JuiceMobileNav'
import { SwitchModuleLink } from '../ui/SwitchModuleLink'
import { MobileDrawer } from '../ui/MobileDrawer'
import { ThemeToggle } from '../ui/ThemeToggle'

export function JuiceLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-farm-bg text-app antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.06),transparent_42%),radial-gradient(ellipse_at_bottom_right,var(--app-gradient-b),transparent_40%)]" />

      <div className="relative z-30 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <JuiceSidebar />
      </div>

      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <JuiceSidebar onClose={() => setMobileMenuOpen(false)} />
      </MobileDrawer>

      <div className="relative flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-amber-400/10 bg-app-header px-3 backdrop-blur-md safe-top md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
              <GlassWater size={18} />
            </div>
            <span className="truncate font-display text-sm font-medium text-app-primary sm:text-base">Calamansi Juice</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle compact />
            <SwitchModuleLink compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-app-secondary hover:bg-app-hover hover:text-app-primary"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="main-with-mobile-nav flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </main>

        <JuiceMobileNav />
      </div>
    </div>
  )
}
