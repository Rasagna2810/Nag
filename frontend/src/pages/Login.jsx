import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Brain, Zap } from 'lucide-react'

 function Login() {
  const [email, setEmail] = useState('admin@acme.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">NBA Platform</div>
            <div className="text-xs text-slate-500 leading-none mt-0.5">Decision Intelligence</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
          <p className="text-slate-400 text-sm mb-6">Access your AI decision platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                className="input w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                className="input w-full"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-slate-500 text-center mb-2">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'admin@acme.com', label: 'Admin' },
                { email: 'sarah@acme.com', label: 'CSM' },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setPassword('demo1234') }}
                  className="text-xs bg-surface-3 border border-border rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:border-brand-500/50 transition-all text-left"
                >
                  <div className="font-medium text-slate-300">{u.label}</div>
                  <div className="text-slate-500">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Login