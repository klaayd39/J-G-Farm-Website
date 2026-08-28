import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { BrandMark } from '../ui/BrandMark'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#08110e] text-slate-100 antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.07),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(132,204,22,0.05),transparent_40%)]" />

      <div className="relative z-30 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#0b1411]">
            <button
              type="button"
              className="absolute -right-12 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/8 bg-[#08110e]/85 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="font-display text-base font-medium text-white">J&amp;G Farm</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:p-8 md:pb-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  )
}
