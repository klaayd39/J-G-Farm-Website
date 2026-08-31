import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { JuiceSidebar } from './JuiceSidebar'
import { JuiceMobileNav } from './JuiceMobileNav'
import { BrandMark } from '../ui/BrandMark'
import { SwitchModuleLink } from '../ui/SwitchModuleLink'

export function JuiceLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-farm-bg text-[#d7ffe0] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.05),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(215,255,224,0.04),transparent_40%)]" />

      <div className="relative z-30 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <JuiceSidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-farm-bg">
            <button
              type="button"
              className="absolute -right-12 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
            <JuiceSidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-amber-400/10 bg-[#050505]/85 px-4 backdrop-blur-md md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark size={28} />
            <span className="truncate font-display text-base font-medium text-white">Calamansi Juice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SwitchModuleLink compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-3 py-5 pb-24 sm:px-5 sm:py-6 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <JuiceMobileNav />
      </div>
    </div>
  )
}
