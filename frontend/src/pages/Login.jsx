import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  UserCheck,
  Settings,
  BookMarked,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const roles = [
  { key: 'student', label: 'Student', Icon: GraduationCap },
  { key: 'evaluator', label: 'Evaluator', Icon: UserCheck },
  { key: 'admin', label: 'Admin', Icon: Settings },
]

export default function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const initialRole = useMemo(() => {
    const q = searchParams.get('role')
    return roles.some((r) => r.key === q) ? q : 'student'
  }, [searchParams])

  const [role, setRole] = useState(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const [apiError, setApiError] = useState('')

  // Set default email for admin or reset
  useEffect(() => {
    if (role === 'admin') setEmail('admin@test.com')
    else setEmail('')
    setPassword('')
    setTouched({ email: false, password: false })
    setErrors({ email: '', password: '' })
    setApiError('')
  }, [role])

  function validateEmail(v) {
    if (!v) return 'Email is required'
    return ''
  }
  function validatePassword(v) {
    if (!v) return 'Password is required'
    return ''
  }

  const emailError = touched.email ? validateEmail(email) : ''
  const passError = touched.password ? validatePassword(password) : ''
  const emailPristineOk = !emailError && email && validateEmail(email) === ''
  const passPristineOk = !passError && password && validatePassword(password) === ''
  const formValid = email.trim().length > 0 && password.trim().length > 0

  const roleTone = {
    student: {
      chip: 'bg-blue-50 text-blue-700 border-blue-200',
      activeBg: 'bg-blue-600 text-white shadow-sm',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
      focus: 'focus:ring-blue-500/30 focus:border-blue-500',
    },
    evaluator: {
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeBg: 'bg-blue-600 text-white shadow-sm',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
      focus: 'focus:ring-blue-500/30 focus:border-blue-500',
    },
    admin: {
      chip: 'bg-slate-100 text-slate-700 border-slate-200',
      activeBg: 'bg-blue-600 text-white shadow-sm',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
      focus: 'focus:ring-blue-500/30 focus:border-blue-500',
    },
  }[role]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    setErrors({ email: emailErr, password: passErr })
    setApiError('')

    if (!email.trim() || !password.trim()) {
      setApiError('Enter a username and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      const userObj = await login({
        email: email.trim(),
        password: password.trim(),
        remember,
      })

      if (userObj.role === 'student') navigate('/student')
      else if (userObj.role === 'admin') navigate('/admin')
      else navigate('/evaluator')
    } catch (err) {
      setApiError(err.message || 'Invalid credentials. Please check your username and password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[#F4F7FA] opacity-90" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/60 via-transparent to-transparent blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-200/60 via-transparent to-transparent blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-85">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm">
            <BookMarked className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">DTEP</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors duration-200 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Back
        </Link>
      </div>

      <main className="relative z-10 mx-auto flex max-w-[520px] flex-col items-stretch px-5 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md sm:rounded-3xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white sm:px-8">
            <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${roleTone.chip}`}>
              {roles.find((r) => r.key === role)?.Icon && (
                (() => {
                  const { Icon } = roles.find((r) => r.key === role)
                  return <Icon className="h-3 w-3" strokeWidth={1.75} />
                })()
              )}
              Signing in as {roles.find((r) => r.key === role)?.label}
            </span>
            <h1 className="mt-4 font-serif text-[1.9rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-[2.1rem]">
              Sign in to DTEP.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Enter your credentials below to access your workspace.
            </p>
          </div>

          <div className="p-7 sm:p-9">
            <div className="mb-7 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
              {roles.map((r) => {
                const { Icon } = r
                const active = role === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`group inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold transition-all duration-250 ${
                      active ? roleTone.activeBg : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {r.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4.5">
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Email address
                </span>
                <div className="relative">
                  <Mail className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${emailError ? 'text-rose-600' : emailPristineOk ? 'text-emerald-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@dtep.edu"
                    className={`w-full rounded-xl border bg-white px-10 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none focus:ring-2 ${
                      emailError
                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20'
                        : emailPristineOk
                        ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-500/20'
                        : `border-slate-200 hover:border-blue-200 ${roleTone.focus}`
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                    {emailError && <AlertCircle className="h-4 w-4 text-rose-600" strokeWidth={1.75} />}
                    {emailPristineOk && !emailError && <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />}
                  </span>
                </div>
                {emailError && (
                  <p className="mt-1.5 pl-1 text-[11px] text-rose-700 animate-fade-in">
                    {emailError}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Password
                  <a
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                    className="text-[11px] font-semibold normal-case tracking-normal text-slate-500 transition-colors duration-200 hover:text-slate-900"
                  >
                    Forgot password?
                  </a>
                </span>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${passError ? 'text-rose-600' : passPristineOk ? 'text-emerald-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-white px-10 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none focus:ring-2 ${
                      passError
                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20'
                        : passPristineOk
                        ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-500/20'
                        : `border-slate-200 hover:border-blue-200 ${roleTone.focus}`
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                  </button>
                </div>
                {passError && (
                  <p className="mt-1.5 pl-1 text-[11px] text-rose-700 animate-fade-in">
                    {passError}
                  </p>
                )}
              </label>

              <label className="flex cursor-pointer select-none items-center gap-2.5 pt-0.5">
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="h-4.5 w-4.5 rounded-[9px] border border-slate-300 bg-white transition-all duration-200 peer-checked:border-blue-600 peer-checked:bg-blue-600" />
                  <CheckCircle2 className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 scale-90 text-white opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100" strokeWidth={3} />
                </span>
                <span className="text-[12px] font-medium text-slate-600">
                  Remember me for 30 days
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !formValid}
                className={`group mt-1.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${roleTone.btn} hover:-translate-y-0.5`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Signing you in…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-[12px] text-slate-500">
              Institutional portal · Student and teacher accounts are provisioned by the Administrator.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Secured session · All activity is logged and auditable.
        </p>
      </main>
    </div>
  )
}
