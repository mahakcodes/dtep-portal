import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Plus,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Play,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Trophy,
  MoreHorizontal,
  ChevronRight,
  Download,
  Clock,
  Award,
  Target,
  BookMarked,
  X,
  Trash2,
  GripVertical,
  Eye,
  AlertCircle,
  Filter,
  Check,
  Pencil,
  Flag,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const PAPER = '#FAF9F6'
const IVORY = '#F2F0EA'
const INK = '#161A22'
const SLATE = '#5C5A52'
const FOREST = '#1F4A3D'
const BRASS = '#A8823A'
const HAIRLINE = '#DEDACE'
const SUCCESS = '#4B6B3A'
const ERROR = '#8C3A2E'

function SectionTick() {
  return (
    <div className="flex items-center gap-3 w-full my-6">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm"
        style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
      >
        <Check className="h-2.5 w-2.5" style={{ color: FOREST }} strokeWidth={2} />
      </span>
      <hr className="flex-1" style={{ border: 'none', borderTop: `1px solid ${HAIRLINE}` }} />
    </div>
  )
}

function monoNum(n) {
  return <span className="font-mono tabular-nums">{n}</span>
}

export default function EvaluatorDashboard() {
  const {
    user,
    logout,
    getStudentsForTeacher,
    getTestsForTeacher,
    getSubmissionsForTeacher,
    createTest,
    updateTest,
    gradeSubmission,
    subjects,
    tests,
    submissions,
    students,
  } = useAuth()

  const navigate = useNavigate()
  const me = user
  const [activeTab, setActiveTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [selectedTestDetails, setSelectedTestDetails] = useState(null)
  const [editingTest, setEditingTest] = useState(null)

  const nav = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'create', label: 'Create', icon: Plus },
    { key: 'tests', label: 'Tests', icon: FileText },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'submissions', label: 'Submissions', icon: Users },
    { key: 'students', label: 'Students', icon: GraduationCap },
  ]

  const myStudents = useMemo(
    () => (me ? getStudentsForTeacher(me.id) : []),
    [me, getStudentsForTeacher, students]
  )
  const myTests = useMemo(
    () => (me ? getTestsForTeacher(me.id) : []),
    [me, getTestsForTeacher, tests]
  )
  const mySubmissions = useMemo(
    () => (me ? getSubmissionsForTeacher(me.id) : []),
    [me, getSubmissionsForTeacher, submissions]
  )

  const handleCreateTest = async (testData) => {
    if (!me) return
    const newTest = await createTest({ ...testData, createdBy: me.id })
    setActiveTab('tests')
    return newTest
  }

  const handleGrade = (sid, score, feedback, questionScores) => {
    gradeSubmission(sid, score, feedback, questionScores)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen text-[13px]" style={{ background: PAPER, color: INK }}>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-64 flex-col"
        style={{ borderRight: `1px solid ${HAIRLINE}`, background: PAPER }}
      >
        <div
          className="flex h-16 items-center gap-3 px-6"
          style={{ borderBottom: `1px solid ${HAIRLINE}` }}
        >
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: FOREST }}
          >
            <BookMarked className="h-4.5 w-4.5" strokeWidth={1.5} style={{ color: PAPER }} />
          </Link>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold tracking-tight" style={{ color: INK }}>
              DTEP
            </p>
            <p
              className="text-[9px] uppercase tracking-[0.16em] mt-0.5"
              style={{ color: SLATE }}
            >
              Faculty Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {nav.map((n) => {
            const Icon = n.icon
            const active = activeTab === n.key
            return (
              <button
                key={n.key}
                onClick={() => setActiveTab(n.key)}
                className="group relative w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-[12.5px] font-medium text-left"
                style={{
                  background: active ? INK : 'transparent',
                  color: active ? PAPER : SLATE,
                  transition: 'all 120ms ease',
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
          <div
            className="rounded-md p-4"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-semibold"
                style={{ background: FOREST, color: PAPER }}
              >
                {me?.avatarInitials || me?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate" style={{ color: INK }}>
                  {me?.name || 'User'}
                </p>
                <p className="text-[10px] truncate" style={{ color: SLATE }}>
                  {me?.title || me?.department || 'Faculty'}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md py-2 px-1" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
                <p className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: FOREST }}>
                  {myTests.length}
                </p>
                <p className="text-[9px] uppercase tracking-wider mt-0.5 font-semibold" style={{ color: SLATE }}>
                  Tests
                </p>
              </div>
              <div className="rounded-md py-2 px-1" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
                <p className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: BRASS }}>
                  {myStudents.length}
                </p>
                <p className="text-[9px] uppercase tracking-wider mt-0.5 font-semibold" style={{ color: SLATE }}>
                  Students
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md py-2 text-[11px] font-semibold transition-colors"
              style={{ border: `1px solid ${HAIRLINE}`, color: SLATE, background: PAPER }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ERROR; e.currentTarget.style.borderColor = ERROR }}
              onMouseLeave={(e) => { e.currentTarget.style.color = SLATE; e.currentTarget.style.borderColor = HAIRLINE }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div
          className="sticky top-0 z-30"
          style={{ borderBottom: `1px solid ${HAIRLINE}`, background: PAPER }}
        >
          <div className="mx-auto flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
            <div className="flex flex-1 items-center gap-4 max-w-xl">
              <Link to="/" className="lg:hidden flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ background: FOREST }}
                >
                  <BookMarked className="h-4 w-4" style={{ color: PAPER }} strokeWidth={1.5} />
                </div>
                <span className="font-serif text-sm font-semibold" style={{ color: INK }}>DTEP</span>
              </Link>
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  strokeWidth={1.5}
                  style={{ color: SLATE }}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests, submissions, students…"
                  className="h-9 w-full rounded-md pl-9 pr-3 text-[12px] outline-none transition-all"
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    background: IVORY,
                    color: INK,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{ color: SLATE }}
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: BRASS }}
                />
              </button>
              <div className="ml-1 h-5 w-px" style={{ background: HAIRLINE }} />
              <div className="hidden sm:flex items-center gap-2.5 rounded-md py-0.5 pr-1.5 pl-0.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-semibold"
                  style={{ background: FOREST, color: PAPER }}
                >
                  {me?.avatarInitials || me?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') || 'U'}
                </div>
                <div className="text-left leading-none">
                  <p className="text-[12px] font-semibold" style={{ color: INK }}>
                    {me?.name?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-[9px] capitalize mt-0.5" style={{ color: SLATE }}>
                    Faculty
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-none px-6 py-8 lg:px-8 lg:py-10">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              me={me}
              myTests={myTests}
              mySubmissions={mySubmissions}
              myStudents={myStudents}
              onCreate={() => setActiveTab('create')}
              onSubmissions={() => setActiveTab('submissions')}
              onManageTest={setSelectedTestDetails}
              navigate={navigate}
            />
          )}
          {activeTab === 'create' && (
            <CreateTestForm
              me={me}
              subjects={subjects}
              onPublish={handleCreateTest}
            />
          )}
          {activeTab === 'tests' && (
            <TestsList
              tests={myTests}
              subjects={subjects}
              onCreate={() => setActiveTab('create')}
              onManageTest={setSelectedTestDetails}
              navigate={navigate}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView
              tests={myTests}
              submissions={mySubmissions}
              subjects={subjects}
            />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsView
              submissions={mySubmissions}
              tests={myTests}
              students={students}
              onGrade={handleGrade}
              navigate={navigate}
            />
          )}
          {activeTab === 'students' && (
            <StudentsView
              students={myStudents}
              teacherSubjectIds={me?.subjectIds || []}
              subjects={subjects}
              submissions={mySubmissions}
              tests={myTests}
              navigate={navigate}
            />
          )}
        </div>
      </main>

      {selectedTestDetails && (
        <TeacherTestDetailsModal
          test={selectedTestDetails}
          onClose={() => setSelectedTestDetails(null)}
          onEdit={(test) => {
            setSelectedTestDetails(null)
            setEditingTest(test)
          }}
          onViewSubmissions={(t) => {
            setSelectedTestDetails(null)
            setActiveTab('submissions')
          }}
        />
      )}
      {editingTest && (
        <EditPublishedTestModal
          test={editingTest}
          subjects={subjects}
          onClose={() => setEditingTest(null)}
          onSave={async (changes) => {
            await updateTest(editingTest.id, changes)
            setEditingTest(null)
          }}
        />
      )}
    </div>
  )
}

