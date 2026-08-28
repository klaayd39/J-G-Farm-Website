import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, ArrowRight, Lock, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        toast.success('Account created! Please check your email or log in.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-4">
      <div className="w-full max-w-md">
        {/* Farm Logo & Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-xl shadow-emerald-500/20">
            <Sparkles size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">J&G Farm Tracker</h1>
          <p className="mt-1 text-sm text-slate-400">Calamansi Harvest, Sales & Expense Management</p>
        </div>

        {/* Auth Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950/60 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                !isSignUp ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                isSignUp ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="owner@jgfarm.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In to Dashboard'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secured with Supabase Auth & PostgreSQL Row-Level Security
        </p>
      </div>
    </div>
  )
}
