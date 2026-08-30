import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sprout, BarChart3, PhilippinePeso } from 'lucide-react'
import toast from 'react-hot-toast'
import { BrandMark } from '../components/ui/BrandMark'
import { Button } from '../components/ui/Button'
import heroImage from '../assets/hero.png'

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Welcome back to J&G Farm!')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#070d0b]">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12">
        <img
          src={heroImage}
          alt="J&G Calamansi Orchard"
          className="absolute inset-0 h-full w-full object-cover scale-105 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d0b] via-[#070d0b]/75 to-[#070d0b]/40 backdrop-blur-[2px]" />

        <div className="relative z-10 flex items-center gap-3.5">
          <BrandMark size={46} />
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-white">J&amp;G Farm</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Calamansi Enterprise Operations</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <Sprout size={14} />
            <span>Digital Orchard Ledger &amp; Analytics</span>
          </div>

          <h2 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Streamline your harvest, sales, and orchard profitability.
          </h2>

          <p className="text-sm leading-relaxed text-slate-300">
            Dedicated operating system engineered for calamansi growers: record picker yields, commercial market dispatches, and farm overhead with instant P&amp;L insight.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <Sprout size={18} className="text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Batch Tracking</p>
              <p className="text-[11px] text-slate-400">By date</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <PhilippinePeso size={18} className="text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Market Sales</p>
              <p className="text-[11px] text-slate-400">Bag &amp; kilo</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <BarChart3 size={18} className="text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Net Margins</p>
              <p className="text-[11px] text-slate-400">Real-time P&amp;L</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 J&amp;G Farm. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Encrypted Database
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark size={40} />
            <div>
              <p className="font-display text-xl font-bold text-white">J&amp;G Farm</p>
              <p className="text-xs text-emerald-400 font-medium">Calamansi operations</p>
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold text-white tracking-tight">Sign in to Farm Portal</h1>
            <p className="mt-1.5 text-sm text-slate-400">Access your harvest analytics and financial ledger.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@farm.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input px-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full min-h-[48px] text-base">
              <span>{loading ? 'Authenticating…' : 'Sign In to Portal'}</span>
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">Private farm operations portal. Authorized personnel only.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