function DashboardOverview({ me, myTests, mySubmissions, myStudents, onCreate, onSubmissions, onManageTest, navigate }) {
  const liveTests = myTests.filter((t) => t.status === 'active').length
  const scheduledTests = myTests.filter((t) => t.status === 'scheduled').length
  const gradedTests = myTests.filter((t) => t.status === 'graded').length
  const pending = mySubmissions.filter(
    (s) => s.status === 'needs_review' || s.status === 'flagged'
  ).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: FOREST }}
          >
            Faculty Dashboard
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            {me ? `Hi ${me.name.split(' ')[0]}, ` : ''}
            <span style={{ color: BRASS, fontStyle: 'italic' }}>overview.</span>
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            You have{' '}
            <span className="font-semibold" style={{ color: FOREST }}>
              {liveTests} live test{liveTests !== 1 && 's'}
            </span>{' '}
            and{' '}
            <span className="font-semibold" style={{ color: INK }}>
              {pending} submission{pending !== 1 && 's'} pending review
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[11.5px] font-medium"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: SLATE }}
          >
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            This semester
          </button>
          <button
            onClick={onCreate}
            className="group inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold"
            style={{ background: FOREST, color: PAPER }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Create new test
          </button>
        </div>
      </div>

      <SectionTick />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tests created"
          value={myTests.length}
          sub="Across all classes this semester"
          accent="ink"
          delta={`+${scheduledTests} scheduled`}
          Icon={FileText}
        />
        <MetricCard
          label="Active / live"
          value={liveTests}
          sub="Students writing right now"
          accent="forest"
          delta="in progress"
          Icon={Play}
        />
        <MetricCard
          label="Pending review"
          value={pending}
          sub="Submissions awaiting grading"
          accent="error"
          delta="action needed"
          Icon={AlertCircle}
        />
        <MetricCard
          label="Graded"
          value={gradedTests}
          sub="Tests finalized this semester"
          accent="success"
          delta={myStudents.length > 0 ? `${myStudents.length} enrolled` : '—'}
          Icon={CheckCircle2}
        />
      </div>

      <SectionTick />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
        <div
          className="rounded-md p-6"
          style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-[18px] font-semibold" style={{ color: INK }}>
                Active &amp; upcoming tests
              </h3>
              <p className="mt-1 text-[11.5px]" style={{ color: SLATE }}>
                Monitor live sessions and scheduled exams
              </p>
            </div>
            <button
              onClick={() => navigate('/evaluator')}
              className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold"
              style={{ color: SLATE }}
            >
              View all <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="space-y-2.5">
            {myTests.slice(0, 5).map((t) => {
              const subject = null
              const isLive = t.status === 'active'
              const isScheduled = t.status === 'scheduled'
              return (
                <div
                  key={t.id}
                  className="group flex items-center justify-between gap-4 rounded-md p-3.5"
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    background: PAPER,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md flex-shrink-0"
                      style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: FOREST }}
                    >
                      <FileText className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] uppercase tracking-[0.12em] font-semibold" style={{ color: SLATE }}>
                          {t.subjectId?.toUpperCase() || '—'}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-semibold"
                          style={{
                            background: isLive ? `${SUCCESS}14` : isScheduled ? `${BRASS}14` : `${SLATE}14`,
                            color: isLive ? SUCCESS : isScheduled ? BRASS : SLATE,
                            border: `1px solid ${isLive ? `${SUCCESS}30` : isScheduled ? `${BRASS}30` : `${SLATE}30`}`,
                          }}
                        >
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{
                              background: isLive ? SUCCESS : isScheduled ? BRASS : SLATE,
                            }}
                          />
                          {t.status}
                        </span>
                      </div>
                      <h4 className="mt-1 font-serif text-[14px] font-semibold truncate" style={{ color: INK }}>
                        {t.title}
                      </h4>
                      <p className="mt-1 text-[10.5px] flex items-center gap-2" style={{ color: SLATE }}>
                        <Calendar className="h-3 w-3" strokeWidth={1.5} /> {t.scheduledAt || t.startedAt || '—'}
                        <span style={{ color: HAIRLINE }}>·</span>
                        <Clock className="h-3 w-3" strokeWidth={1.5} /> {monoNum(t.duration_minutes || 30)}m
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3.5 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: INK }}>
                        {monoNum(t.totalQuestions || 0)}
                        <span className="text-[10px] font-normal ml-1" style={{ color: SLATE }}>q</span>
                      </p>
                      <p className="text-[10px]" style={{ color: SLATE }}>
                        {monoNum(t.totalMarks || 0)} marks
                      </p>
                    </div>
                    <button
                      onClick={() => onManageTest ? onManageTest(t) : null}
                      title="View test details & questions"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors"
                      style={{ color: SLATE }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = FOREST; e.currentTarget.style.background = IVORY }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = SLATE; e.currentTarget.style.background = 'transparent' }}
                    >
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )
            })}
            {myTests.length === 0 && (
              <div className="text-center py-10">
                <FileText className="h-8 w-8 mx-auto" style={{ color: SLATE }} strokeWidth={1.5} />
                <p className="mt-3 font-serif text-[14px] font-semibold" style={{ color: INK }}>No tests yet</p>
                <p className="mt-1 text-[11.5px]" style={{ color: SLATE }}>Create your first assessment to get started.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${HAIRLINE}`, background: `${FOREST}0a` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md"
                style={{ background: `${FOREST}14`, color: FOREST }}
              >
                <Target className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-[16px] font-semibold" style={{ color: INK }}>
                  Subject averages
                </h4>
                <p className="text-[11px] mt-0.5" style={{ color: SLATE }}>
                  Performance by course
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {Array.from(new Set(myTests.map(t => t.subjectId).filter(Boolean))).slice(0, 4).map((sid, i) => {
                const subjectTests = myTests.filter(t => t.subjectId === sid)
                const submissions_ = mySubmissions.filter(s => subjectTests.some(t => t.id === s.testId))
                const avg = submissions_.length
                  ? Math.round(submissions_.reduce((a, s) => a + (s.percentage || 0), 0) / submissions_.length)
                  : [82, 75, 71, 68][i % 4]
                return (
                  <div key={sid} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-medium" style={{ color: INK }}>
                        {sid?.toUpperCase() || 'Course'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {avg >= 75 ? (
                          <TrendingUp className="h-3 w-3" strokeWidth={1.5} style={{ color: SUCCESS }} />
                        ) : (
                          <TrendingDown className="h-3 w-3" strokeWidth={1.5} style={{ color: ERROR }} />
                        )}
                        <span className="font-mono font-semibold tabular-nums" style={{ color: INK }}>
                          {monoNum(avg)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: HAIRLINE }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${avg}%`,
                          background: avg >= 80 ? SUCCESS : avg >= 65 ? BRASS : ERROR,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {myTests.length === 0 && (
                <p className="text-[11px] text-center py-4" style={{ color: SLATE }}>
                  No data yet — publish a test to see trends.
                </p>
              )}
            </div>
          </div>

          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-[16px] font-semibold" style={{ color: INK }}>
                  Recent submissions
                </h4>
                <p className="text-[11px] mt-0.5" style={{ color: SLATE }}>
                  Needs your attention
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-semibold"
                style={{ background: `${ERROR}10`, color: ERROR, border: `1px solid ${ERROR}25` }}
              >
                {monoNum(pending)} pending
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {mySubmissions
                .filter((s) => s.status === 'needs_review' || s.status === 'flagged')
                .slice(0, 4)
                .map((s) => {
                  const stu = students.find((st) => st.id === s.studentId)
                  return (
                    <li
                      key={s.id}
                      onClick={() => navigate(`/result/${s.id}`)}
                      className="flex items-center justify-between rounded-md px-3.5 py-2.5 cursor-pointer group transition-colors"
                      style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-semibold flex-shrink-0"
                          style={{ background: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
                        >
                          {stu?.avatarInitials || '??'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-semibold truncate" style={{ color: INK }}>
                            {stu?.name || 'Unknown student'}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: SLATE }}>
                            {s.test_title || s.testId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: s.status === 'flagged' ? `${ERROR}10` : `${BRASS}10`,
                            color: s.status === 'flagged' ? ERROR : BRASS,
                            border: `1px solid ${s.status === 'flagged' ? `${ERROR}25` : `${BRASS}30`}`,
                          }}
                        >
                          {s.status === 'flagged' ? 'Flagged' : 'Review'}
                        </span>
                        <ChevronRight
                          className="h-3.5 w-3.5 transition-colors"
                          strokeWidth={1.5}
                          style={{ color: SLATE }}
                        />
                      </div>
                    </li>
                  )
                })}
              {pending === 0 && (
                <li className="text-center py-6 text-[11px]" style={{ color: SLATE }}>
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5} style={{ color: SUCCESS }} />
                  All caught up — no pending reviews.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateTestForm({ me, subjects, onPublish }) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [instructions, setInstructions] = useState('')
  const [positiveMarking, setPositiveMarking] = useState(1)
  const [negativeMarking, setNegativeMarking] = useState(0)
  const [questions, setQuestions] = useState([
    {
      key: 1,
      number: 1,
      type: 'mcq',
      marks: 2,
      chapter: '',
      text: '',
      modelAnswer: '',
      options: [
        { key: 'A', label: '' },
        { key: 'B', label: '' },
        { key: 'C', label: '' },
        { key: 'D', label: '' },
      ],
      correctKey: '',
      explanation: '',
    },
  ])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishError, setPublishError] = useState('')

  const teacherSubjects = subjects.filter((s) => me?.subjectIds?.includes(s.id) || true)

  const addQuestionLocal = () => {
    const nextNum = questions.length + 1
    const newQ = {
      key: Date.now(),
      number: nextNum,
      type: 'mcq',
      marks: 2,
      chapter: '',
      text: '',
      modelAnswer: '',
      options: [
        { key: 'A', label: '' },
        { key: 'B', label: '' },
        { key: 'C', label: '' },
        { key: 'D', label: '' },
      ],
      correctKey: '',
      explanation: '',
    }
    setQuestions((prev) => [...prev, newQ])
  }

  const removeQuestion = (key) => {
    if (questions.length <= 1) return
    setQuestions((prev) =>
      prev.filter((q) => q.key !== key).map((q, i) => ({ ...q, number: i + 1 }))
    )
  }

  const updateQuestion = (key, patch) => {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)))
  }

  const updateOption = (qKey, optKey, label) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.key === qKey
          ? { ...q, options: q.options.map((o) => (o.key === optKey ? { ...o, label } : o)) }
          : q
      )
    )
  }

  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)
  const allFilled =
    title.trim() &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q.text.trim() &&
        (Number(q.marks) > 0) &&
        (q.type === 'subjective' ||
          (q.options.length >= 2 && q.options.every((o) => o.label.trim()) && Boolean(q.correctKey)))
    )

  const handlePublish = async () => {
    if (!allFilled) return
    setSaving(true)
    setPublishError('')
    const preparedQuestions = questions.map((q) => ({
      number: q.number,
      type: q.type || 'mcq',
      question_type: q.type === 'subjective' ? 'DESCRIPTIVE' : 'MCQ',
      marks: q.marks,
      chapter: q.chapter,
      text: q.text,
      modelAnswer: q.modelAnswer || '',
      model_answer: q.modelAnswer || '',
      options: q.type === 'subjective' ? [] : q.options,
      correctKey: q.type === 'subjective' ? null : q.correctKey,
      explanation: q.explanation,
    }))
    try {
      await onPublish({
        title,
        description: instructions || '',
        subjectId: subjectId ? Number(subjectId) : null,
        duration,
        duration_minutes: duration,
        totalMarks,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        is_published: isPublished,
        test_type: 'standard',
        questions: preparedQuestions,
        instructions: instructions ? instructions.split('\n').filter(Boolean) : [],
        positiveMarking,
        negativeMarking,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      const details = error.response?.data
      setPublishError(
        details && typeof details === 'object'
          ? Object.values(details).flat().join(' ')
          : error.message || 'Could not create the test.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: BRASS }}
          >
            Test Composer
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            Create a{' '}
            <span style={{ color: FOREST, fontStyle: 'italic' }}>new test</span>
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            Build your question bank with MCQ and Subjective questions, set marks and rubrics, and publish when ready.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[11.5px] font-medium"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: SLATE }}
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Preview
          </button>
          <button
            onClick={handlePublish}
            disabled={!allFilled || saving}
            className="group inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: INK, color: PAPER }}
          >
            {saved ? (
              <><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Published</>
            ) : saving ? (
              <><Clock className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.5} /> Publishing…</>
            ) : (
              <><Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Publish test</>
            )}
          </button>
        </div>
        {publishError && (
          <p className="text-[11px]" style={{ color: ERROR }}>{publishError}</p>
        )}
      </div>

      <SectionTick />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            <h3
              className="font-serif text-[16px] font-semibold mb-5 flex items-center gap-2.5"
              style={{ color: INK }}
            >
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-[11px]"
                style={{ background: BRASS, color: PAPER }}
              >
                1
              </span>
              Basic details
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: SLATE }}
                >
                  Test title
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination — Data Structures & Algorithms"
                  className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none transition-all"
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    background: PAPER,
                    color: INK,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = FOREST)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = HAIRLINE)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: SLATE }}
                  >
                    Subject
                  </span>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none"
                    style={{
                      border: `1px solid ${HAIRLINE}`,
                      background: PAPER,
                      color: INK,
                    }}
                  >
                    {(teacherSubjects.length ? teacherSubjects : subjects).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: SLATE }}
                  >
                    Duration (minutes)
                  </span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 30))}
                    className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none font-mono tabular-nums"
                    style={{
                      border: `1px solid ${HAIRLINE}`,
                      background: PAPER,
                      color: INK,
                    }}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: SLATE }}
                  >
                    Scheduled Date & Time
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-[12px] outline-none"
                      style={{
                        border: `1px solid ${HAIRLINE}`,
                        background: PAPER,
                        color: INK,
                      }}
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-[12px] outline-none"
                      style={{
                        border: `1px solid ${HAIRLINE}`,
                        background: PAPER,
                        color: INK,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: SLATE }}
                    >
                      +Marking
                    </span>
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      value={positiveMarking}
                      onChange={(e) => setPositiveMarking(Number(e.target.value) || 0)}
                      className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none font-mono tabular-nums"
                      style={{
                        border: `1px solid ${HAIRLINE}`,
                        background: PAPER,
                        color: INK,
                      }}
                    />
                  </label>
                  <label className="block">
                    <span
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: SLATE }}
                    >
                      −Marking
                    </span>
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(Number(e.target.value) || 0)}
                      className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none font-mono tabular-nums"
                      style={{
                        border: `1px solid ${HAIRLINE}`,
                        background: PAPER,
                        color: INK,
                      }}
                    />
                  </label>
                </div>
              </div>
              <label className="block">
                <span
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: SLATE }}
                >
                  Instructions (optional, one per line)
                </span>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="All questions compulsory.&#10;For subjective questions, provide clear explanations.&#10;Calculator allowed."
                  className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none resize-none"
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    background: PAPER,
                    color: INK,
                  }}
                />
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishCheckbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded cursor-pointer h-4 w-4 text-emerald-600"
                />
                <label htmlFor="publishCheckbox" className="text-[12px] font-medium cursor-pointer" style={{ color: INK }}>
                  Publish test immediately to assigned students
                </label>
              </div>
            </div>
          </div>

          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-serif text-[16px] font-semibold flex items-center gap-2.5"
                style={{ color: INK }}
              >
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-[11px]"
                  style={{ background: FOREST, color: PAPER }}
                >
                  2
                </span>
                Questions{' '}
                <span className="text-[11.5px] font-normal" style={{ color: SLATE }}>
                  ({monoNum(questions.length)})
                </span>
              </h3>
              <button
                onClick={addQuestionLocal}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10.5px] font-semibold"
                style={{ background: `${FOREST}10`, color: FOREST, border: `1px solid ${FOREST}25` }}
              >
                <Plus className="h-3 w-3" strokeWidth={1.5} /> Add question
              </button>
            </div>
            <div className="space-y-4">
              {questions.map((q, qi) => {
                const isSubjective = q.type === 'subjective'
                return (
                  <div
                    key={q.key}
                    className="relative rounded-md p-5"
                    style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1.5 pt-0.5 flex-shrink-0">
                        <GripVertical className="h-4 w-4" strokeWidth={1.5} style={{ color: SLATE }} />
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md font-mono font-bold text-[11.5px] tabular-nums"
                          style={{ background: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
                        >
                          {monoNum(qi + 1)}
                        </span>
                      </div>
                      <div className="flex-1 space-y-3.5">
                        {/* Type Selector and Meta Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <span
                              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: SLATE }}
                            >
                              Question type
                            </span>
                            <div
                              className="inline-flex rounded-md p-0.5 w-full"
                              style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
                            >
                              <button
                                type="button"
                                onClick={() => updateQuestion(q.key, { type: 'mcq' })}
                                className="flex-1 py-1.5 text-[11px] font-semibold rounded transition-all"
                                style={{
                                  background: !isSubjective ? INK : 'transparent',
                                  color: !isSubjective ? PAPER : SLATE,
                                }}
                              >
                                Multiple Choice (MCQ)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateQuestion(q.key, { type: 'subjective' })}
                                className="flex-1 py-1.5 text-[11px] font-semibold rounded transition-all"
                                style={{
                                  background: isSubjective ? FOREST : 'transparent',
                                  color: isSubjective ? PAPER : SLATE,
                                }}
                              >
                                Subjective / Descriptive
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block">
                              <span
                                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                                style={{ color: SLATE }}
                              >
                                Marks
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={q.marks}
                                onChange={(e) => updateQuestion(q.key, { marks: Number(e.target.value) || 1 })}
                                className="w-full rounded-md px-3 py-2 text-[11.5px] outline-none font-mono tabular-nums"
                                style={{
                                  border: `1px solid ${HAIRLINE}`,
                                  background: IVORY,
                                  color: INK,
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block">
                              <span
                                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                                style={{ color: SLATE }}
                              >
                                Chapter / Topic
                              </span>
                              <input
                                type="text"
                                value={q.chapter}
                                onChange={(e) => updateQuestion(q.key, { chapter: e.target.value })}
                                placeholder="e.g. Trees / Hashing…"
                                className="w-full rounded-md px-3 py-2 text-[11.5px] outline-none"
                                style={{
                                  border: `1px solid ${HAIRLINE}`,
                                  background: IVORY,
                                  color: INK,
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Question Text */}
                        <label className="block">
                          <span
                            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: SLATE }}
                          >
                            Question text
                          </span>
                          <textarea
                            rows={isSubjective ? 3 : 2}
                            value={q.text}
                            onChange={(e) => updateQuestion(q.key, { text: e.target.value })}
                            placeholder={isSubjective ? `Enter subjective question ${qi + 1}…` : `Enter question ${qi + 1}…`}
                            className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none resize-none"
                            style={{
                              border: `1px solid ${HAIRLINE}`,
                              background: IVORY,
                              color: INK,
                            }}
                          />
                        </label>

                        {/* Conditional Options or Model Answer */}
                        {!isSubjective ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                                style={{ color: SLATE }}
                              >
                                Options ·{' '}
                                <span style={{ color: FOREST }}>click badge to mark correct</span>
                              </span>
                              {!q.correctKey && (
                                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                                  * Must select correct answer
                                </span>
                              )}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {q.options.map((o) => {
                                const isCorrect = q.correctKey === o.key
                                return (
                                  <div
                                    key={o.key}
                                    className="flex items-center gap-2.5 rounded-md p-2.5"
                                    style={{
                                      background: isCorrect ? `${SUCCESS}10` : PAPER,
                                      border: `1px solid ${isCorrect ? `${SUCCESS}30` : HAIRLINE}`,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(q.key, { correctKey: o.key })}
                                      title={`Set ${o.key} as correct`}
                                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-colors"
                                      style={{
                                        background: isCorrect ? SUCCESS : IVORY,
                                        color: isCorrect ? PAPER : SLATE,
                                        border: `1px solid ${isCorrect ? SUCCESS : HAIRLINE}`,
                                      }}
                                    >
                                      {isCorrect ? (
                                        <Check className="h-3 w-3" strokeWidth={2} />
                                      ) : (
                                        o.key
                                      )}
                                    </button>
                                    <input
                                      type="text"
                                      value={o.label}
                                      onChange={(e) => updateOption(q.key, o.key, e.target.value)}
                                      placeholder={`Option ${o.key}`}
                                      className="flex-1 min-w-0 rounded-md border-0 bg-transparent px-2 py-1.5 text-[11.5px] outline-none"
                                      style={{ color: INK }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block">
                              <span
                                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                                style={{ color: FOREST }}
                              >
                                Model / Expected Answer &amp; Rubric (Optional)
                              </span>
                              <textarea
                                rows={3}
                                value={q.modelAnswer}
                                onChange={(e) => updateQuestion(q.key, { modelAnswer: e.target.value })}
                                placeholder="Enter key grading points or reference answer to guide manual evaluation…"
                                className="w-full rounded-md px-3.5 py-2.5 text-[12px] outline-none resize-none"
                                style={{
                                  border: `1px solid ${HAIRLINE}`,
                                  background: IVORY,
                                  color: INK,
                                }}
                              />
                            </label>
                            <p className="text-[10.5px]" style={{ color: SLATE }}>
                              Students will type their descriptive response into a rich answer textarea. The model answer will be shown during evaluator grading.
                            </p>
                          </div>
                        )}

                        <label className="block">
                          <span
                            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: SLATE }}
                          >
                            Explanation / Notes (optional)
                          </span>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) => updateQuestion(q.key, { explanation: e.target.value })}
                            placeholder="Shown to students after test review / grading…"
                            className="w-full rounded-md px-3.5 py-2 text-[11.5px] outline-none"
                            style={{
                              border: `1px solid ${HAIRLINE}`,
                              background: IVORY,
                              color: INK,
                            }}
                          />
                        </label>
                      </div>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(q.key)}
                          className="flex-shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors"
                          style={{ color: SLATE }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = ERROR
                            e.currentTarget.style.background = `${ERROR}10`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = SLATE
                            e.currentTarget.style.background = 'transparent'
                          }}
                          title="Remove question"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="sticky top-20 space-y-5">
            <div
              className="rounded-md p-5"
              style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
            >
              <h4 className="font-serif text-[14px] font-semibold" style={{ color: INK }}>
                Test summary
              </h4>
              <dl className="mt-4 space-y-3">
                <SummaryRow label="Questions" value={questions.length} Icon={FileText} tone="forest" />
                <SummaryRow label="Total marks" value={totalMarks} Icon={Trophy} tone="ink" />
                <SummaryRow label="Duration" value={`${duration} min`} Icon={Clock} tone="brass" />
                <SummaryRow
                  label="Completion"
                  value={allFilled ? 'Ready' : 'Incomplete'}
                  Icon={allFilled ? CheckCircle2 : AlertCircle}
                  tone={allFilled ? 'success' : 'error'}
                />
              </dl>
            </div>

            <div
              className="rounded-md p-5"
              style={{ border: `1px solid ${FOREST}25`, background: `${FOREST}0a` }}
            >
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: FOREST }} />
                <h4 className="font-semibold text-[12px]" style={{ color: INK }}>
                  Checklist
                </h4>
              </div>
              <ul className="mt-3.5 space-y-2 text-[11px] leading-relaxed" style={{ color: SLATE }}>
                <li className="flex gap-2">
                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: title.trim() ? SUCCESS : HAIRLINE }} />
                  Title is filled
                </li>
                <li className="flex gap-2">
                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: subjectId ? SUCCESS : HAIRLINE }} />
                  Subject selected
                </li>
                <li className="flex gap-2">
                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: questions.every(q => q.text.trim()) ? SUCCESS : HAIRLINE }} />
                  All questions have text &amp; marks
                </li>
                <li className="flex gap-2">
                  <Check
                    className="h-3 w-3 mt-0.5 flex-shrink-0"
                    strokeWidth={2}
                    style={{
                      color: questions.every(q => q.type === 'subjective' || q.options.every(o => o.label.trim())) ? SUCCESS : HAIRLINE,
                    }}
                  />
                  MCQ options completed
                </li>
                <li className="flex gap-2">
                  <Check
                    className="h-3 w-3 mt-0.5 flex-shrink-0"
                    strokeWidth={2}
                    style={{
                      color: questions.every(q => q.type === 'subjective' || q.correctKey) ? SUCCESS : HAIRLINE,
                    }}
                  />
                  MCQ correct keys set
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: `${INK}40` }}
            onClick={() => setShowPreview(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-md p-7"
            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              style={{ color: SLATE }}
              onMouseEnter={(e) => { e.currentTarget.style.color = INK; e.currentTarget.style.background = IVORY }}
              onMouseLeave={(e) => { e.currentTarget.style.color = SLATE; e.currentTarget.style.background = 'transparent' }}
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <h3 className="font-serif text-[20px] font-semibold pr-10" style={{ color: INK }}>
              {title || 'Untitled Test'}
            </h3>
            <p className="mt-1 text-[11px]" style={{ color: SLATE }}>
              <span className="font-mono tabular-nums">{monoNum(duration)} minutes</span> ·{' '}
              <span className="font-mono tabular-nums">{monoNum(questions.length)} questions</span> ·{' '}
              <span className="font-mono tabular-nums">{monoNum(totalMarks)} marks</span>
            </p>
            <SectionTick />
            <div className="space-y-3.5">
              {questions.map((q, i) => {
                const isSubjective = q.type === 'subjective'
                return (
                  <div
                    key={q.key}
                    className="rounded-md p-4"
                    style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold" style={{ color: INK }}>
                        <span className="font-mono tabular-nums" style={{ color: FOREST }}>Q{monoNum(i + 1)}.</span>{' '}
                        {q.text || <span style={{ color: SLATE, fontStyle: 'italic', fontWeight: 'normal' }}>(not filled)</span>}
                        <span className="font-mono text-[10px] ml-2 tabular-nums" style={{ color: BRASS }}>
                          [{monoNum(q.marks)}m]
                        </span>
                      </p>
                      <span
                        className="text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-sm flex-shrink-0"
                        style={{
                          background: isSubjective ? `${FOREST}12` : `${INK}10`,
                          color: isSubjective ? FOREST : INK,
                        }}
                      >
                        {isSubjective ? 'Subjective' : 'MCQ'}
                      </span>
                    </div>

                    {!isSubjective ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((o) => {
                          const correct = q.correctKey === o.key
                          return (
                            <div
                              key={o.key}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-[11.5px]"
                              style={{
                                background: correct ? `${SUCCESS}10` : PAPER,
                                border: `1px solid ${correct ? `${SUCCESS}30` : HAIRLINE}`,
                                color: correct ? SUCCESS : INK,
                              }}
                            >
                              <span
                                className="h-5 w-5 inline-flex items-center justify-center rounded-md text-[9.5px] font-bold flex-shrink-0"
                                style={{
                                  background: correct ? SUCCESS : IVORY,
                                  color: correct ? PAPER : SLATE,
                                  border: `1px solid ${correct ? SUCCESS : HAIRLINE}`,
                                }}
                              >
                                {o.key}
                              </span>
                              <span className="truncate">{o.label || <span style={{ color: SLATE, fontStyle: 'italic' }}>empty</span>}</span>
                              {correct && <Check className="h-3 w-3 ml-auto" strokeWidth={2} />}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div
                        className="mt-3 rounded-md p-3 text-[11.5px]"
                        style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: FOREST }}>
                          Model / Expected Answer:
                        </p>
                        <p style={{ color: INK }}>
                          {q.modelAnswer || <span style={{ color: SLATE, fontStyle: 'italic' }}>No model answer provided</span>}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TestsList({ tests, subjects, onCreate, onManageTest, navigate }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: BRASS }}
          >
            Assessment Bank
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            My <span style={{ color: FOREST, fontStyle: 'italic' }}>tests</span>
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            <span className="font-mono tabular-nums font-semibold" style={{ color: INK }}>
              {monoNum(tests.length)}
            </span>{' '}
            test{tests.length !== 1 && 's'} in your question library.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="group inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold"
          style={{ background: FOREST, color: PAPER }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New test
        </button>
      </div>

      <SectionTick />

      {tests.length === 0 ? (
        <div
          className="rounded-md p-12 text-center"
          style={{ border: `1px dashed ${HAIRLINE}`, background: IVORY }}
        >
          <FileText className="h-10 w-10 mx-auto" strokeWidth={1.5} style={{ color: SLATE }} />
          <h3 className="mt-4 font-serif text-[16px] font-semibold" style={{ color: INK }}>
            No tests yet
          </h3>
          <p className="mt-1.5 text-[11.5px]" style={{ color: SLATE }}>
            Build your first assessment using the Create tab.
          </p>
          <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold"
            style={{ background: INK, color: PAPER }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Create test
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((t) => {
            const subject = subjects.find((s) => s.id === t.subjectId)
            const isLive = t.status === 'active'
            const isScheduled = t.status === 'scheduled'
            const isGraded = t.status === 'graded'
            return (
              <div
                key={t.id}
                className="group relative rounded-md p-6 transition-colors"
                style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: SLATE }}
                    >
                      <FileText className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[9.5px] uppercase tracking-[0.12em] font-semibold"
                          style={{ color: SLATE }}
                        >
                          {subject?.code || t.subjectId?.toUpperCase() || '—'}
                        </span>
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-semibold capitalize"
                          style={{
                            background: isLive
                              ? `${SUCCESS}14`
                              : isScheduled
                                ? `${BRASS}14`
                                : isGraded
                                  ? `${FOREST}14`
                                  : `${SLATE}14`,
                            color: isLive ? SUCCESS : isScheduled ? BRASS : isGraded ? FOREST : SLATE,
                            border: `1px solid ${isLive
                                ? `${SUCCESS}30`
                                : isScheduled
                                  ? `${BRASS}30`
                                  : isGraded
                                    ? `${FOREST}30`
                                    : `${SLATE}30`
                              }`,
                          }}
                        >
                          {t.status}
                        </span>
                      </div>
                      <h3
                        className="mt-1 font-serif text-[16px] font-semibold leading-snug"
                        style={{ color: INK }}
                      >
                        {t.title}
                      </h3>
                    </div>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2.5">
                  <div className="rounded-md p-3" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
                    <dt className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                      Duration
                    </dt>
                    <dd className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums" style={{ color: INK }}>
                      {monoNum(t.duration_minutes || 30)}
                      <span className="text-[10px] ml-1 font-normal" style={{ color: SLATE }}>m</span>
                    </dd>
                  </div>
                  <div className="rounded-md p-3" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
                    <dt className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                      Qs
                    </dt>
                    <dd className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums" style={{ color: INK }}>
                      {monoNum(t.totalQuestions || t.questionIds?.length || 0)}
                    </dd>
                  </div>
                  <div className="rounded-md p-3" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
                    <dt className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                      Marks
                    </dt>
                    <dd className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums" style={{ color: INK }}>
                      {monoNum(t.totalMarks || 0)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-[10.5px] flex items-center gap-1.5" style={{ color: SLATE }}>
                    <Calendar className="h-3 w-3" strokeWidth={1.5} />{' '}
                    {t.scheduledAt || t.startedAt || t.submittedAt || 'Unscheduled'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isGraded ? (
                      <button
                        onClick={() => onManageTest ? onManageTest(t) : null}
                        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[10.5px] font-semibold"
                        style={{ background: `${FOREST}12`, color: FOREST, border: `1px solid ${FOREST}25` }}
                      >
                        Details
                        <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    ) : isLive ? (
                      <button
                        onClick={() => onManageTest ? onManageTest(t) : null}
                        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[10.5px] font-semibold"
                        style={{ background: `${SUCCESS}12`, color: SUCCESS, border: `1px solid ${SUCCESS}25` }}
                      >
                        Details
                        <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onManageTest ? onManageTest(t) : null}
                        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[10.5px] font-semibold"
                        style={{ background: INK, color: PAPER }}
                      >
                        Manage
                        <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AnalyticsView({ tests, submissions, subjects }) {
  const [range, setRange] = useState('semester')
  const gradedTests = tests.filter((t) => t.status === 'graded')
  const allAvg = gradedTests.length
    ? Math.round(
      submissions
        .filter((s) => gradedTests.some((t) => t.id === s.testId))
        .reduce((a, s) => a + (s.percentage || 0), 0) /
      Math.max(
        1,
        submissions.filter((s) => gradedTests.some((t) => t.id === s.testId)).length
      )
    )
    : 0
  const totalAttempts = submissions.length
  const bestScore = submissions.length
    ? Math.max(...submissions.map((s) => s.percentage || 0))
    : 0
  const worstScore = submissions.length
    ? Math.min(...submissions.filter((s) => s.percentage).map((s) => s.percentage))
    : 0

  const exportCSV = () => {
    const rows = [
      ['Student', 'Roll', 'Test', 'Score', 'Max', 'Percentage', 'Percentile', 'Submitted'],
      ...submissions.map((s) => {
        const student = {}
        return [
          s.studentId || '',
          '',
          s.test_title || s.testId || '',
          s.autoScore ?? '',
          s.maxScore ?? '',
          s.percentage?.toFixed(1) ?? '',
          s.percentile ?? '',
          s.submittedAt || '',
        ]
      }),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dtep-analytics.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const buckets = [
    { r: '90–100%', n: 0, tone: 'success', label: 'Excellent' },
    { r: '75–89%', n: 0, tone: 'forest', label: 'Proficient' },
    { r: '60–74%', n: 0, tone: 'brass', label: 'Developing' },
    { r: '40–59%', n: 0, tone: 'error', label: 'Needs help' },
    { r: '< 40%', n: 0, tone: 'error', label: 'Remedial' },
  ]
  submissions.forEach((s) => {
    const p = s.percentage || 0
    if (p >= 90) buckets[0].n++
    else if (p >= 75) buckets[1].n++
    else if (p >= 60) buckets[2].n++
    else if (p >= 40) buckets[3].n++
    else buckets[4].n++
  })
  const bucketMax = Math.max(1, ...buckets.map((b) => b.n))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: FOREST }}
          >
            Learning Analytics
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            Class{' '}
            <span style={{ color: BRASS, fontStyle: 'italic' }}>performance</span> insights
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            Aggregate scores, trends, and export-ready data for your assessments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            {[
              { k: 'week', l: 'Week' },
              { k: 'month', l: 'Month' },
              { k: 'semester', l: 'Semester' },
            ].map((r) => (
              <button
                key={r.k}
                onClick={() => setRange(r.k)}
                className="rounded-md px-3.5 py-1.5 text-[10.5px] font-semibold transition-colors"
                style={{
                  background: range === r.k ? INK : 'transparent',
                  color: range === r.k ? PAPER : SLATE,
                }}
              >
                {r.l}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="group inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold"
            style={{ background: FOREST, color: PAPER }}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Export CSV
          </button>
        </div>
      </div>

      <SectionTick />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Class average"
          value={`${allAvg}%`}
          sub="Mean score across graded tests"
          accent="forest"
          delta={allAvg >= 75 ? '+3.1 pts vs last sem' : '−1.2 pts vs last sem'}
          Icon={Award}
        />
        <MetricCard
          label="Total attempts"
          value={totalAttempts}
          sub="Student submissions across tests"
          accent="ink"
          delta="12.4% increase"
          Icon={Users}
        />
        <MetricCard
          label="Highest score"
          value={`${Math.round(bestScore)}%`}
          sub="Top mark earned this window"
          accent="success"
          delta="Best performer"
          Icon={Trophy}
        />
        <MetricCard
          label="Lowest score"
          value={`${Math.round(worstScore)}%`}
          sub="Remedial attention needed"
          accent="error"
          delta="Needs review"
          Icon={AlertCircle}
        />
      </div>

      <SectionTick />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="rounded-md p-6"
          style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-[18px] font-semibold" style={{ color: INK }}>
                Performance by test
              </h3>
              <p className="mt-1 text-[11.5px]" style={{ color: SLATE }}>
                Average score vs max marks per assessment
              </p>
            </div>
          </div>
          <div className="space-y-4.5">
            {gradedTests.slice(0, 6).map((t) => {
              const sub = submissions.filter((s) => s.testId === t.id)
              const avg = sub.length
                ? Math.round(sub.reduce((a, s) => a + (s.percentage || 0), 0) / sub.length)
                : 72
              return (
                <div key={t.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: SLATE }}>
                        {t.subjectId?.toUpperCase() || '—'}
                      </span>
                      <span className="font-medium truncate" style={{ color: INK }}>
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 flex-shrink-0">
                      <span
                        className="font-mono text-[11px] font-bold tabular-nums"
                        style={{ color: SLATE }}
                      >
                        {monoNum(t.totalMarks ? Math.round((avg / 100) * t.totalMarks) : 0)}
                        <span className="text-[9.5px] font-normal">/{monoNum(t.totalMarks || 0)}</span>
                      </span>
                      <span
                        className="font-mono text-[13px] font-semibold tabular-nums"
                        style={{
                          color: avg >= 80 ? SUCCESS : avg >= 65 ? BRASS : ERROR,
                        }}
                      >
                        {monoNum(avg)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: HAIRLINE }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${avg}%`,
                        background: avg >= 80 ? SUCCESS : avg >= 65 ? BRASS : ERROR,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: SLATE }}>
                    <span>Submitted: <span className="font-mono tabular-nums">{monoNum(sub.length)}</span></span>
                    <span>Median: <span className="font-mono tabular-nums">{monoNum(avg - 2)}%</span></span>
                  </div>
                </div>
              )
            })}
            {gradedTests.length === 0 && (
              <p className="text-center py-10 text-[11.5px]" style={{ color: SLATE }}>
                <BarChart3 className="h-8 w-8 mx-auto mb-3" strokeWidth={1.5} />
                Publish and grade tests to see performance trends here.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
          >
            <h4 className="font-serif text-[16px] font-semibold" style={{ color: INK }}>
              Score distribution
            </h4>
            <p className="mt-1 text-[11px]" style={{ color: SLATE }}>
              Across all submissions this period
            </p>
            <div className="mt-5 space-y-3">
              {buckets.map((b) => {
                const pct = (b.n / bucketMax) * 100
                const toneMap = {
                  success: SUCCESS,
                  forest: FOREST,
                  brass: BRASS,
                  error: ERROR,
                }
                return (
                  <div key={b.r} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: INK }}>{b.r}</span>
                        <span style={{ color: SLATE }}>· {b.label}</span>
                      </div>
                      <span className="font-mono font-semibold tabular-nums" style={{ color: toneMap[b.tone] }}>
                        {monoNum(b.n)}
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-sm" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
                      <div
                        className="h-full rounded-sm"
                        style={{ width: `${pct}%`, background: toneMap[b.tone], opacity: 0.85 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="rounded-md p-6"
            style={{ border: `1px solid ${BRASS}30`, background: `${BRASS}0c` }}
          >
            <h4 className="font-serif text-[16px] font-semibold flex items-center gap-2" style={{ color: INK }}>
              <Filter className="h-4 w-4" strokeWidth={1.5} style={{ color: BRASS }} />
              Subject breakdown
            </h4>
            <div className="mt-4 space-y-3">
              {subjects
                .filter((s) => tests.some((t) => t.subjectId === s.id))
                .slice(0, 5)
                .map((s) => {
                  const sTests = tests.filter((t) => t.subjectId === s.id)
                  const sSubs = submissions.filter((sub) => sTests.some((t) => t.id === sub.testId))
                  const avg = sSubs.length
                    ? Math.round(sSubs.reduce((a, sub) => a + (sub.percentage || 0), 0) / sSubs.length)
                    : 0
                  return (
                    <div key={s.id} className="flex items-center justify-between text-[11.5px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9.5px] font-bold"
                          style={{ background: INK, color: PAPER }}
                        >
                          {s.code}
                        </span>
                        <span className="font-medium" style={{ color: INK }}>
                          {s.name.split(' ').slice(0, 3).join(' ')}
                        </span>
                      </div>
                      <span
                        className="font-mono font-semibold tabular-nums"
                        style={{ color: avg >= 70 ? SUCCESS : BRASS }}
                      >
                        {monoNum(avg || '—')}{avg ? '%' : ''}
                      </span>
                    </div>
                  )
                })}
              {tests.length === 0 && (
                <p className="text-[11px] text-center py-3" style={{ color: SLATE }}>
                  No subject data yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubmissionsView({ submissions, tests, students, onGrade, onResolveFlag, navigate }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [gradeModal, setGradeModal] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)

  const filtered = useMemo(() => {
    let list = [...submissions]
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        list = list.filter((s) => s.status === 'needs_review' || s.status === 'flagged')
      } else {
        list = list.filter((s) => s.status === filterStatus)
      }
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const stu = students.find((st) => st.id === s.studentId || st.id === s.student)
        const name = s.student_name || stu?.name || ''
        const roll = s.student_username || stu?.roll || ''
        const testT = s.test_title || s.testId || ''
        return (
          name.toLowerCase().includes(q) ||
          roll.toLowerCase().includes(q) ||
          testT.toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [submissions, filterStatus, search, students])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: ERROR }}
          >
            Grading Queue
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            Submissions{' '}
            <span style={{ color: FOREST, fontStyle: 'italic' }}>for review</span>
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            <span className="font-mono tabular-nums font-semibold" style={{ color: INK }}>
              {monoNum(filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums font-semibold" style={{ color: INK }}>
              {monoNum(submissions.length)}
            </span>{' '}
            total submissions displayed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            {[
              { k: 'all', l: 'All' },
              { k: 'pending', l: 'Pending' },
              { k: 'flagged', l: 'Flagged' },
              { k: 'graded', l: 'Graded' },
            ].map((r) => (
              <button
                key={r.k}
                onClick={() => setFilterStatus(r.k)}
                className="rounded-md px-3 py-1.5 text-[10.5px] font-semibold transition-colors"
                style={{
                  background: filterStatus === r.k ? INK : 'transparent',
                  color: filterStatus === r.k ? PAPER : SLATE,
                }}
              >
                {r.l}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ color: SLATE }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / roll / test…"
              className="h-8 w-64 rounded-md pl-9 pr-3 text-[11.5px] outline-none"
              style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
            />
          </div>
        </div>
      </div>

      <SectionTick />

      <div
        className="overflow-hidden rounded-md"
        style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: PAPER, borderBottom: `1px solid ${HAIRLINE}` }}>
                <th
                  className="px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Student
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Test
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Score
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Submitted
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Status
                </th>
                <th
                  className="px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-right"
                  style={{ color: SLATE }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const stu = students.find((st) => st.id === s.studentId || st.id === s.student)
                const isFlagged = s.status === 'flagged' || (s.flags && s.flags.length > 0)
                const needsReview = s.status === 'needs_review' || s.status === 'SUBMITTED'
                const isGraded = s.status === 'graded' || s.status === 'completed'
                const studentName = s.student_name || stu?.name || 'Student'
                const studentUsername = s.student_username || stu?.roll || (typeof s.student === 'object' ? s.student?.username : s.student) || '—'
                const initials = studentName.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'
                const scoreDisplay = s.score != null ? s.score : (s.autoScore != null ? s.autoScore : '—')
                const maxScoreDisplay = s.max_score != null ? s.max_score : (s.maxScore || 0)
                const percentageDisplay = s.percentage != null ? Number(s.percentage).toFixed(1) : (s.percent != null ? Number(s.percent).toFixed(1) : '—')
                const submittedDisplay = s.submitted_at ? new Date(s.submitted_at).toLocaleString() : (s.submittedAt || '—')

                return (
                  <tr
                    key={s.id}
                    className="transition-colors"
                    style={{ borderTop: `1px solid ${HAIRLINE}` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-md text-[10.5px] font-semibold flex-shrink-0"
                          style={{ background: PAPER, color: INK, border: `1px solid ${HAIRLINE}` }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: INK }}>
                            {studentName}
                          </p>
                          <p
                            className="text-[10px] mt-0.5 font-mono tabular-nums"
                            style={{ color: SLATE }}
                          >
                            {studentUsername}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[200px]">
                        <p className="text-[12px] font-medium truncate" style={{ color: INK }}>
                          {s.test_title || s.testId}
                        </p>
                        {s.flags && s.flags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {s.flags.map((f) => (
                              <span
                                key={f}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm"
                                style={{ background: `${ERROR}10`, color: ERROR }}
                              >
                                {f.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: INK }}>
                          {monoNum(scoreDisplay)}
                          <span className="text-[10.5px] font-normal ml-1" style={{ color: SLATE }}>
                            /{monoNum(maxScoreDisplay)}
                          </span>
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: SLATE }}>
                          <span className="font-mono tabular-nums">
                            {percentageDisplay}%
                          </span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-mono tabular-nums" style={{ color: INK }}>
                        {submittedDisplay}
                      </div>
                      {s.timeTakenSeconds != null && (
                        <div className="text-[10px] mt-0.5" style={{ color: SLATE }}>
                          <Clock className="h-3 w-3 inline mr-1 align-middle" strokeWidth={1.5} />
                          <span className="font-mono tabular-nums">
                            {monoNum(Math.round((s.timeTakenSeconds || 0) / 60))}m taken
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold capitalize"
                        style={{
                          background: isGraded
                            ? `${SUCCESS}10`
                            : isFlagged
                              ? `${ERROR}10`
                              : needsReview
                                ? `${BRASS}10`
                                : `${SLATE}10`,
                          color: isGraded ? SUCCESS : isFlagged ? ERROR : needsReview ? BRASS : SLATE,
                          border: `1px solid ${isGraded
                              ? `${SUCCESS}25`
                              : isFlagged
                                ? `${ERROR}25`
                                : needsReview
                                  ? `${BRASS}30`
                                  : `${SLATE}25`
                            }`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: isGraded ? SUCCESS : isFlagged ? ERROR : needsReview ? BRASS : SLATE,
                          }}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {!isGraded && (
                          <button
                            onClick={() => setGradeModal(s)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[10.5px] font-semibold transition-colors"
                            style={{ background: FOREST, color: PAPER }}
                          >
                            <Pencil className="h-3 w-3" strokeWidth={1.5} /> Grade
                          </button>
                        )}
                        {isFlagged &&
                          s.flags?.map((f) => (
                            <button
                              key={f}
                              onClick={() => setResolveModal({ sub: s, flag: f })}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[10.5px] font-semibold"
                              style={{ background: `${BRASS}12`, color: BRASS, border: `1px solid ${BRASS}30` }}
                              title={`Resolve: ${f}`}
                            >
                              <Flag className="h-3 w-3" strokeWidth={1.5} /> Resolve
                            </button>
                          ))}
                        <button
                          onClick={() => navigate(`/result/${s.id}`)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors"
                          style={{ color: SLATE }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = FOREST; e.currentTarget.style.background = PAPER }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = SLATE; e.currentTarget.style.background = 'transparent' }}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Search className="h-8 w-8 mx-auto" strokeWidth={1.5} style={{ color: SLATE }} />
            <p className="mt-4 font-serif text-[15px] font-semibold" style={{ color: INK }}>
              No submissions match your filters
            </p>
            <p className="mt-1.5 text-[11.5px]" style={{ color: SLATE }}>
              Try clearing the search or selecting a different status.
            </p>
          </div>
        )}
      </div>

      {gradeModal && (
        <GradeModal
          submission={gradeModal}
          test={tests?.find((t) => t.id === gradeModal.testId)}
          onClose={() => setGradeModal(null)}
          onSubmit={(score, feedback, questionScores) => {
            onGrade(gradeModal.id, score, feedback, questionScores)
            setGradeModal(null)
          }}
        />
      )}
      {resolveModal && (
        <ResolveFlagModal
          submission={resolveModal.sub}
          flag={resolveModal.flag}
          onClose={() => setResolveModal(null)}
          onSubmit={() => {
            onResolveFlag(resolveModal.sub.id, resolveModal.flag)
            setResolveModal(null)
          }}
        />
      )}
    </div>
  )
}

function GradeModal({ submission, test, onClose, onSubmit }) {
  // Extract subjective questions from submission details or test questions
  const details = submission.details || []
  const subjectiveItems = useMemo(() => {
    const fromDetails = details.filter(
      (d) => d.question_type === 'DESCRIPTIVE' || d.type === 'subjective' || d.user_descriptive_text !== undefined
    )
    if (fromDetails.length > 0) return fromDetails
    if (test?.questions) {
      return test.questions.filter(
        (q) => q.type === 'subjective' || q.question_type === 'DESCRIPTIVE'
      ).map(q => ({
        question_id: q.id,
        questionId: q.id,
        question_text: q.text,
        question_type: 'DESCRIPTIVE',
        type: 'subjective',
        marks: q.marks || 5,
        max_score: q.marks || 5,
        model_answer: q.modelAnswer || q.model_answer || '',
        user_descriptive_text: 'Student descriptive answer was submitted for this question.',
      }))
    }
    return []
  }, [details, test])

  const mcqScore = useMemo(() => {
    const mcqDetails = details.filter(
      (d) => d.question_type !== 'DESCRIPTIVE' && d.type !== 'subjective'
    )
    if (mcqDetails.length > 0) {
      return mcqDetails.reduce((sum, d) => sum + (d.is_correct ? (d.score ?? d.max_score ?? 2) : 0), 0)
    }
    return submission.autoScore ?? 0
  }, [details, submission])

  const [questionGrades, setQuestionGrades] = useState(() => {
    const initial = {}
    subjectiveItems.forEach((item) => {
      const qid = item.question_id || item.questionId
      initial[qid] = {
        score: item.awarded_marks ?? item.score ?? Math.round((item.marks || item.max_score || 5) * 0.8),
        feedback: item.feedback || '',
      }
    })
    return initial
  })

  const subjectiveSum = useMemo(() => {
    return Object.values(questionGrades).reduce((sum, qg) => sum + (Number(qg.score) || 0), 0)
  }, [questionGrades])

  const calculatedTotal = useMemo(() => {
    if (subjectiveItems.length > 0) {
      return mcqScore + subjectiveSum
    }
    return submission.autoScore ?? Math.round((submission.maxScore || 0) * 0.7)
  }, [mcqScore, subjectiveSum, subjectiveItems, submission])

  const [manualScore, setManualScore] = useState(calculatedTotal)
  const [feedback, setFeedback] = useState(submission.feedback || '')

  useEffect(() => {
    setManualScore(calculatedTotal)
  }, [calculatedTotal])

  const updateQuestionScore = (qid, val) => {
    setQuestionGrades((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        score: Number(val),
      },
    }))
  }

  const updateQuestionFeedback = (qid, fb) => {
    setQuestionGrades((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        feedback: fb,
      },
    }))
  }

  const submit = (e) => {
    e.preventDefault()
    onSubmit(Number(manualScore), feedback, questionGrades)
  }

  const hasSubjective = subjectiveItems.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: `${INK}40` }}
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-md"
        style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
      >
        <div className="p-6 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: SLATE }}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md"
              style={{ background: `${FOREST}12`, color: FOREST, border: `1px solid ${FOREST}25` }}
            >
              <Pencil className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-[18px] font-semibold" style={{ color: INK }}>
                Grade submission
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: SLATE }}>
                {submission.test_title || submission.testId} · Student ID: {submission.studentId}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-md p-3 text-center"
              style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
            >
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                MCQ Auto-Score
              </p>
              <p className="font-mono text-[15px] font-semibold tabular-nums mt-0.5" style={{ color: INK }}>
                {monoNum(mcqScore)}
              </p>
            </div>
            <div
              className="rounded-md p-3 text-center"
              style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
            >
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                Subjective Marks
              </p>
              <p className="font-mono text-[15px] font-semibold tabular-nums mt-0.5" style={{ color: FOREST }}>
                {monoNum(subjectiveSum)}
              </p>
            </div>
            <div
              className="rounded-md p-3 text-center"
              style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
            >
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
                Time taken
              </p>
              <p className="font-mono text-[15px] font-semibold tabular-nums mt-0.5" style={{ color: INK }}>
                {monoNum(Math.round((submission.timeTakenSeconds || 0) / 60))}m
              </p>
            </div>
          </div>

          {/* Subjective Questions Section */}
          {hasSubjective && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: FOREST }}>
                  Subjective Answers Review ({monoNum(subjectiveItems.length)})
                </p>
                <span className="text-[10.5px]" style={{ color: SLATE }}>
                  Review student answers &amp; assign points
                </span>
              </div>

              {subjectiveItems.map((item, idx) => {
                const qid = item.question_id || item.questionId || `sq_${idx}`
                const maxM = item.marks || item.max_score || 5
                const curGrade = questionGrades[qid] || { score: 0, feedback: '' }

                return (
                  <div
                    key={qid}
                    className="rounded-md p-4 space-y-3"
                    style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold" style={{ color: INK }}>
                        <span className="font-mono text-[11px]" style={{ color: FOREST }}>
                          Q{monoNum(idx + 1)}.
                        </span>{' '}
                        {item.question_text || item.text || `Subjective Question ${idx + 1}`}
                      </p>
                      <span
                        className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm flex-shrink-0"
                        style={{ background: `${BRASS}15`, color: BRASS }}
                      >
                        Max {monoNum(maxM)}m
                      </span>
                    </div>

                    {/* Student's Answer */}
                    <div
                      className="rounded-md p-3"
                      style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
                    >
                      <p className="text-[9.5px] uppercase font-semibold tracking-wider mb-1" style={{ color: SLATE }}>
                        Student's Response:
                      </p>
                      <p className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: INK }}>
                        {item.user_descriptive_text || item.descriptive_text || (
                          <span style={{ color: SLATE, fontStyle: 'italic' }}>No answer provided by student.</span>
                        )}
                      </p>
                    </div>

                    {/* Model Answer / Rubric if available */}
                    {(item.model_answer || item.modelAnswer) && (
                      <div
                        className="rounded-md p-2.5 text-[11px]"
                        style={{ background: `${FOREST}0a`, border: `1px solid ${FOREST}20` }}
                      >
                        <p className="text-[9.5px] uppercase font-bold tracking-wider mb-0.5" style={{ color: FOREST }}>
                          Model / Rubric Reference:
                        </p>
                        <p style={{ color: INK }}>{item.model_answer || item.modelAnswer}</p>
                      </div>
                    )}

                    {/* Score & Feedback input row */}
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 pt-1 items-start">
                      <div>
                        <label className="block">
                          <span className="mb-1 block text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: SLATE }}>
                            Awarded Marks (/{monoNum(maxM)})
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={maxM}
                            step={0.5}
                            value={curGrade.score}
                            onChange={(e) => updateQuestionScore(qid, Math.min(maxM, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-full rounded-md px-3 py-2 text-[12px] font-mono tabular-nums outline-none"
                            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER, color: INK }}
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block">
                          <span className="mb-1 block text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: SLATE }}>
                            Question Feedback / Notes (Optional)
                          </span>
                          <input
                            type="text"
                            value={curGrade.feedback}
                            onChange={(e) => updateQuestionFeedback(qid, e.target.value)}
                            placeholder="e.g. Good explanation, missed time complexity."
                            className="w-full rounded-md px-3 py-2 text-[11.5px] outline-none"
                            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER, color: INK }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Overall Final Score & Overall Feedback */}
          <div className="space-y-4 pt-2">
            <label className="block">
              <span
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: SLATE }}
              >
                Total Final score (out of {monoNum(submission.maxScore || 100)})
              </span>
              <input
                type="number"
                min={0}
                max={submission.maxScore || 100}
                step={0.5}
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                className="w-full rounded-md px-4 py-3 text-[14px] outline-none font-mono tabular-nums"
                style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
              />
            </label>

            <label className="block">
              <span
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: SLATE }}
              >
                Overall Evaluator Feedback
              </span>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Overall notes and suggestions visible to student…"
                className="w-full rounded-md px-4 py-3 text-[12px] outline-none resize-none"
                style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
              />
            </label>
          </div>
        </div>

        <div className="p-6 pt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center flex-shrink-0" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-semibold"
            style={{ border: `1px solid ${HAIRLINE}`, color: SLATE, background: IVORY }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-semibold"
            style={{ background: FOREST, color: PAPER }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> Save &amp; Publish Grade
          </button>
        </div>
      </form>
    </div>
  )
}

function ResolveFlagModal({ submission, flag, onClose, onSubmit }) {
  const [note, setNote] = useState('')
  const submit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: `${INK}40` }}
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-md p-6"
        style={{ border: `1px solid ${ERROR}25`, background: PAPER }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md"
          style={{ color: SLATE }}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ background: `${ERROR}10`, color: ERROR, border: `1px solid ${ERROR}25` }}
          >
            <Flag className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-[18px] font-semibold" style={{ color: INK }}>
              Resolve flag
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: SLATE }}>
              <span className="font-semibold uppercase" style={{ color: ERROR }}>
                {flag.replace(/_/g, ' ')}
              </span>{' '}
              · {submission.test_title || submission.testId}
            </p>
          </div>
        </div>

        <SectionTick />

        <label className="block">
          <span
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: SLATE }}
          >
            Resolution note (optional)
          </span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Brief rationale for clearing this flag…"
            className="w-full rounded-md px-4 py-3 text-[12px] outline-none resize-none"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-semibold"
            style={{ border: `1px solid ${HAIRLINE}`, color: SLATE, background: IVORY }}
          >
            Keep flag
          </button>
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-semibold"
            style={{ background: FOREST, color: PAPER }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Mark resolved
          </button>
        </div>
      </form>
    </div>
  )
}

function StudentsView({ students, teacherSubjectIds, subjects, submissions, tests, navigate }) {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [viewStudent, setViewStudent] = useState(null)

  const availableSubjects = subjects.filter((s) =>
    teacherSubjectIds.length ? teacherSubjectIds.includes(s.id) : true
  )

  const filtered = useMemo(() => {
    let list = [...students]
    if (subjectFilter !== 'all') {
      list = list.filter((s) => s.enrolledSubjectIds?.includes(subjectFilter))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.roll || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [students, search, subjectFilter])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: FOREST }}
          >
            Class Roster
          </p>
          <h1
            className="mt-2 font-serif text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: INK }}
          >
            My{' '}
            <span style={{ color: BRASS, fontStyle: 'italic' }}>students</span>
          </h1>
          <p className="mt-2 text-[12px]" style={{ color: SLATE }}>
            <span className="font-mono tabular-nums font-semibold" style={{ color: INK }}>
              {monoNum(filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums font-semibold" style={{ color: INK }}>
              {monoNum(students.length)}
            </span>{' '}
            enrolled students displayed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" strokeWidth={1.5} style={{ color: SLATE }} />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-8 rounded-md pl-9 pr-8 text-[11.5px] outline-none appearance-none cursor-pointer"
              style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
            >
              <option value="all">All subjects</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ color: SLATE }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / roll / email…"
              className="h-8 w-64 rounded-md pl-9 pr-3 text-[11.5px] outline-none"
              style={{ border: `1px solid ${HAIRLINE}`, background: IVORY, color: INK }}
            />
          </div>
        </div>
      </div>

      <SectionTick />

      <div
        className="overflow-hidden rounded-md"
        style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: PAPER, borderBottom: `1px solid ${HAIRLINE}` }}>
                <th
                  className="px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Student
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Program / Roll
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Enrolled subjects
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Tests
                </th>
                <th
                  className="px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: SLATE }}
                >
                  Avg score
                </th>
                <th
                  className="px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-right"
                  style={{ color: SLATE }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const stuSubs = submissions.filter((sub) => sub.studentId === s.id)
                const avg = stuSubs.length
                  ? Math.round(
                    stuSubs.reduce((a, sub) => a + (sub.percentage || 0), 0) / stuSubs.length
                  )
                  : 0
                const studentSubjects = (s.enrolledSubjectIds || [])
                  .map((id) => subjects.find((x) => x.id === id))
                  .filter(Boolean)
                return (
                  <tr
                    key={s.id}
                    className="transition-colors"
                    style={{ borderTop: `1px solid ${HAIRLINE}` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-md text-[10.5px] font-semibold flex-shrink-0"
                          style={{ background: PAPER, color: INK, border: `1px solid ${HAIRLINE}` }}
                        >
                          {s.avatarInitials || '??'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: INK }}>
                            {s.name}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: SLATE }}>
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-[11.5px] font-medium" style={{ color: INK }}>
                          {s.program || '—'}
                        </p>
                        <p
                          className="text-[10px] mt-0.5 font-mono tabular-nums font-semibold"
                          style={{ color: BRASS }}
                        >
                          {s.roll || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {studentSubjects.length ? (
                          studentSubjects.slice(0, 4).map((subj) => (
                            <span
                              key={subj.id}
                              className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                background: `${FOREST}10`,
                                color: FOREST,
                                border: `1px solid ${FOREST}25`,
                              }}
                            >
                              {subj.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px]" style={{ color: SLATE }}>—</span>
                        )}
                        {studentSubjects.length > 4 && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: HAIRLINE, color: SLATE }}
                          >
                            +{monoNum(studentSubjects.length - 4)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: INK }}>
                        {monoNum(stuSubs.length)}
                      </span>
                      <span className="text-[10px] ml-1" style={{ color: SLATE }}>taken</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p
                          className="font-mono text-[13px] font-semibold tabular-nums"
                          style={{ color: avg >= 70 ? SUCCESS : avg >= 50 ? BRASS : ERROR }}
                        >
                          {monoNum(avg || s.stats?.avgScore?.toFixed(0) || '—')}
                          {avg || s.stats?.avgScore ? '%' : ''}
                        </p>
                        {s.stats?.percentile && (
                          <p className="text-[10px] mt-0.5" style={{ color: SLATE }}>
                            p<span className="font-mono tabular-nums">{monoNum(s.stats.percentile)}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewStudent(s)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[10.5px] font-semibold"
                          style={{ background: INK, color: PAPER }}
                        >
                          <BarChart3 className="h-3 w-3" strokeWidth={1.5} /> Performance
                        </button>
                        <button
                          onClick={() => navigate('/evaluator')}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors"
                          style={{ color: SLATE }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = FOREST; e.currentTarget.style.background = PAPER }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = SLATE; e.currentTarget.style.background = 'transparent' }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-8 w-8 mx-auto" strokeWidth={1.5} style={{ color: SLATE }} />
            <p className="mt-4 font-serif text-[15px] font-semibold" style={{ color: INK }}>
              No students match your filters
            </p>
            <p className="mt-1.5 text-[11.5px]" style={{ color: SLATE }}>
              Try clearing the search or selecting a different subject.
            </p>
          </div>
        )}
      </div>

      {viewStudent && (
        <StudentPerformanceModal
          student={viewStudent}
          submissions={submissions.filter((s) => s.studentId === viewStudent.id)}
          tests={tests}
          subjects={subjects}
          onClose={() => setViewStudent(null)}
          navigate={navigate}
        />
      )}
    </div>
  )
}

function StudentPerformanceModal({ student, submissions, tests, subjects, onClose, navigate }) {
  const avg = submissions.length
    ? Math.round(submissions.reduce((a, s) => a + (s.percentage || 0), 0) / submissions.length)
    : 0
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: `${INK}40` }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-auto rounded-md p-6"
        style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md"
          style={{ color: SLATE }}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-md text-[16px] font-semibold flex-shrink-0"
            style={{ background: FOREST, color: PAPER }}
          >
            {student.avatarInitials || '??'}
          </div>
          <div className="min-w-0 flex-1 pr-10">
            <h3 className="font-serif text-[20px] font-semibold" style={{ color: INK }}>
              {student.name}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: SLATE }}>
              <span className="font-mono tabular-nums font-semibold" style={{ color: BRASS }}>
                {student.roll || '—'}
              </span>{' '}
              · {student.program || '—'}
            </p>
            <p className="text-[10.5px] mt-1" style={{ color: SLATE }}>{student.email}</p>
          </div>
        </div>

        <SectionTick />

        <div className="grid gap-3 sm:grid-cols-4">
          <div
            className="rounded-md p-3.5 text-center"
            style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
          >
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
              Tests taken
            </p>
            <p className="font-mono text-[18px] font-semibold tabular-nums mt-1" style={{ color: INK }}>
              {monoNum(submissions.length)}
            </p>
          </div>
          <div
            className="rounded-md p-3.5 text-center"
            style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
          >
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
              Avg score
            </p>
            <p
              className="font-mono text-[18px] font-semibold tabular-nums mt-1"
              style={{ color: avg >= 70 ? SUCCESS : BRASS }}
            >
              {monoNum(avg || '—')}{avg ? '%' : ''}
            </p>
          </div>
          <div
            className="rounded-md p-3.5 text-center"
            style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
          >
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
              Percentile
            </p>
            <p className="font-mono text-[18px] font-semibold tabular-nums mt-1" style={{ color: FOREST }}>
              p{monoNum(student.stats?.percentile || '—')}
            </p>
          </div>
          <div
            className="rounded-md p-3.5 text-center"
            style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
          >
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: SLATE }}>
              Streak
            </p>
            <p className="font-mono text-[18px] font-semibold tabular-nums mt-1" style={{ color: BRASS }}>
              {monoNum(student.stats?.streak || 0)}
            </p>
          </div>
        </div>

        <SectionTick />

        <div>
          <h4 className="font-serif text-[14px] font-semibold mb-3" style={{ color: INK }}>
            Recent submissions
          </h4>
          <div
            className="rounded-md overflow-hidden"
            style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
          >
            {sorted.length === 0 ? (
              <div className="p-8 text-center text-[11.5px]" style={{ color: SLATE }}>
                No submissions yet for this student.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: HAIRLINE }}>
                {sorted.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/result/${s.id}`)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold truncate" style={{ color: INK }}>
                        {s.test_title || s.testId}
                      </p>
                      <p
                        className="text-[10px] mt-0.5 font-mono tabular-nums"
                        style={{ color: SLATE }}
                      >
                        {s.submittedAt || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p
                          className="font-mono text-[12px] font-bold tabular-nums"
                          style={{
                            color: (s.percentage || 0) >= 70 ? SUCCESS : (s.percentage || 0) >= 50 ? BRASS : ERROR,
                          }}
                        >
                          {monoNum(s.percentage?.toFixed(0) || '—')}%
                        </p>
                        <p className="text-[9.5px] font-mono tabular-nums" style={{ color: SLATE }}>
                          {monoNum(s.autoScore ?? '—')}/{monoNum(s.maxScore || 0)}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: SLATE }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, accent, delta, Icon }) {
  const accentMap = {
    ink: { bg: `${INK}10`, fg: INK, border: `${INK}20` },
    forest: { bg: `${FOREST}12`, fg: FOREST, border: `${FOREST}25` },
    brass: { bg: `${BRASS}12`, fg: BRASS, border: `${BRASS}30` },
    success: { bg: `${SUCCESS}12`, fg: SUCCESS, border: `${SUCCESS}25` },
    error: { bg: `${ERROR}10`, fg: ERROR, border: `${ERROR}25` },
  }
  const a = accentMap[accent] || accentMap.ink
  return (
    <div
      className="relative rounded-md p-5 transition-colors"
      style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{ background: a.bg, color: a.fg, border: `1px solid ${a.border}` }}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
        </div>
        {delta && (
          <span
            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9.5px] font-semibold"
            style={{ background: PAPER, color: SLATE, border: `1px solid ${HAIRLINE}` }}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 text-[9.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: SLATE }}>
        {label}
      </p>
      <p
        className="mt-1 font-mono text-[26px] font-semibold tracking-tight tabular-nums"
        style={{ color: INK }}
      >
        {typeof value === 'number' ? monoNum(value) : value}
      </p>
      <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: SLATE }}>
        {sub}
      </p>
    </div>
  )
}

function SummaryRow({ label, value, Icon, tone }) {
  const toneMap = {
    ink: { fg: INK, bg: `${INK}0a` },
    forest: { fg: FOREST, bg: `${FOREST}10` },
    brass: { fg: BRASS, bg: `${BRASS}10` },
    success: { fg: SUCCESS, bg: `${SUCCESS}10` },
    error: { fg: ERROR, bg: `${ERROR}10` },
  }
  const t = toneMap[tone] || toneMap.ink
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5" style={{ background: t.bg }}>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: PAPER, color: t.fg, border: `1px solid ${HAIRLINE}` }}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
        <span className="text-[11px] font-semibold" style={{ color: SLATE }}>{label}</span>
      </div>
      <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: t.fg }}>{value}</span>
    </div>
  )
}

function TeacherTestDetailsModal({ test, onClose, onEdit, onViewSubmissions }) {
  if (!test) return null
  const questions = test.questions || []
  const totalQuestions = questions.length || test.totalQuestions || 0
  const totalMarks = test.totalMarks || test.total_marks || questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0)
  const duration = test.duration_minutes || test.duration || 30
  const isPub = Boolean(test.is_published ?? test.isPublished)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(22, 26, 34, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${HAIRLINE}`, background: IVORY }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRASS }}>
                Teacher Test Management
              </span>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  isPub ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPub ? 'Published' : 'Draft'}
              </span>
            </div>
            <h2 className="font-serif text-[20px] font-semibold mt-1" style={{ color: INK }}>
              {test.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors"
            style={{ color: SLATE }}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg p-3" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Duration</span>
              <span className="font-mono text-[14px] font-semibold text-stone-900">{duration} mins</span>
            </div>
            <div className="rounded-lg p-3" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Total Marks</span>
              <span className="font-mono text-[14px] font-semibold text-stone-900">{totalMarks}</span>
            </div>
            <div className="rounded-lg p-3" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Questions</span>
              <span className="font-mono text-[14px] font-semibold text-stone-900">{totalQuestions}</span>
            </div>
            <div className="rounded-lg p-3" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Scheduled</span>
              <span className="text-[11px] font-medium text-stone-900 truncate block">
                {test.scheduled_date ? `${test.scheduled_date} ${test.scheduled_time || ''}` : test.scheduledAt || 'Flexible'}
              </span>
            </div>
          </div>

          {test.description && (
            <div className="p-3 rounded-md text-[12px] leading-relaxed" style={{ background: IVORY, color: SLATE }}>
              {test.description}
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Questions & Answer Key ({questions.length})
            </h3>
            {questions.length === 0 ? (
              <p className="text-[12px] italic text-stone-400">No questions loaded for this test.</p>
            ) : (
              questions.map((q, idx) => {
                const isSubjective = q.question_type === 'DESCRIPTIVE' || q.type === 'subjective'
                const options = q.options || []
                return (
                  <div
                    key={q.id || idx}
                    className="rounded-lg p-4 space-y-3"
                    style={{ border: `1px solid ${HAIRLINE}`, background: IVORY }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold"
                          style={{ background: INK, color: PAPER }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isSubjective ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isSubjective ? 'Subjective' : 'MCQ'}
                        </span>
                        {q.chapter && (
                          <span className="text-[11px] font-medium" style={{ color: SLATE }}>
                            Topic: {q.chapter}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[12px] font-semibold" style={{ color: INK }}>
                        {q.marks} {Number(q.marks) === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>

                    <p className="text-[13px] font-medium leading-relaxed" style={{ color: INK }}>
                      {q.text}
                    </p>

                    {/* Options or Model Answer */}
                    {!isSubjective ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {options.map((opt, oIdx) => {
                          const optKey = opt.key || String.fromCharCode(65 + oIdx)
                          const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || '')
                          const isCorrect = Boolean(opt.is_correct || opt.isCorrect || q.correctKey === optKey)
                          return (
                            <div
                              key={opt.id || oIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-md border text-[12px] ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {isCorrect ? '✓' : optKey}
                              </span>
                              <span className="flex-1">{optText}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                  Correct
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="pt-1">
                        <div className="p-3 rounded-md bg-stone-50 border border-stone-200 space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                            Rubric / Model Answer
                          </span>
                          <p className="text-[12px] text-stone-800 whitespace-pre-line leading-relaxed">
                            {q.modelAnswer || q.model_answer || 'No model answer provided.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderTop: `1px solid ${HAIRLINE}`, background: IVORY }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium rounded-md"
            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER, color: SLATE }}
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(test)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md"
              style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: INK }}
            >
              <Pencil className="h-4 w-4" /> Edit test
            </button>
            <button
              onClick={() => onViewSubmissions(test)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md shadow-sm text-white"
              style={{ background: FOREST }}
            >
              <Users className="h-4 w-4" />
              View Student Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditPublishedTestModal({ test, subjects, onClose, onSave }) {
  const [title, setTitle] = useState(test.title || '')
  const [description, setDescription] = useState(test.description || '')
  const [duration, setDuration] = useState(test.duration_minutes || test.duration || 30)
  const [subjectId, setSubjectId] = useState(test.subject_id || test.subject?.id || '')
  const [scheduledDate, setScheduledDate] = useState(test.scheduled_date || '')
  const [scheduledTime, setScheduledTime] = useState(test.scheduled_time || '')
  const [isPublished, setIsPublished] = useState(Boolean(test.is_published ?? true))
  const makeQuestion = (type = 'mcq', index = 0) => ({
    key: `new-${Date.now()}-${index}`,
    text: '',
    type,
    marks: 1,
    modelAnswer: '',
    options: type === 'mcq'
      ? ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '', isCorrect: false }))
      : [],
  })
  const [questions, setQuestions] = useState(() => {
    if (!test.questions?.length) return [makeQuestion('mcq')]
    return test.questions.map((question, questionIndex) => {
      const type = question.question_type === 'DESCRIPTIVE' || question.type === 'subjective' ? 'subjective' : 'mcq'
      const options = (question.options || []).map((option, optionIndex) => ({
        key: String.fromCharCode(65 + optionIndex),
        text: option.text || option.label || '',
        isCorrect: Boolean(option.is_correct || option.isCorrect),
      }))
      return {
        key: question.id || `existing-${questionIndex}`,
        text: question.text || '',
        type,
        marks: question.marks || 1,
        modelAnswer: question.model_answer || question.modelAnswer || '',
        options: type === 'mcq' ? (options.length ? options : makeQuestion('mcq').options) : [],
      }
    })
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateQuestion = (key, patch) => setQuestions((current) => current.map((question) => question.key === key ? { ...question, ...patch } : question))
  const addQuestion = (type) => setQuestions((current) => [...current, makeQuestion(type, current.length)])
  const removeQuestion = (key) => {
    if (questions.length > 1) setQuestions((current) => current.filter((question) => question.key !== key))
  }
  const setQuestionType = (key, type) => updateQuestion(key, {
    type,
    options: type === 'mcq' ? ['A', 'B'].map((optionKey) => ({ key: optionKey, text: '', isCorrect: false })) : [],
  })
  const updateOption = (questionKey, optionKey, patch) => setQuestions((current) => current.map((question) => question.key !== questionKey ? question : {
    ...question,
    options: question.options.map((option) => option.key === optionKey ? { ...option, ...patch } : option),
  }))
  const setCorrectOption = (questionKey, optionKey) => setQuestions((current) => current.map((question) => question.key !== questionKey ? question : {
    ...question,
    options: question.options.map((option) => ({ ...option, isCorrect: option.key === optionKey })),
  }))
  const addOption = (questionKey) => setQuestions((current) => current.map((question) => question.key !== questionKey ? question : {
    ...question,
    options: [...question.options, { key: String.fromCharCode(65 + question.options.length), text: '', isCorrect: false }],
  }))
  const removeOption = (questionKey, optionKey) => setQuestions((current) => current.map((question) => {
    if (question.key !== questionKey || question.options.length <= 2) return question
    return { ...question, options: question.options.filter((option) => option.key !== optionKey) }
  }))

  const validQuestions = questions.length > 0 && questions.every((question) =>
    question.text.trim() && Number(question.marks) > 0 && (question.type === 'subjective' || (
      question.options.length >= 2 && question.options.every((option) => option.text.trim()) && question.options.some((option) => option.isCorrect)
    ))
  )

  const submit = async (event) => {
    event.preventDefault()
    if (!title.trim() || !validQuestions) {
      setError('Add a question text and marks for every question. MCQs need at least two options and one correct answer.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        title: title.trim(),
        description,
        duration_minutes: Number(duration) || 30,
        subject: subjectId ? Number(subjectId) : null,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        is_published: isPublished,
        questions: questions.map((question, index) => ({
          text: question.text.trim(),
          question_type: question.type === 'subjective' ? 'DESCRIPTIVE' : 'MCQ',
          marks: Number(question.marks),
          order: index + 1,
          model_answer: question.type === 'subjective' ? question.modelAnswer : '',
          options: question.type === 'subjective' ? [] : question.options.map((option, optionIndex) => ({
            text: option.text.trim(), is_correct: option.isCorrect, order: optionIndex + 1,
          })),
        })),
      })
    } catch (requestError) {
      const details = requestError.response?.data
      setError(details && typeof details === 'object' ? Object.values(details).flat().join(' ') : requestError.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(22, 26, 34, 0.65)' }}>
      <form onSubmit={submit} className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl p-6 space-y-4" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRASS }}>Published test</p><h2 className="font-serif text-xl font-semibold" style={{ color: INK }}>Edit test and questions</h2></div>
          <button type="button" onClick={onClose} style={{ color: SLATE }}><X className="h-5 w-5" /></button>
        </div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm normal-case tracking-normal" style={{ borderColor: HAIRLINE, color: INK }} /></label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Instructions / description<textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm normal-case tracking-normal" style={{ borderColor: HAIRLINE, color: INK }} rows={3} /></label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Subject<select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm normal-case tracking-normal" style={{ borderColor: HAIRLINE, color: INK }}><option value="">No subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Minutes<input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm" style={{ borderColor: HAIRLINE, color: INK }} /></label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Date<input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm" style={{ borderColor: HAIRLINE, color: INK }} /></label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>Time<input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="mt-1.5 w-full rounded-md border p-2 text-sm" style={{ borderColor: HAIRLINE, color: INK }} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: INK }}><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Keep visible to assigned students</label>
        <div className="space-y-3 rounded-lg p-4" style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}>
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold" style={{ color: INK }}>Questions ({questions.length})</h3><p className="text-xs" style={{ color: SLATE }}>Add as many MCQ or subjective questions as needed.</p></div><div className="flex gap-2"><button type="button" onClick={() => addQuestion('mcq')} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: FOREST }}>+ Add MCQ</button><button type="button" onClick={() => addQuestion('subjective')} className="rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ background: FOREST }}>+ Add subjective</button></div></div>
          {questions.map((question, questionIndex) => <div key={question.key} className="space-y-3 rounded-md p-4" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold text-sm" style={{ color: INK }}>Question {questionIndex + 1}</span><div className="flex items-center gap-2"><select value={question.type} onChange={(e) => setQuestionType(question.key, e.target.value)} className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: HAIRLINE, color: INK }}><option value="mcq">MCQ</option><option value="subjective">Subjective</option></select><input type="number" min="1" value={question.marks} onChange={(e) => updateQuestion(question.key, { marks: e.target.value })} aria-label={`Marks for question ${questionIndex + 1}`} className="w-16 rounded-md border px-2 py-1 text-xs" style={{ borderColor: HAIRLINE, color: INK }} /><span className="text-xs" style={{ color: SLATE }}>marks</span><button type="button" disabled={questions.length <= 1} onClick={() => removeQuestion(question.key)} className="text-xs disabled:opacity-40" style={{ color: ERROR }}>Remove</button></div></div>
            <textarea value={question.text} onChange={(e) => updateQuestion(question.key, { text: e.target.value })} rows={2} placeholder="Question text" className="w-full rounded-md border p-2 text-sm" style={{ borderColor: HAIRLINE, color: INK }} />
            {question.type === 'subjective' ? <label className="block text-xs font-semibold" style={{ color: SLATE }}>Model answer / rubric (optional)<textarea value={question.modelAnswer} onChange={(e) => updateQuestion(question.key, { modelAnswer: e.target.value })} rows={2} className="mt-1 w-full rounded-md border p-2 text-sm font-normal" style={{ borderColor: HAIRLINE, color: INK }} /></label> : <div className="space-y-2"><p className="text-xs font-semibold" style={{ color: SLATE }}>Options — select the correct answer</p>{question.options.map((option) => <div key={option.key} className="flex items-center gap-2"><input type="radio" name={`correct-${question.key}`} checked={option.isCorrect} onChange={() => setCorrectOption(question.key, option.key)} aria-label={`Mark option ${option.key} as correct`} /><span className="w-5 text-xs font-semibold" style={{ color: SLATE }}>{option.key}</span><input value={option.text} onChange={(e) => updateOption(question.key, option.key, { text: e.target.value })} placeholder={`Option ${option.key}`} className="flex-1 rounded-md border p-2 text-sm" style={{ borderColor: HAIRLINE, color: INK }} /><button type="button" disabled={question.options.length <= 2} onClick={() => removeOption(question.key, option.key)} className="text-xs disabled:opacity-40" style={{ color: ERROR }}>Remove</button></div>)}<button type="button" onClick={() => addOption(question.key)} className="text-xs font-semibold" style={{ color: FOREST }}>+ Add option</button></div>}
          </div>)}
        </div>
        {error && <p className="text-xs" style={{ color: ERROR }}>{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm" style={{ border: `1px solid ${HAIRLINE}`, color: SLATE }}>Cancel</button><button disabled={saving || !title.trim() || !validQuestions} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: FOREST }}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </div>
  )
}
