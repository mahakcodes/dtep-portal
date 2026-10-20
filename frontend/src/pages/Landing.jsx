import { Link } from 'react-router-dom'
import { GraduationCap, UserCheck, Settings, ArrowRight, BookMarked } from 'lucide-react'

const roles = [
  {
    key: 'student',
    Icon: GraduationCap,
    title: 'Student',
    subtext: 'Take tests, review results, track progress',
    href: '/login?role=student',
    accent: {
      bg: 'from-olive-50 to-white',
      ring: 'hover:border-olive-400/60',
      dot: 'bg-olive-400',
      chip: 'bg-olive-50 text-olive-500 border-olive-400/20',
      icon: 'bg-olive-400/15 text-olive-500 group-hover:bg-olive-400 group-hover:text-cream-100',
      btn: 'bg-charcoal-300 text-cream-100 hover:bg-charcoal-400',
    },
  },
  {
    key: 'evaluator',
    Icon: UserCheck,
    title: 'Evaluator / Teacher',
    subtext: 'Design assessments, grade submissions, publish outcomes',
    href: '/login?role=evaluator',
    accent: {
      bg: 'from-terracotta-50 to-white',
      ring: 'hover:border-terracotta-400/50',
      dot: 'bg-terracotta-400',
      chip: 'bg-terracotta-50 text-terracotta-400 border-terracotta-400/20',
      icon: 'bg-terracotta-400/15 text-terracotta-400 group-hover:bg-terracotta-400 group-hover:text-cream-100',
      btn: 'bg-charcoal-300 text-cream-100 hover:bg-charcoal-400',
    },
  },
  {
    key: 'admin',
    Icon: Settings,
    title: 'Administrator',
    subtext: 'Oversee cohorts, permissions, and program outcomes',
    href: '/login?role=admin',
    accent: {
      bg: 'from-beige-100/60 to-white',
      ring: 'hover:border-charcoal-200',
      dot: 'bg-charcoal-300',
      chip: 'bg-charcoal-300/[0.07] text-charcoal-300 border-charcoal-300/15',
      icon: 'bg-charcoal-300/15 text-charcoal-300 group-hover:bg-charcoal-300 group-hover:text-cream-100',
      btn: 'bg-charcoal-300 text-cream-100 hover:bg-charcoal-400',
    },
  },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-100 text-charcoal-300">
      {/* Very subtle background texture */}
      <div className="pointer-events-none absolute inset-0 bg-paper opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-olive-200/40 via-transparent to-transparent blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-beige-200/40 via-transparent to-transparent blur-3xl" aria-hidden />

      {/* ===== Minimal top nav ===== */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link
          to="/"
          className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-85"
          aria-label="DTEP home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-olive-400 shadow-soft-sm">
            <BookMarked className="h-5 w-5 text-cream-100" strokeWidth={1.75} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-xl font-semibold tracking-tight text-charcoal-300">DTEP</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal-50">
              Digital Test &amp; Evaluation Portal
            </span>
          </span>
        </Link>
      </header>

      {/* ===== Main ===== */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center px-6 pb-24 pt-8 lg:px-10 lg:pt-10">
        {/* Hero */}
        <div className="text-center animate-fade-in">
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-beige-200 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold text-charcoal-100 shadow-soft-sm backdrop-blur">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-olive-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-olive-400" />
            </span>
            Entry portal · Semester intake
          </p>

          <h1 className="mx-auto max-w-3xl font-serif text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.04] tracking-tight text-charcoal-300">
            Welcome to <span className="italic text-olive-500">DTEP.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-charcoal-100">
            A quiet, focused workspace for testing, evaluation, and academic review.
          </p>
        </div>

        {/* Role grid */}
        <div className="mt-14 grid gap-5 md:grid-cols-3 animate-fade-in-up">
          {roles.map((r, idx) => {
            const { Icon } = r
            return (
              <Link
                key={r.key}
                to={r.href}
                className={`group relative flex flex-col overflow-hidden rounded-4xl border border-beige-100 bg-gradient-to-br ${r.accent.bg} p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-2xl ${r.accent.ring}`}
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                {/* Corner decorative dot */}
                <span className="pointer-events-none absolute right-6 top-6 flex h-8 w-8 items-center justify-center">
                  <span className={`h-2 w-2 rounded-full ${r.accent.dot} opacity-80`} />
                </span>

                {/* Icon */}
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl transition-all duration-300 ${r.accent.icon}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>

                {/* Title / sub */}
                <div className="flex-1">
                  <h2 className="font-serif text-[1.6rem] font-semibold leading-tight tracking-tight text-charcoal-300">
                    {r.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-100">
                    {r.subtext}
                  </p>
                </div>

                {/* Chip + CTA */}
                <div className="mt-7 flex items-center justify-between gap-3 pt-2 border-t border-beige-100/80">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${r.accent.chip}`}>
                    Continue as
                  </span>
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:shadow-soft-lg ${r.accent.btn}`}>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Very fine footer line */}
        <div className="mt-20 flex items-center justify-between text-[11px] text-charcoal-50">
          <span>© {new Date().getFullYear()} DTEP · All sessions secured and auditable.</span>
          <span className="hidden sm:inline-flex">v2.4.0</span>
        </div>
      </main>
    </div>
  )
}
