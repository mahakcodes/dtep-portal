import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  FileCheck2,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  User,
  PlayCircle,
  ChevronRight,
  Clock,
  Calendar,
  FileText,
  Trophy,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  Bookmark,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

function formatSeconds(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getGrade(pct) {
  if (pct >= 90) return { label: 'A+', tone: 'chip-success' }
  if (pct >= 80) return { label: 'A', tone: 'chip-success' }
  if (pct >= 70) return { label: 'B+', tone: 'chip-brass' }
  if (pct >= 60) return { label: 'B', tone: 'chip-slate' }
  return { label: 'C', tone: 'chip-error' }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const {
    user,
    logout,
    subjects,
    tests,
    submissions,
    getTestsForStudent,
    getSubmissionsForStudent,
  } = useAuth()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [activeTab, setActiveTab] = useState('upcoming')
  const [search, setSearch] = useState('')

  const studentId = user?.id
  const studentTests = useMemo(
    () => (studentId ? getTestsForStudent(studentId) : tests),
    [studentId, getTestsForStudent, tests]
  )
  const studentSubmissions = useMemo(
    () => (studentId ? getSubmissionsForStudent(studentId) : submissions),
    [studentId, getSubmissionsForStudent, submissions]
  )

  const subjectById = useMemo(() => {
    const map = {}
    subjects.forEach((s) => (map[s.id] = s))
    return map
  }, [subjects])

  const upcomingTests = useMemo(
    () => studentTests.filter((t) => t.status === 'scheduled' || t.status === 'active'),
    [studentTests]
  )

  const q = search.trim().toLowerCase()
  const filteredUpcoming = useMemo(() => {
    if (!q) return upcomingTests
    return upcomingTests.filter((t) => {
      const subj = subjectById[t.subjectId]
      return (
        t.title.toLowerCase().includes(q) ||
        (subj?.name || '').toLowerCase().includes(q) ||
        (subj?.code || '').toLowerCase().includes(q)
      )
    })
  }, [upcomingTests, q, subjectById])

  const filteredSubmissions = useMemo(() => {
    if (!q) return studentSubmissions
    return studentSubmissions.filter((s) => {
      const test = tests.find((t) => t.id === s.testId)
      const subj = test ? subjectById[test.subjectId] : null
      return (
        (s.test_title || '').toLowerCase().includes(q) ||
        (test?.title || '').toLowerCase().includes(q) ||
        (subj?.name || '').toLowerCase().includes(q) ||
        (subj?.code || '').toLowerCase().includes(q)
      )
    })
  }, [studentSubmissions, q, tests, subjectById])

  const stats = useMemo(() => {
    const completed = studentSubmissions.filter((s) => s.status === 'graded' || s.status === 'flagged' || s.status === 'needs_review')
    const totalCompleted = completed.length
    const avgScore = totalCompleted
      ? completed.reduce((sum, s) => sum + (s.percentage || (s.autoScore / s.maxScore) * 100), 0) / totalCompleted
      : 0
    const upcoming = upcomingTests.length
    const percentile = user?.stats?.percentile || 0
    return { totalCompleted, avgScore, upcoming, percentile }
  }, [studentSubmissions, upcomingTests, user])

  const sections = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'tests', label: 'My Tests', icon: FileCheck2 },
    { key: 'practice', label: 'Practice', icon: BookOpen },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-72 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-20 items-center gap-3 px-7 border-b border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Bookmark className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="leading-none">
            <p className="font-serif text-lg font-semibold tracking-tight text-slate-900">DTEP</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mt-0.5">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {sections.map((n) => {
            const Icon = n.icon
            const active = activeSection === n.key
            return (
              <button
                key={n.key}
                onClick={() => setActiveSection(n.key)}
                className={`nav-pill w-full text-left ${active ? 'nav-pill-active' : ''}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md hairline-border bg-ivory">
                <User className="h-5 w-5 text-ink" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{user?.name || 'Student'}</p>
                <p className="text-xs text-slate truncate mono-num">{user?.roll || '—'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md bg-ivory p-3 hairline-border">
                <p className="font-mono text-2xl font-semibold text-forest mono-num">{user?.stats?.streak || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate mt-0.5 font-semibold">Day Streak</p>
              </div>
              <div className="rounded-md bg-ivory p-3 hairline-border">
                <p className="font-mono text-2xl font-semibold text-ink mono-num">{stats.percentile}<span className="text-sm">th</span></p>
                <p className="text-[10px] uppercase tracking-wider text-slate mt-0.5 font-semibold">Percentile</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold text-slate transition-colors duration-200 hover:bg-ivory hover:text-error hairline-border"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 items-center justify-between gap-4 px-6 lg:px-10">
            <div className="flex flex-1 items-center gap-4 max-w-xl">
              <div className="lg:hidden flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest">
                  <Bookmark className="h-5 w-5 text-paper" strokeWidth={1.75} />
                </div>
                <span className="font-serif text-lg font-semibold text-ink">DTEP</span>
              </div>
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate" strokeWidth={1.75} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests, subjects, past results…"
                  className="input-base pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3 rounded-md py-1 pr-2 pl-1 transition-colors duration-200 hover:bg-ivory cursor-pointer hairline-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-xs font-semibold text-paper">
                  {user?.avatarInitials || (user?.name ? user.name.split(' ').map((w) => w[0]).join('') : 'U')}
                </div>
                <div className="text-left leading-none">
                  <p className="text-sm font-semibold text-ink">{(user?.name || 'Student').split(' ')[0]}</p>
                  <p className="text-[10px] capitalize text-slate mt-0.5">Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-none px-6 py-10 lg:px-10 lg:py-12 space-y-10">
          {activeSection === 'dashboard' && (
            <DashboardView
              stats={stats}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filteredUpcoming={filteredUpcoming}
              filteredSubmissions={filteredSubmissions}
              subjectById={subjectById}
              user={user}
              navigate={navigate}
              q={q}
            />
          )}
          {activeSection === 'tests' && (
            <TestsView
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filteredUpcoming={filteredUpcoming}
              filteredSubmissions={filteredSubmissions}
              subjectById={subjectById}
              navigate={navigate}
            />
          )}
          {activeSection === 'practice' && (
            <PracticeView navigate={navigate} subjects={subjects} />
          )}
          {activeSection === 'reports' && (
            <ReportsView
              submissions={studentSubmissions}
              subjectById={subjectById}
              tests={tests}
              stats={stats}
              user={user}
            />
          )}
          {activeSection === 'settings' && (
            <SettingsView user={user} logout={logout} />
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardView({ stats, activeTab, setActiveTab, filteredUpcoming, filteredSubmissions, subjectById, user, navigate, q }) {
  const tabs = [
    { key: 'upcoming', label: 'Upcoming / Active', count: filteredUpcoming.length },
    { key: 'completed', label: 'Past Tests', count: filteredSubmissions.length },
    { key: 'analysis', label: 'Performance Analysis' },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-tick">Dashboard</span>
          <h1 className="mt-3 font-serif text-h1 font-semibold tracking-tight text-ink">
            Hi {(user?.name || 'Student').split(' ')[0]}, <span className="italic text-forest">let&apos;s keep the streak.</span>
          </h1>
          <p className="mt-2.5 text-sm text-slate">
            You have <span className="font-semibold text-error">{stats.upcoming} scheduled test{stats.upcoming !== 1 ? 's' : ''}</span> and{' '}
            <span className="font-semibold text-ink">{stats.totalCompleted} completed</span> this semester.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/take-test/t_cs301_mid')}
            className="btn-primary"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
            Start practice test
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ivory hairline-border">
          <User className="h-5 w-5 text-forest" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">Assigned teacher</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {user?.assigned_teacher?.full_name || user?.assigned_teacher?.username || 'Not assigned yet'}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tests completed"
          value={`${stats.totalCompleted}`}
          sub={`Avg ${stats.avgScore.toFixed(1)}% across ${stats.totalCompleted || 0} graded test${stats.totalCompleted !== 1 ? 's' : ''}`}
          accent="ink"
          Icon={Trophy}
        />
        <StatCard
          label="Average score"
          value={`${stats.avgScore.toFixed(1)}%`}
          sub="Weighted by marks, updated today"
          accent="forest"
          Icon={TrendingUp}
        />
        <StatCard
          label="Scheduled"
          value={`${stats.upcoming}`}
          sub={stats.upcoming === 1 ? '1 test requires action' : `${stats.upcoming} tests scheduled this window`}
          accent="brass"
          Icon={Calendar}
        />
        <StatCard
          label="Class percentile"
          value={`${stats.percentile}th`}
          sub={`Top ${100 - stats.percentile}% of your cohort`}
          accent="forest"
          Icon={Target}
        />
      </div>

      {q && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate">
            Search results for <span className="text-ink mono">&ldquo;{q}&rdquo;</span> · {filteredUpcoming.length + filteredSubmissions.length} found
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-1 rounded-md hairline-border bg-ivory p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeTab === t.key
                    ? 'bg-ink text-paper'
                    : 'text-slate hover:text-ink hover:bg-paper'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-md text-[10px] font-bold ${
                      activeTab === t.key ? 'bg-paper/20 text-paper' : 'bg-paper text-slate hairline-border'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'upcoming' && <UpcomingTests tests={filteredUpcoming} subjectById={subjectById} navigate={navigate} />}
        {activeTab === 'completed' && <PastTestsTable submissions={filteredSubmissions} tests={[]} navigate={navigate} />}
        {activeTab === 'analysis' && <PerformanceAnalysis submissions={filteredSubmissions} subjectById={subjectById} tests={[]} stats={stats} user={user} />}
      </div>
    </div>
  )
}

function TestsView({ activeTab, setActiveTab, filteredUpcoming, filteredSubmissions, subjectById, navigate }) {
  const tabs = [
    { key: 'upcoming', label: 'Upcoming / Active', count: filteredUpcoming.length },
    { key: 'completed', label: 'Past Tests', count: filteredSubmissions.length },
  ]
  return (
    <div className="space-y-10">
      <div>
        <span className="section-tick">Assessment Directory</span>
        <h1 className="mt-3 font-serif text-h1 font-semibold tracking-tight text-ink">
          My <span className="italic text-forest">tests</span> &amp; submissions
        </h1>
        <p className="mt-2.5 text-sm text-slate">
          Browse scheduled assessments, active quizzes, and your graded history.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-md hairline-border bg-ivory p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeTab === t.key ? 'bg-ink text-paper' : 'text-slate hover:text-ink hover:bg-paper'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-md text-[10px] font-bold ${
                  activeTab === t.key ? 'bg-paper/20 text-paper' : 'bg-paper text-slate hairline-border'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'upcoming' && <UpcomingTests tests={filteredUpcoming} subjectById={subjectById} navigate={navigate} />}
      {activeTab === 'completed' && <PastTestsTable submissions={filteredSubmissions} subjectById={subjectById} tests={[]} navigate={navigate} />}
    </div>
  )
}

function PracticeView({ navigate, subjects }) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-tick">Practice Bank</span>
          <h1 className="mt-3 font-serif text-h1 font-semibold tracking-tight text-ink">
            Self-paced <span className="italic text-forest">practice</span> tests
          </h1>
          <p className="mt-2.5 text-sm text-slate">
            Timed practice sessions with per-question feedback. No grading, no ranking.
          </p>
        </div>
        <button
          onClick={() => navigate('/take-test/t_cs301_mid')}
          className="btn-primary"
        >
          <Zap className="h-4 w-4" strokeWidth={1.75} />
          Start Practice Test
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className="card-paper p-6 transition-all hover:shadow-subtle">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md hairline-border bg-ivory">
                <BookOpen className="h-5.5 w-5.5 text-forest" strokeWidth={1.75} />
              </div>
              <span className="chip-forest">Practice</span>
            </div>
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate mono">{s.code}</p>
              <h4 className="mt-1 font-serif text-xl font-semibold text-ink leading-tight">{s.name}</h4>
              <p className="mt-2 text-xs text-slate leading-relaxed">
                {s.department} · Topic review set · 12 questions
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate mono">30 min</span>
              <button
                onClick={() => navigate('/take-test/t_cs301_mid')}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-forest/5"
              >
                Begin <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportsView({ submissions, subjectById, tests, stats, user }) {
  return (
    <div className="space-y-10">
      <div>
        <span className="section-tick">Performance Reports</span>
        <h1 className="mt-3 font-serif text-h1 font-semibold tracking-tight text-ink">
          Reports &amp; <span className="italic text-forest">analytics</span>
        </h1>
        <p className="mt-2.5 text-sm text-slate">
          Per-subject breakdowns, grade trends, and cohort comparisons.
        </p>
      </div>

      <PerformanceAnalysis
        submissions={submissions}
        subjectById={subjectById}
        tests={tests}
        stats={stats}
        user={user}
      />
    </div>
  )
}

function SettingsView({ user, logout }) {
  return (
    <div className="space-y-10">
      <div>
        <span className="section-tick">Account Settings</span>
        <h1 className="mt-3 font-serif text-h1 font-semibold tracking-tight text-ink">
          Profile &amp; <span className="italic text-forest">preferences</span>
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="card-paper p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-hairline">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-forest text-sm font-semibold text-paper">
              {user?.avatarInitials || (user?.name ? user.name.split(' ').map((w) => w[0]).join('') : 'U')}
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-ink">Student Profile</h3>
              <p className="text-xs text-slate mt-0.5">Academic record identifiers</p>
            </div>
          </div>
          <Field label="Full name" value={user?.name || '—'} />
          <Field label="Email" value={user?.email || '—'} />
          <Field label="Program" value={user?.program || '—'} />
          <Field label="Roll number" value={user?.roll || '—'} mono />
          <Field label="Joined" value={user?.joined || '—'} />
        </div>

        <div className="space-y-5">
          <div className="card-paper p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-hairline">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ivory hairline-border">
                <Settings className="h-5.5 w-5.5 text-slate" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-ink">Session</h3>
                <p className="text-xs text-slate mt-0.5">Authentication &amp; access</p>
              </div>
            </div>
            <button onClick={logout} className="btn-secondary w-full justify-start">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Sign out of DTEP
            </button>
          </div>

          <div className="card-paper p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-hairline">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ivory hairline-border">
                <Target className="h-5.5 w-5.5 text-forest" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-ink">Statistics</h3>
                <p className="text-xs text-slate mt-0.5">Current cumulative record</p>
              </div>
            </div>
            <Field label="Tests taken" value={`${user?.stats?.testsTaken || 0}`} mono />
            <Field label="Average score" value={`${(user?.stats?.avgScore || 0).toFixed(1)}%`} mono />
            <Field label="Percentile" value={`${user?.stats?.percentile || 0}th`} mono />
            <Field label="Day streak" value={`${user?.stats?.streak || 0} days`} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{label}</p>
      <p className={`mt-1 text-sm font-medium text-ink ${mono ? 'mono-num' : ''}`}>{value}</p>
    </div>
  )
}

function StatCard({ label, value, sub, accent, Icon }) {
  const tone =
    accent === 'forest'
      ? 'text-blue-700 bg-blue-50'
      : accent === 'brass'
      ? 'text-amber-700 bg-amber-50'
      : accent === 'error'
      ? 'text-rose-700 bg-rose-50'
      : 'text-slate-900 bg-slate-50'
  return (
    <div className="card-paper p-6">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-md hairline-border ${tone}`}>
          <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{label}</p>
      <p className="mt-1.5 font-mono text-4xl font-semibold tracking-tight text-ink mono-num">{value}</p>
      <p className="mt-2 text-xs text-slate leading-relaxed">{sub}</p>
    </div>
  )
}

