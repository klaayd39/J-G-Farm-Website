import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { BrandMark } from '../ui/BrandMark'
import { SwitchModuleLink } from '../ui/SwitchModuleLink'
import { MobileDrawer } from '../ui/MobileDrawer'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-farm-bg text-[#d7ffe0] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(215,255,224,0.06),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(215,255,224,0.04),transparent_40%)]" />

      <div className="relative z-30 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </MobileDrawer>

      <div className="relative flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-[#d7ffe0]/10 bg-[#050505]/85 px-3 backdrop-blur-md safe-top md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark size={28} />
            <span className="truncate font-display text-base font-medium text-white">J&amp;G Farm</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <SwitchModuleLink compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="main-with-mobile-nav flex-1 px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  )
}
