import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  UserCheck,
  Settings,
  Building2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { MOCK_USER } from '../services/mockData.js'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const initialRole = searchParams.get('role') || 'student'
  const [role, setRole] = useState(initialRole)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', org: '' })
  const [showPass, setShowPass] = useState(false)
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const rules = {
    name: (v) => (!v ? 'Full name is required' : v.trim().split(/\s+/).length < 2 ? 'Please enter your full name' : ''),
    email: (v) => (!v ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : ''),
    password: (v) => (!v ? 'Password is required' : v.length < 8 ? 'Use 8+ characters' : ''),
    confirm: (v) => (!v ? 'Confirm your password' : v !== form.password ? 'Passwords do not match' : ''),
    org: (v) => (!v ? 'School / Organization is required' : ''),
  }

  useEffect(() => {
    setErrors((prev) => ({ ...prev, confirm: rules.confirm(form.confirm) }))
  }, [form.password])

  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    if (touched[k]) setErrors((prev) => ({ ...prev, [k]: rules[k](v) }))
  }
  const blurField = (k) => {
    setTouched((prev) => ({ ...prev, [k]: true }))
    setErrors((prev) => ({ ...prev, [k]: rules[k](form[k]) }))
  }

  const isFieldValid = (k) => touched[k] && !errors[k] && Boolean(form[k])
  const isFieldError = (k) => touched[k] && Boolean(errors[k])

  const allValid = Object.keys(rules).every((k) => !rules[k](form[k])) && terms

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newTouched = Object.fromEntries(Object.keys(rules).map((k) => [k, true]))
    setTouched(newTouched)
    const newErrors = Object.fromEntries(Object.keys(rules).map((k) => [k, rules[k](form[k])]))
    setErrors(newErrors)
    const hasError = Object.values(newErrors).some(Boolean) || !terms
    if (hasError) return
    setSubmitting(true)
    setStatus({ type: '', message: '' })
    await new Promise((r) => setTimeout(r, 900))

    const mock = MOCK_USER[role] || MOCK_USER.student
    login({
      token: `mock_${role}_${Date.now()}`,
      user: { ...mock, name: form.name, email: form.email },
    })
    setStatus({ type: 'success', message: 'Account created. Redirecting…' })
    await new Promise((r) => setTimeout(r, 500))
    setSubmitting(false)
    if (role === 'evaluator' || role === 'admin') navigate('/evaluator')
    else navigate('/student')
  }

  const roleOptions = [
    { key: 'student', label: 'Student', Icon: GraduationCap, tone: 'olive' },
    { key: 'evaluator', label: 'Evaluator', Icon: UserCheck, tone: 'terracotta' },
    { key: 'admin', label: 'Administrator', Icon: Settings, tone: 'charcoal' },
  ]
  const toneClass = {
    olive: {
      ring: 'ring-olive-400/30 bg-olive-50 text-olive-500',
      btn: 'bg-olive-400 hover:bg-olive-500',
    },
    terracotta: {
      ring: 'ring-terracotta-400/30 bg-terracotta-50 text-terracotta-400',
      btn: 'bg-terracotta-400 hover:bg-terracotta-500',
    },
    charcoal: {
      ring: 'ring-charcoal-300/20 bg-cream-200 text-charcoal-300',
      btn: 'bg-charcoal-300 hover:bg-charcoal-400',
    },
  }[roleOptions.find((r) => r.key === role)?.tone || 'olive']

  const strength = (() => {
    const p = form.password
    if (!p) return { label: '', score: 0, bars: 0, tone: '' }
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    const map = [
      { label: 'Too short', bars: 1, tone: 'bg-terracotta-400', text: 'text-terracotta-400' },
      { label: 'Weak', bars: 1, tone: 'bg-terracotta-400', text: 'text-terracotta-400' },
      { label: 'Fair', bars: 2, tone: 'bg-beige-300', text: 'text-charcoal-100' },
      { label: 'Good', bars: 3, tone: 'bg-olive-300', text: 'text-olive-400' },
      { label: 'Strong', bars: 4, tone: 'bg-olive-400', text: 'text-olive-500' },
    ]
    return { label: 'Password strength: ' + map[s].label, ...map[s] }
  })()

  const Field = ({ id, k, label, type = 'text', placeholder, Icon, autoComplete, rightSlot, extra }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-100">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 transition-colors duration-200 ${
              isFieldError(k) ? 'text-terracotta-400' : isFieldValid(k) ? 'text-olive-500' : 'text-charcoal-50'
            }`}
            strokeWidth={1.75}
          />
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={form[k]}
          onChange={(e) => setField(k, e.target.value)}
          onBlur={() => blurField(k)}
          className={`w-full h-12 rounded-2xl border ${Icon ? 'pl-11' : 'pl-4'} ${rightSlot ? 'pr-11' : 'pr-4'} text-sm text-charcoal-300 placeholder:text-charcoal-50 bg-white transition-all duration-200 outline-none ${
            isFieldError(k)
              ? 'border-terracotta-400/60 focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-400/20'
              : isFieldValid(k)
              ? 'border-olive-400/60 focus:border-olive-400 focus:ring-2 focus:ring-olive-400/20'
              : 'border-beige-200 focus:border-olive-400 focus:ring-2 focus:ring-olive-400/20 hover:border-beige-300'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {rightSlot}
          {touched[k] && !rightSlot && isFieldValid(k) && (
            <CheckCircle2 className="h-4.5 w-4.5 text-olive-500" strokeWidth={1.75} />
          )}
          {isFieldError(k) && (
            <AlertCircle className="h-4.5 w-4.5 text-terracotta-400" strokeWidth={1.75} />
          )}
        </div>
      </div>
      {extra}
      <div className="h-4">
        {isFieldError(k) && (
          <p className="animate-fade-in text-xs text-terracotta-400 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" strokeWidth={2} /> {errors[k]}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-300">
      <div className="min-h-screen grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden lg:block overflow-hidden bg-olive-500">
          <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-gradient-to-br from-cream-100/20 to-transparent blur-3xl" aria-hidden />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-gradient-to-br from-terracotta-400/30 to-transparent blur-3xl" aria-hidden />
          <div className="relative h-full flex flex-col justify-between p-14 text-cream-100">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-50 text-olive-500 transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="h-5.5 w-5.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 18L13 6L18 18H8Z" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="leading-none">
                <p className="font-serif text-xl font-semibold tracking-tight">DTEP</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-cream-100/70 mt-0.5">Digital Test &amp; Evaluation</p>
              </div>
            </Link>

            <div className="max-w-md space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cream-100/80">Create account</p>
              <h1 className="font-serif text-[2.75rem] leading-[1.05] tracking-tight">
                A single place for every
                <span className="italic text-cream-50/80"> test, score, and insight.</span>
              </h1>
              <blockquote className="border-l-2 border-cream-100/30 pl-5 text-beige-50/90 italic leading-relaxed font-serif text-lg">
                &ldquo;DTEP replaced three different systems at our department. Setup took a day; the time savings are immeasurable.&rdquo;
              </blockquote>
              <p className="text-sm text-cream-100/80">
                — Dr. Priya Natarajan, Senior Evaluator · Department of Computer Science
              </p>
            </div>

            <p className="text-xs text-cream-100/60">By creating an account you agree to our Terms &amp; Privacy Policy.</p>
          </div>
        </div>

        <div className="flex flex-col bg-paper">
          <div className="flex items-center justify-between px-6 py-5 lg:px-12 lg:py-7">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-100 transition-colors duration-200 hover:text-charcoal-300 lg:hidden">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Back to home
            </Link>
            <p className="ml-auto text-sm text-charcoal-100">
              Already have an account?{' '}
              <Link to={`/login?role=${role}`} className="font-semibold text-olive-500 transition-colors duration-200 hover:text-olive-400">
                Sign in
              </Link>
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="animate-fade-in-up">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-400">Create account</p>
                <h2 className="mt-3 font-serif text-[2.25rem] leading-[1.05] font-semibold tracking-tight text-charcoal-300">
                  Let&apos;s get you set up.
                </h2>
                <p className="mt-3 text-sm text-charcoal-100">
                  Takes under a minute. No credit card required.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2.5 animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
                {roleOptions.map((opt) => {
                  const { Icon } = opt
                  const selected = role === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRole(opt.key)}
                      className={`group relative flex flex-col items-center gap-2 rounded-3xl border p-3.5 text-center transition-all duration-300 ${
                        selected
                          ? `bg-white border-transparent shadow-soft ring-2 ${toneClass.ring}`
                          : 'bg-cream-50/40 border-beige-100 hover:border-beige-200 hover:bg-cream-50'
                      }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-300 ${
                        selected ? toneClass.ring : 'bg-cream-200 text-charcoal-100'
                      }`}>
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                      </div>
                      <p className="text-[12.5px] font-semibold text-charcoal-300 leading-tight">{opt.label}</p>
                    </button>
                  )
                })}
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="name" k="name" label="Full name" placeholder="Aarav Sharma" Icon={User} autoComplete="name" />
                  <Field id="org" k="org" label="School / Org" placeholder="DTEP University" Icon={Building2} autoComplete="organization" />
                </div>
                <Field id="email" k="email" label="Email address" type="email" placeholder="you@dtep.edu" Icon={Mail} autoComplete="email" />
                <Field
                  id="password"
                  k="password"
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a password"
                  Icon={Lock}
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-charcoal-50 transition-colors duration-200 hover:bg-beige-50 hover:text-charcoal-300"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                  }
                  extra={
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              form.password && i <= strength.bars ? strength.tone : 'bg-beige-100'
                            }`}
                          />
                        ))}
                      </div>
                      {form.password && (
                        <p className={`text-[11px] font-medium ${strength.text}`}>{strength.label}</p>
                      )}
                    </div>
                  }
                />
                <Field id="confirm" k="confirm" label="Confirm password" type={showPass ? 'text' : 'password'} placeholder="Re-enter password" Icon={Lock} autoComplete="new-password" />

                <label className="pt-1 inline-flex items-start gap-3 text-sm text-charcoal-100 cursor-pointer select-none">
                  <span className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all duration-200 ${
                      terms ? 'bg-olive-400 border-olive-400' : 'bg-white border-beige-200 hover:border-beige-300'
                    }`}>
                      {terms && <CheckCircle2 className="h-3.5 w-3.5 text-cream-100" strokeWidth={3} />}
                    </span>
                  </span>
                  <span>
                    I agree to the <a href="#" className="font-semibold text-olive-500 hover:text-olive-400 transition-colors duration-200">Terms of Service</a> and <a href="#" className="font-semibold text-olive-500 hover:text-olive-400 transition-colors duration-200">Privacy Policy</a>.
                  </span>
                </label>

                {status.message && (
                  <div
                    className={`animate-fade-in rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${
                      status.type === 'success'
                        ? 'bg-olive-50 border-olive-400/30 text-olive-500'
                        : 'bg-terracotta-50 border-terracotta-400/30 text-terracotta-400'
                    }`}
                  >
                    {status.type === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                    )}
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`group mt-2 w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-semibold text-cream-100 transition-all duration-300 ${toneClass.btn} disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-soft-lg hover:-translate-y-0.5`}
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Creating your account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