function UpcomingTests({ tests, subjectById, navigate }) {
  if (!tests.length) {
    return (
      <div className="card-paper p-12 text-center">
        <Search className="h-8 w-8 mx-auto text-slate" strokeWidth={1.5} />
        <p className="mt-4 font-serif text-lg font-semibold text-ink">No tests match your search</p>
        <p className="mt-1 text-sm text-slate">Try a different title, subject, or code</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {tests.map((t) => {
        const subj = subjectById[t.subjectId] || {}
        const isActive = t.status === 'active'
        const isUrgent = t.status === 'scheduled'
        return (
          <div key={t.id} className="card-paper p-7 transition-colors hover:bg-paper">
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md hairline-border bg-ivory">
                    <FileText className="h-6 w-6 text-forest" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate mono">{subj.code || t.subjectId}</span>
                      <span className={isActive ? 'chip-success' : 'chip-brass'}>
                        {isActive ? 'Available now' : 'Scheduled'}
                      </span>
                    </div>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-ink truncate pr-1">{t.title}</h3>
                  </div>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-md bg-ivory p-3 hairline-border">
                  <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Duration</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-ink mono-num">{t.duration_minutes}<span className="text-[11px] text-slate ml-1">min</span></dd>
                </div>
                <div className="rounded-md bg-ivory p-3 hairline-border">
                  <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Questions</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-ink mono-num">{t.totalQuestions}</dd>
                </div>
                <div className="rounded-md bg-ivory p-3 hairline-border">
                  <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Marks</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-ink mono-num">{t.totalMarks}</dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center gap-3 text-xs text-slate">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
                <span className="mono-num">{t.scheduledAt || t.startedAt || '—'}</span>
                <span className="text-hairline">·</span>
                <Clock className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
                <span className="mono-num">{t.windowCloses || t.expiresAt || '—'}</span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                    <PlayCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Resume anytime
                  </span>
                ) : isUrgent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brass">
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Remember to revise
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate">
                    <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Bookmarked
                  </span>
                )}
                <button
                  onClick={() => navigate('/take-test/' + t.id)}
                  className="ml-auto inline-flex items-center gap-2 rounded-md px-4.5 py-2.5 text-xs font-semibold transition-all duration-200 bg-ink text-paper hover:bg-[#0e1017]"
                >
                  {isActive ? 'Resume test' : 'Start test'}
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PastTestsTable({ submissions, tests: _tests, navigate }) {
  if (!submissions.length) {
    return (
      <div className="card-paper p-12 text-center">
        <FileCheck2 className="h-8 w-8 mx-auto text-slate" strokeWidth={1.5} />
        <p className="mt-4 font-serif text-lg font-semibold text-ink">No past submissions yet</p>
        <p className="mt-1 text-sm text-slate">Completed tests will appear here with scores and feedback</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden card-paper">
      <div className="flex items-center justify-between px-7 py-6 border-b border-hairline">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-ink">Past tests &amp; scores</h3>
          <p className="mt-1 text-sm text-slate">Graded results with per-question feedback and ranking</p>
        </div>
        <span className="chip-forest">
          <Trophy className="h-3.5 w-3.5" strokeWidth={1.75} />
          {submissions.length} graded
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table-academic">
          <thead>
            <tr>
              <th>Test</th>
              <th>Submitted</th>
              <th className="text-right">Score</th>
              <th>Grade</th>
              <th>Percentile</th>
              <th>Class Rank</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const pct = s.percentage || (s.autoScore / s.maxScore) * 100
              const grade = getGrade(pct)
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3 min-w-[280px]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md hairline-border bg-ivory">
                        <Trophy className="h-5 w-5 text-brass" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{s.test_title || s.testId}</p>
                        <p className="text-xs text-slate mt-0.5 flex items-center gap-1.5">
                          ID <span className="mono-num">{s.id}</span> · Graded by <span className="font-medium text-ink">{s.gradedBy || 'Auto-graded'}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-ink mono-num">{s.submittedAt}</div>
                    <div className="text-xs text-slate mono-num mt-0.5">{formatSeconds(s.timeTakenSeconds || 0)}</div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <div className="w-24 h-1.5 overflow-hidden rounded-md bg-hairline">
                        <div
                          className={`h-full rounded-md ${pct >= 80 ? 'bg-success' : pct >= 70 ? 'bg-brass' : 'bg-error'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-base font-semibold text-ink tabular-nums w-20 text-right mono-num">
                        {s.autoScore}<span className="text-xs text-slate">/{s.maxScore}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold ${grade.tone}`}>
                      {pct >= 80 ? (
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      ) : pct >= 60 ? (
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                      {grade.label}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {pct >= (s.percentile || 50) ? (
                        <TrendingUp className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-error" strokeWidth={1.75} />
                      )}
                      <span className="font-mono text-base font-semibold text-ink tabular-nums mono-num">
                        {s.percentile || 0}<span className="text-xs text-slate">th</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="mono-num font-semibold text-ink">#{s.rank || 0}</span>
                    <span className="text-slate"> / {s.classSize || 0}</span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => navigate('/result/' + s.id)}
                      className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold text-slate transition-colors hover:bg-forest/5 hover:text-forest hairline-border"
                    >
                      View review
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PerformanceAnalysis({ submissions, subjectById, tests: _tests, stats, user }) {
  const bySubject = useMemo(() => {
    const map = {}
    submissions.forEach((s) => {
      const pct = s.percentage || (s.autoScore / s.maxScore) * 100
      const key = s.testId || 'unknown'
      if (!map[key]) map[key] = { total: 0, count: 0, subjectId: null, label: s.test_title || key }
      map[key].total += pct
      map[key].count += 1
    })
    const result = []
    Object.keys(map).forEach((k) => {
      result.push({
        key: k,
        label: map[k].label,
        avg: map[k].total / map[k].count,
      })
    })
    if (result.length === 0) {
      Object.keys(subjectById).slice(0, 5).forEach((sid, i) => {
        result.push({
          key: sid,
          label: subjectById[sid]?.name || sid,
          code: subjectById[sid]?.code || sid,
          avg: [88, 82, 76, 90, 71][i],
        })
      })
    }
    return result
  }, [submissions, subjectById])

  const target = 85
  const completedAvg = stats.avgScore

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card-paper p-7">
        <div className="flex items-center justify-between">
          <div>
            <span className="section-tick">Subject breakdown</span>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">Performance by subject</h3>
            <p className="mt-1 text-sm text-slate">Average score across completed assessments</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate mono">Semester 6</span>
        </div>
        <div className="mt-8 space-y-5">
          {bySubject.slice(0, 6).map((r) => {
            const v = Math.round(r.avg)
            const barColor = v >= 85 ? 'bg-success' : v >= 75 ? 'bg-brass' : 'bg-error'
            return (
              <div key={r.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {r.code && <span className="text-xs font-semibold uppercase tracking-wider text-slate mono">{r.code}</span>}
                    <span className="font-medium text-ink truncate">{r.label}</span>
                  </div>
                  <span className="font-mono text-base font-semibold tabular-nums text-ink mono-num">{v}<span className="text-xs text-slate">%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-md bg-ivory hairline-border">
                  <div
                    className={`h-full rounded-md ${barColor}`}
                    style={{ width: `${Math.min(100, v)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card-paper p-7 bg-forest/5">
          <span className="section-tick">Semester goal</span>
          <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">Target: 85%+</h3>
          <p className="mt-1 text-sm text-slate">Overall across all subjects this term</p>
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-5xl font-semibold tracking-tight text-forest mono-num">{completedAvg.toFixed(1)}%</span>
              <span className="text-xs font-semibold text-slate mono-num">Target: {target}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-md bg-ivory hairline-border">
              <div
                className="h-full rounded-md bg-forest"
                style={{ width: `${Math.min(100, (completedAvg / target) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate mono-num">
              {Math.max(0, (target - completedAvg)).toFixed(1)} percentage points to go.
            </p>
          </div>
        </div>

        <div className="card-paper p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-error/5 text-error hairline-border">
              <Target className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-xl font-semibold text-ink">Focus areas</h4>
              <p className="text-sm text-slate mt-0.5">Topics to practice before your next test</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {[
              { subj: 'DSA', topic: 'Graph algorithms — shortest paths', gap: '-12%' },
              { subj: 'DBMS', topic: 'Normal forms 3NF vs BCNF', gap: '-8%' },
              { subj: 'OS', topic: 'Deadlock detection & recovery', gap: '-5%' },
            ].map((r) => (
              <li key={r.topic} className="flex items-center justify-between rounded-md bg-ivory px-4 py-3 transition-colors hover:bg-ivory/80 cursor-pointer hairline-border">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate bg-paper px-2 py-0.5 rounded-md hairline-border mono">{r.subj}</span>
                  <span className="text-sm font-medium text-ink truncate">{r.topic}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-error mono-num">
                  {r.gap}
                  <ChevronRight className="h-3.5 w-3.5 text-slate transition-colors" strokeWidth={1.75} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-paper p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-forest/5 text-forest hairline-border">
              <Zap className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-xl font-semibold text-ink">Cumulative record</h4>
              <p className="text-sm text-slate mt-0.5">Academic standing snapshot</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-ivory p-4 hairline-border">
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Streak</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-ink mono-num">{user?.stats?.streak || 0}<span className="text-xs text-slate ml-1">days</span></dd>
            </div>
            <div className="rounded-md bg-ivory p-4 hairline-border">
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Tests taken</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-ink mono-num">{user?.stats?.testsTaken || 0}</dd>
            </div>
            <div className="rounded-md bg-ivory p-4 hairline-border">
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Avg score</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-forest mono-num">{(user?.stats?.avgScore || 0).toFixed(1)}%</dd>
            </div>
            <div className="rounded-md bg-ivory p-4 hairline-border">
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-slate">Percentile</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-ink mono-num">{user?.stats?.percentile || 0}<span className="text-xs text-slate ml-1">th</span></dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
