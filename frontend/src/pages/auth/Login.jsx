import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import Slogan from '../../components/Slogan'
import Spinner from '../../components/Spinner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/veriva-logo-white.svg" alt="VERIVA" className="inline-block w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-white">VERIVA</h1>
          <Slogan className="text-white mt-3" />
          <p className="text-brand-300 text-xs mt-3">University of Rwanda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading && <Spinner size={16} />} {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            VERIVA &copy; {new Date().getFullYear()} &mdash; University of Rwanda, CST
          </p>
        </div>
      </div>
    </div>
  )
}
