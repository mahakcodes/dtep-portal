import { useState, useMemo } from 'react'
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  FileText,
  BarChart3,
  LogOut,
  Plus,
  X,
  Mail,
  Lock,
  User,
  Building2,
  Calendar,
  Trash2,
  Power,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Award,
  AlertTriangle,
  Clock,
  Hash,
  UserCheck,
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

const mono = 'font-mono tabular-nums'

function SectionTick() {
  return (
    <div className="flex items-center gap-2 select-none">
      <span style={{ borderColor: HAIRLINE }} className="w-8 border-t" />
      <span style={{ backgroundColor: HAIRLINE }} className="h-2 w-2 rounded-full" />
      <span style={{ borderColor: HAIRLINE }} className="w-8 border-t" />
    </div>
  )
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="space-y-3">
      <SectionTick />
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: INK }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-1.5 text-sm" style={{ color: SLATE }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function Chip({ children, tone = 'default' }) {
  const tones = {
    default: { bg: IVORY, fg: INK, border: HAIRLINE },
    forest: { bg: '#E9F0EC', fg: FOREST, border: '#C9D9D0' },
    brass: { bg: '#F6F1E6', fg: BRASS, border: '#E5D9BF' },
    success: { bg: '#EDF3EA', fg: SUCCESS, border: '#D4E0CC' },
    error: { bg: '#F5E8E6', fg: ERROR, border: '#E6C9C5' },
    slate: { bg: '#EFEFEC', fg: SLATE, border: HAIRLINE },
  }
  const t = tones[tone]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: t.bg, color: t.fg, borderColor: t.border }}
    >
      {children}
    </span>
  )
}

function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors border disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  const variants = {
    primary: { bg: FOREST, fg: PAPER, border: FOREST, hoverBg: '#183A2F' },
    secondary: { bg: PAPER, fg: INK, border: HAIRLINE, hoverBg: IVORY },
    danger: { bg: PAPER, fg: ERROR, border: HAIRLINE, hoverBg: '#FBEDEC' },
    ghost: { bg: 'transparent', fg: SLATE, border: 'transparent', hoverBg: IVORY },
    success: { bg: PAPER, fg: SUCCESS, border: HAIRLINE, hoverBg: '#EDF3EA' },
  }
  const v = variants[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.fg,
        borderColor: v.border,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = v.hoverBg)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = v.bg)}
    >
      {children}
    </button>
  )
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-md border ${className}`}
      style={{ backgroundColor: PAPER, borderColor: HAIRLINE }}
    >
      {children}
    </div>
  )
}

function Input({ label, icon: Icon, type = 'text', value, onChange, onBlur, placeholder, error, success }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
          {label}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            strokeWidth={1.5}
            style={{ color: error ? ERROR : success ? SUCCESS : SLATE }}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full rounded-md border bg-white px-3 py-2 text-sm font-medium outline-none transition-colors"
          style={{
            paddingLeft: Icon ? '2.25rem' : undefined,
            color: INK,
            borderColor: error ? ERROR : success ? SUCCESS : HAIRLINE,
            backgroundColor: error ? '#FBEDEC' : success ? '#EDF3EA' : PAPER,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? ERROR : FOREST
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = error ? ERROR : success ? SUCCESS : HAIRLINE
          }}
        />
      </div>
      {error && <p className="mt-1 text-[11px]" style={{ color: ERROR }}>{error}</p>}
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-md border px-3 py-2 text-sm font-medium outline-none transition-colors"
        style={{ color: INK, borderColor: HAIRLINE, backgroundColor: PAPER }}
        onFocus={(e) => (e.currentTarget.style.borderColor = FOREST)}
        onBlur={(e) => (e.currentTarget.style.borderColor = HAIRLINE)}
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: INK, opacity: 0.5 }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-md border p-6 max-h-[90vh] overflow-auto"
        style={{ backgroundColor: PAPER, borderColor: HAIRLINE }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          style={{ color: SLATE }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = IVORY }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="mb-5 space-y-2 pr-8">
          <h3 className="text-xl font-semibold" style={{ color: INK }}>{title}</h3>
          {subtitle && <p className="text-sm" style={{ color: SLATE }}>{subtitle}</p>}
          <div className="pt-1"><SectionTick /></div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const {
    user,
    logout,
    teachers,
    students,
    addTeacher,
    addStudent,
    assignStudentToTeacher,
    unassignStudentFromTeacher,
    toggleUserStatus,
    deleteUser,
    subjects,
    tests,
    submissions,
    assignSubjectToTeacher,
    enrollStudentInSubject,
  } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAssignSubject, setShowAssignSubject] = useState(null)
  const [showEnrollStudent, setShowEnrollStudent] = useState(null)
  const [showAssignTeacher, setShowAssignTeacher] = useState(null)

  const nav = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'teachers', label: 'Teachers', icon: UserCheck },
    { key: 'students', label: 'Students', icon: GraduationCap },
    { key: 'tests', label: 'Tests', icon: FileText },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ]

  const totalTeachers = teachers.length
  const totalStudents = students.length
  const totalTests = tests.length
  const totalSubmissions = submissions.length
  const activeTeachers = teachers.filter(t => t.status === 'active' || t.is_active !== false).length
  const activeStudents = students.filter(s => s.status === 'active' || s.is_active !== false).length
  const avgScore = submissions.length
    ? (submissions.reduce((a, s) => a + (s.percentage || 0), 0) / submissions.length).toFixed(1)
    : '0.0'

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter(t =>
      (t.name || t.full_name || t.username || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q) ||
      String(t.id).toLowerCase().includes(q)
    )
  }, [teachers, teacherSearch])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      (s.name || s.full_name || s.username || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.program || '').toLowerCase().includes(q) ||
      (s.roll || s.username || '').toLowerCase().includes(q) ||
      String(s.id).toLowerCase().includes(q)
    )
  }, [students, studentSearch])

  const getSubjectById = (id) => subjects.find(s => s.id === id)
  const countStudentsForTeacher = (t) => {
    if (t.assigned_students_count !== undefined) return t.assigned_students_count
    if (Array.isArray(t.assigned_students)) return t.assigned_students.length
    const tSubs = t.subjectIds || []
    return students.filter(s => s.enrolledSubjectIds?.some(sid => tSubs.includes(sid))).length
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK }}>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-64 flex-col border-r"
        style={{ backgroundColor: IVORY, borderColor: HAIRLINE }}
      >
        <div
          className="flex h-16 items-center gap-3 px-6 border-b"
          style={{ borderColor: HAIRLINE }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ backgroundColor: FOREST, color: PAPER }}
          >
            <BookMarked className="h-4.5 w-4.5" strokeWidth={1.5} />
          </div>
          <div className="leading-none">
            <p className="text-base font-semibold tracking-tight" style={{ color: INK }}>DTEP</p>
            <p className="text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: SLATE }}>Admin Console</p>
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
                className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: active ? FOREST : 'transparent',
                  color: active ? PAPER : SLATE,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = PAPER
                    e.currentTarget.style.color = INK
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = SLATE
                  }
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: HAIRLINE }}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold"
                style={{ backgroundColor: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: INK }}>{user?.name}</p>
                <p className={`text-[11px] truncate ${mono}`} style={{ color: SLATE }}>{user?.id}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md p-2.5" style={{ backgroundColor: IVORY, border: `1px solid ${HAIRLINE}` }}>
                <p className={`text-lg font-semibold ${mono}`} style={{ color: INK }}>{activeTeachers}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: SLATE }}>Teachers</p>
              </div>
              <div className="rounded-md p-2.5" style={{ backgroundColor: IVORY, border: `1px solid ${HAIRLINE}` }}>
                <p className={`text-lg font-semibold ${mono}`} style={{ color: FOREST }}>{activeStudents}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: SLATE }}>Students</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors border"
              style={{ color: SLATE, borderColor: HAIRLINE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FBEDEC'
                e.currentTarget.style.color = ERROR
                e.currentTarget.style.borderColor = ERROR
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = SLATE
                e.currentTarget.style.borderColor = HAIRLINE
              }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </Card>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div
          className="sticky top-0 z-30 border-b"
          style={{ backgroundColor: PAPER, borderColor: HAIRLINE }}
        >
          <div className="mx-auto flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
            <div className="flex flex-1 items-center gap-4 max-w-xl">
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  strokeWidth={1.5}
                  style={{ color: SLATE }}
                />
                <input
                  type="search"
                  placeholder={
                    activeTab === 'teachers' ? 'Search teachers by name, email, ID…' :
                    activeTab === 'students' ? 'Search students by name, roll, program…' :
                    'Search the registry…'
                  }
                  value={
                    activeTab === 'teachers' ? teacherSearch :
                    activeTab === 'students' ? studentSearch : ''
                  }
                  onChange={(e) => {
                    if (activeTab === 'teachers') setTeacherSearch(e.target.value)
                    else if (activeTab === 'students') setStudentSearch(e.target.value)
                  }}
                  className="h-10 w-full rounded-md border px-3 pl-9 text-sm outline-none transition-colors"
                  style={{ color: INK, borderColor: HAIRLINE, backgroundColor: IVORY }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = FOREST; e.currentTarget.style.backgroundColor = PAPER }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = HAIRLINE; e.currentTarget.style.backgroundColor = IVORY }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[11px] ${mono}`} style={{ color: SLATE }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
              </span>
              <div className="h-6 w-px" style={{ backgroundColor: HAIRLINE }} />
              <div className="hidden sm:flex items-center gap-2.5 rounded-md py-1 pr-2 pl-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold"
                  style={{ backgroundColor: FOREST, color: PAPER }}
                >
                  {user?.avatarInitials || 'AD'}
                </div>
                <div className="text-left leading-none">
                  <p className="text-sm font-semibold" style={{ color: INK }}>{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] capitalize mt-0.5" style={{ color: SLATE }}>Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-none px-6 py-8 lg:px-8 lg:py-10">
          {activeTab === 'overview' && (
            <OverviewSection
              totalTeachers={totalTeachers}
              totalStudents={totalStudents}
              totalTests={totalTests}
              activeTeachers={activeTeachers}
              activeStudents={activeStudents}
              avgScore={avgScore}
              teachers={teachers}
              students={students}
              subjects={subjects}
              submissions={submissions}
              onAddTeacher={() => setShowAddTeacher(true)}
              onAddStudent={() => setShowAddStudent(true)}
              onViewTests={() => setActiveTab('tests')}
              onExportCsv={() => {
                const rows = [
                  ['Student', 'Roll', 'Test', 'Score', 'Max', 'Percentage', 'Status', 'Submitted'],
                  ...submissions.map((s) => {
                    const student = students.find((x) => x.id === s.studentId)
                    return [
                      student?.name || s.studentId,
                      student?.roll || '',
                      s.test_title || s.testId,
                      s.autoScore ?? '',
                      s.maxScore ?? '',
                      s.percentage?.toFixed(1) ?? '',
                      s.status || '',
                      s.submittedAt || '',
                    ]
                  }),
                ]
                const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'dtep-admin-export.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
              countStudentsForTeacher={countStudentsForTeacher}
              getSubjectById={getSubjectById}
            />
          )}
          {activeTab === 'teachers' && (
            <TeachersSection
              filteredTeachers={filteredTeachers}
              teacherSearch={teacherSearch}
              setTeacherSearch={setTeacherSearch}
              onAddTeacher={() => setShowAddTeacher(true)}
              onToggleStatus={(id) => toggleUserStatus(id, 'evaluator')}
              onDelete={(id) => deleteUser(id, 'evaluator')}
              onAssignSubject={(teacher) => setShowAssignSubject(teacher)}
              countStudentsForTeacher={countStudentsForTeacher}
              getSubjectById={getSubjectById}
              totalTeachers={totalTeachers}
            />
          )}
          {activeTab === 'students' && (
            <StudentsSection
              filteredStudents={filteredStudents}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              onAddStudent={() => setShowAddStudent(true)}
              onToggleStatus={(id) => toggleUserStatus(id, 'student')}
              onDelete={(id) => deleteUser(id, 'student')}
              onEnroll={(student) => setShowEnrollStudent(student)}
              onAssignTeacher={(student) => setShowAssignTeacher(student)}
              getSubjectById={getSubjectById}
              totalStudents={totalStudents}
            />
          )}
          {activeTab === 'tests' && (
            <TestsSection tests={tests} teachers={teachers} subjects={subjects} submissions={submissions} getSubjectById={getSubjectById} />
          )}
          {activeTab === 'reports' && (
            <ReportsSection submissions={submissions} tests={tests} students={students} teachers={teachers} subjects={subjects} getSubjectById={getSubjectById} />
          )}
        </div>
      </main>

      {showAddTeacher && (
        <AddTeacherModal
          onClose={() => setShowAddTeacher(false)}
          onSubmit={async (data) => {
            await addTeacher(data)
            setShowAddTeacher(false)
          }}
          subjects={subjects}
        />
      )}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onSubmit={async (data) => {
            await addStudent(data)
            setShowAddStudent(false)
          }}
          subjects={subjects}
        />
      )}
      {showAssignSubject && (
        <AssignSubjectModal
          teacher={showAssignSubject}
          subjects={subjects}
          onClose={() => setShowAssignSubject(null)}
          onSubmit={(subjectId) => {
            assignSubjectToTeacher(showAssignSubject.id, subjectId)
            setShowAssignSubject(null)
          }}
        />
      )}
      {showEnrollStudent && (
        <EnrollStudentModal
          student={showEnrollStudent}
          subjects={subjects}
          onClose={() => setShowEnrollStudent(null)}
          onSubmit={(subjectId) => {
            enrollStudentInSubject(showEnrollStudent.id, subjectId)
            setShowEnrollStudent(null)
          }}
        />
      )}
      {showAssignTeacher && (
        <AssignTeacherModal
          student={showAssignTeacher}
          teachers={teachers}
          onClose={() => setShowAssignTeacher(null)}
          onSubmit={async (teacherId) => {
            await assignStudentToTeacher({
              student_id: showAssignTeacher.id,
              teacher_id: teacherId,
            })
          }}
          onUnassign={async (teacherId) => {
            await unassignStudentFromTeacher({
              student_id: showAssignTeacher.id,
              teacher_id: teacherId,
            })
          }}
        />
      )}
    </div>
  )
}

function OverviewSection({
  totalTeachers, totalStudents, totalTests,
  activeTeachers, activeStudents, avgScore,
  teachers, students, subjects, submissions,
  onAddTeacher, onAddStudent, onViewTests, onExportCsv,
  countStudentsForTeacher, getSubjectById,
}) {
  const recentTeachers = [...teachers].slice(0, 5)
  const recentSubs = [...submissions].reverse().slice(0, 5)
  const getStudentById = (id) => students.find(s => s.id === id)

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Admin Overview"
          title={<span>Institution registry — <span style={{ color: FOREST }}>semester status</span></span>}
          subtitle={
            <span>
              <span className={`${mono} font-semibold`} style={{ color: INK }}>{totalTests}</span> tests configured ·{' '}
              <span className={`${mono} font-semibold`} style={{ color: FOREST }}>{activeTeachers}</span> active teachers ·{' '}
              <span className={`${mono} font-semibold`} style={{ color: BRASS }}>{activeStudents}</span> active students
            </span>
          }
        />
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={onAddTeacher}>
            <UserCheck className="h-4 w-4" strokeWidth={1.5} /> Add Teacher
          </Button>
          <Button variant="primary" onClick={onAddStudent}>
            <GraduationCap className="h-4 w-4" strokeWidth={1.5} /> Add Student
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Teachers" value={totalTeachers} sub={`${activeTeachers} active`} tone="ink" Icon={UserCheck} />
        <StatCard label="Total Students" value={totalStudents} sub={`${activeStudents} active`} tone="forest" Icon={GraduationCap} />
        <StatCard label="Tests Created" value={totalTests} sub={`${submissions.length} submissions`} tone="brass" Icon={ClipboardList} />
        <StatCard label="Avg. Score" value={`${avgScore}%`} sub="Across all graded" tone="success" Icon={Award} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="mb-2"><SectionTick /></div>
              <h3 className="text-lg font-semibold" style={{ color: INK }}>Active Faculty</h3>
              <p className="text-xs mt-1" style={{ color: SLATE }}>Faculty roster · classes &amp; assessments</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: SLATE }}>
              <Hash className="h-3.5 w-3.5" strokeWidth={1.5} /> <span className={mono}>{teachers.length}</span>
            </div>
          </div>
          <div className="space-y-1">
            {recentTeachers.map((t) => {
              const stuCount = countStudentsForTeacher(t)
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 rounded-md p-3 transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = IVORY)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
                    >
                      {t.avatarInitials || (t.name || t.full_name || t.username || 'Teacher').split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: INK }}>{t.name}</p>
                      <p className={`text-[11px] truncate ${mono}`} style={{ color: SLATE }}>{t.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm font-semibold ${mono}`} style={{ color: INK }}>{t.stats?.testsCreated ?? 0}</p>
                      <p className="text-[10px]" style={{ color: SLATE }}>tests</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${mono}`} style={{ color: FOREST }}>{stuCount}</p>
                      <p className="text-[10px]" style={{ color: SLATE }}>students</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {(t.subjectIds || []).slice(0, 2).map(sid => {
                        const s = getSubjectById(sid)
                        return s ? <Chip key={sid} tone="forest">{s.code}</Chip> : null
                      })}
                      {(t.subjectIds || []).length > 2 && (
                        <Chip tone="slate">+{(t.subjectIds || []).length - 2}</Chip>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <div className="mb-4">
              <div className="mb-2"><SectionTick /></div>
              <h3 className="text-lg font-semibold" style={{ color: INK }}>Department Distribution</h3>
              <p className="text-xs mt-1" style={{ color: SLATE }}>Active students by department</p>
            </div>
            <div className="space-y-3.5">
              {Array.from(new Set(subjects.map(s => s.department))).map((dept) => {
                const deptSubjects = subjects.filter(s => s.department === dept).map(s => s.id)
                const count = students.filter(s => s.enrolledSubjectIds?.some(id => deptSubjects.includes(id))).length
                const max = Math.max(1, ...Array.from(new Set(subjects.map(s => s.department))).map(d => {
                  const ds = subjects.filter(s => s.department === d).map(s => s.id)
                  return students.filter(st => st.enrolledSubjectIds?.some(id => ds.includes(id))).length
                }))
                const pct = (count / max) * 100
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: INK }}>{dept}</span>
                      <span className={`font-semibold ${mono}`} style={{ color: SLATE }}>{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: IVORY }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: FOREST }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="mb-2"><SectionTick /></div>
              <h3 className="text-lg font-semibold" style={{ color: INK }}>Quick actions</h3>
            </div>
            <div className="grid gap-2.5 grid-cols-2">
              <Button variant="secondary" onClick={onAddTeacher}>
                <UserCheck className="h-4 w-4" strokeWidth={1.5} /> Add Teacher
              </Button>
              <Button variant="primary" onClick={onAddStudent}>
                <GraduationCap className="h-4 w-4" strokeWidth={1.5} /> Add Student
              </Button>
              <Button variant="secondary" onClick={onViewTests}>
                <FileText className="h-4 w-4" strokeWidth={1.5} /> View Tests
              </Button>
              <Button variant="secondary" onClick={onExportCsv}>
                <BarChart3 className="h-4 w-4" strokeWidth={1.5} /> Export CSV
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="mb-2"><SectionTick /></div>
            <h3 className="text-lg font-semibold" style={{ color: INK }}>Recent Submissions</h3>
            <p className="text-xs mt-1" style={{ color: SLATE }}>Latest graded activity across the platform</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: IVORY }}>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Student</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Test</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Submitted</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Score</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: SLATE }}>No submissions yet</td>
                </tr>
              ) : recentSubs.map((s) => {
                const stu = getStudentById(s.studentId)
                return (
                  <tr key={s.id} className="border-t" style={{ borderColor: HAIRLINE }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold"
                          style={{ backgroundColor: IVORY, border: `1px solid ${HAIRLINE}` }}
                        >
                          {stu?.avatarInitials || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: INK }}>{stu?.name || 'Unknown'}</p>
                          <p className={`text-[11px] ${mono}`} style={{ color: SLATE }}>{s.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium truncate max-w-xs" style={{ color: INK }}>{s.test_title || s.testId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${mono}`} style={{ color: SLATE }}>{s.submittedAt}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className={`text-sm font-semibold ${mono}`} style={{ color: s.percentage >= 60 ? SUCCESS : ERROR }}>
                        {s.percentage?.toFixed(1)}%
                      </p>
                      <p className={`text-[11px] ${mono}`} style={{ color: SLATE }}>{s.autoScore}/{s.maxScore}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={s.status === 'graded' ? 'success' : s.status === 'flagged' ? 'error' : 'brass'}>
                        {s.status}
                      </Chip>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, sub, tone, Icon }) {
  const tones = {
    ink: { fg: INK, bg: IVORY },
    forest: { fg: FOREST, bg: '#E9F0EC' },
    brass: { fg: BRASS, bg: '#F6F1E6' },
    success: { fg: SUCCESS, bg: '#EDF3EA' },
  }
  const t = tones[tone]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{ backgroundColor: t.bg, color: t.fg }}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${mono}`} style={{ color: INK }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: SLATE }}>{sub}</p>
    </Card>
  )
}

function TeachersSection({
  filteredTeachers, teacherSearch, setTeacherSearch,
  onAddTeacher, onToggleStatus, onDelete, onAssignSubject,
  countStudentsForTeacher, getSubjectById, totalTeachers,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Faculty Directory"
          title={<span>Teacher <span style={{ color: FOREST }}>registry</span></span>}
          subtitle={
            <span>
              <span className={`${mono} font-semibold`} style={{ color: INK }}>{filteredTeachers.length}</span> results ·{' '}
              <span className={`${mono}`} style={{ color: SLATE }}>{totalTeachers} total faculty</span>
            </span>
          }
        />
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ color: SLATE }}
            />
            <input
              type="search"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Name, email, ID, dept…"
              className="h-10 w-64 rounded-md border px-3 pl-9 text-sm outline-none transition-colors"
              style={{ color: INK, borderColor: HAIRLINE, backgroundColor: PAPER }}
              onFocus={(e) => (e.currentTarget.style.borderColor = FOREST)}
              onBlur={(e) => (e.currentTarget.style.borderColor = HAIRLINE)}
            />
          </div>
          <Button variant="primary" onClick={onAddTeacher}>
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Teacher
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: IVORY }}>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Teacher</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Department</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Subjects</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Joined</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Tests</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Students</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Search className="h-7 w-7 mx-auto mb-3" strokeWidth={1.5} style={{ color: SLATE }} />
                    <p className="text-sm font-semibold" style={{ color: INK }}>No teachers match your search</p>
                    <p className="text-xs mt-1" style={{ color: SLATE }}>Try a different name, email, or department</p>
                  </td>
                </tr>
              ) : filteredTeachers.map((t) => {
                const stuCount = countStudentsForTeacher(t)
                return (
                  <tr key={t.id} className="border-t transition-colors" style={{ borderColor: HAIRLINE }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
                        >
                          {t.avatarInitials || (t.name || t.full_name || t.username || 'Teacher').split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: INK }}>{t.name}</p>
                          <a
                            href={`mailto:${t.email}`}
                            className="text-[11px] truncate flex items-center gap-1"
                            style={{ color: SLATE }}
                          >
                            <Mail className="h-3 w-3" strokeWidth={1.5} /> {t.email}
                          </a>
                          <p className={`text-[10px] ${mono} mt-0.5`} style={{ color: SLATE }}>{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: INK }}>
                        <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: SLATE }} />
                        {t.department}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                        {(t.subjectIds || []).map(sid => {
                          const s = getSubjectById(sid)
                          return s ? <Chip key={sid} tone="forest">{s.code}</Chip> : null
                        })}
                        {(!t.subjectIds || t.subjectIds.length === 0) && (
                          <span className="text-[11px]" style={{ color: SLATE }}>None assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: INK }}>
                        <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: SLATE }} />
                        {t.joined}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className={`text-sm font-semibold ${mono}`} style={{ color: INK }}>{t.stats?.testsCreated ?? 0}</p>
                      <p className="text-[10px]" style={{ color: SLATE }}>created</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className={`text-sm font-semibold ${mono}`} style={{ color: FOREST }}>{stuCount}</p>
                      <p className="text-[10px]" style={{ color: SLATE }}>enrolled</p>
                    </td>
                    <td className="px-4 py-4">
                      <Chip tone={t.status === 'active' ? 'success' : 'slate'}>
                        {t.status === 'active' ? <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} /> : <AlertCircle className="h-3 w-3" strokeWidth={1.5} />}
                        {t.status}
                      </Chip>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1 justify-end w-full">
                        <Button variant="ghost" size="sm" onClick={() => onAssignSubject(t)} title="Assign subject">
                          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant={t.status === 'active' ? 'secondary' : 'success'}
                          size="sm"
                          onClick={() => onToggleStatus(t.id)}
                          title="Toggle status"
                        >
                          <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onDelete(t.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StudentsSection({
  filteredStudents, studentSearch, setStudentSearch,
  onAddStudent, onToggleStatus, onDelete, onEnroll, onAssignTeacher,
  getSubjectById, totalStudents,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Student Directory"
          title={<span>Student <span style={{ color: FOREST }}>enrollment</span></span>}
          subtitle={
            <span>
              <span className={`${mono} font-semibold`} style={{ color: INK }}>{filteredStudents.length}</span> results ·{' '}
              <span className={`${mono}`} style={{ color: SLATE }}>{totalStudents} total students</span>
            </span>
          }
        />
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ color: SLATE }}
            />
            <input
              type="search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Name, roll, program…"
              className="h-10 w-64 rounded-md border px-3 pl-9 text-sm outline-none transition-colors"
              style={{ color: INK, borderColor: HAIRLINE, backgroundColor: PAPER }}
              onFocus={(e) => (e.currentTarget.style.borderColor = FOREST)}
              onBlur={(e) => (e.currentTarget.style.borderColor = HAIRLINE)}
            />
          </div>
          <Button variant="primary" onClick={onAddStudent}>
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Student
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: IVORY }}>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Student</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Program / Roll</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Assigned Teacher</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Subjects</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Joined</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Tests</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Avg Score</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: SLATE }}>Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: SLATE }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Search className="h-7 w-7 mx-auto mb-3" strokeWidth={1.5} style={{ color: SLATE }} />
                    <p className="text-sm font-semibold" style={{ color: INK }}>No students match your search</p>
                    <p className="text-xs mt-1" style={{ color: SLATE }}>Try a different name, roll, or program</p>
                  </td>
                </tr>
              ) : filteredStudents.map((s) => (
                <tr key={s.id} className="border-t transition-colors" style={{ borderColor: HAIRLINE }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: IVORY, color: INK, border: `1px solid ${HAIRLINE}` }}
                      >
                        {s.avatarInitials || (s.name || s.full_name || s.username || 'ST').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: INK }}>{s.name || s.full_name || s.username}</p>
                        <a
                          href={`mailto:${s.email}`}
                          className="text-[11px] truncate flex items-center gap-1"
                          style={{ color: SLATE }}
                        >
                          <Mail className="h-3 w-3" strokeWidth={1.5} /> {s.email}
                        </a>
                        <p className={`text-[10px] ${mono} mt-0.5`} style={{ color: SLATE }}>ID: {s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium" style={{ color: INK }}>{s.program || (s.enrolled_subjects?.[0]?.name) || 'Student'}</p>
                    <p className={`text-[11px] ${mono} mt-0.5`} style={{ color: BRASS }}>
                      <Hash className="inline h-3 w-3 align-text-bottom mr-0.5" strokeWidth={1.5} />
                      {s.roll || s.username}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                      {(s.assigned_teachers || []).map(t => (
                        <Chip key={t.id} tone="forest">{t.full_name || t.username}</Chip>
                      ))}
                      {(!s.assigned_teachers || s.assigned_teachers.length === 0) && (
                        <span className="text-[11px]" style={{ color: SLATE }}>Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                      {(s.enrolledSubjectIds || s.enrolled_subjects || []).map(sid => {
                        const sId = typeof sid === 'object' ? sid.id : sid
                        const subj = getSubjectById(sId) || (typeof sid === 'object' ? sid : null)
                        return subj ? <Chip key={sId} tone="forest">{subj.code || subj.name}</Chip> : null
                      })}
                      {(!s.enrolledSubjectIds && !s.enrolled_subjects?.length) && (
                        <span className="text-[11px]" style={{ color: SLATE }}>None enrolled</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: INK }}>
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: SLATE }} />
                      {s.joined || (s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Active')}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className={`text-sm font-semibold ${mono}`} style={{ color: INK }}>{s.stats?.testsTaken ?? 0}</p>
                    <p className="text-[10px]" style={{ color: SLATE }}>taken</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p
                      className={`text-sm font-semibold ${mono}`}
                      style={{ color: (s.stats?.avgScore ?? 0) >= 70 ? SUCCESS : (s.stats?.avgScore ?? 0) >= 50 ? BRASS : ERROR }}
                    >
                      {(s.stats?.avgScore ?? 0).toFixed(1)}
                    </p>
                    <p className="text-[10px]" style={{ color: SLATE }}>avg %</p>
                  </td>
                  <td className="px-4 py-4">
                    <Chip tone={s.status === 'active' || s.is_active !== false ? 'success' : 'slate'}>
                      {s.status === 'active' || s.is_active !== false ? <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} /> : <AlertCircle className="h-3 w-3" strokeWidth={1.5} />}
                      {s.status || (s.is_active !== false ? 'active' : 'inactive')}
                    </Chip>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1 justify-end w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAssignTeacher(s)}
                        title="Assign to Teacher"
                      >
                        <UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="ml-1 text-xs">Assign</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEnroll(s)} title="Enroll in subject">
                        <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant={s.status === 'active' || s.is_active !== false ? 'secondary' : 'success'}
                        size="sm"
                        onClick={() => onToggleStatus(s.id)}
                        title="Toggle status"
                      >
                        <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(s.id)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function TestsSection({ tests, teachers, submissions, getSubjectById }) {
  const getTeacherById = (id) => teachers.find(t => t.id === id)
  const getSubCount = (tid) => submissions.filter(s => s.testId === tid).length

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Assessment Catalog"
        title={<span>All <span style={{ color: FOREST }}>tests</span> across departments</span>}
        subtitle={
          <span>
            <span className={`${mono} font-semibold`} style={{ color: INK }}>{tests.length}</span> tests configured ·{' '}
            <span className={`${mono}`} style={{ color: SLATE }}>{submissions.length} total submissions</span>
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3 p-10 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3" strokeWidth={1.5} style={{ color: SLATE }} />
            <p className="text-sm font-semibold" style={{ color: INK }}>No tests configured yet</p>
            <p className="text-xs mt-1" style={{ color: SLATE }}>Tests are created by evaluators via their dashboard</p>
          </Card>
        ) : tests.map((t) => {
          const subj = getSubjectById(t.subjectId)
          const creator = getTeacherById(t.createdBy)
          const subCount = getSubCount(t.id)
          return (
            <Card key={t.id} className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md"
                  style={{ backgroundColor: '#F6F1E6', color: BRASS }}
                >
                  <ClipboardList className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
                <Chip tone={
                  t.status === 'graded' ? 'success' :
                  t.status === 'active' ? 'forest' :
                  t.status === 'scheduled' ? 'brass' :
                  t.status === 'flagged' ? 'error' : 'slate'
                }>
                  {t.status}
                </Chip>
              </div>
              <div>
                <h4 className="text-base font-semibold leading-snug" style={{ color: INK }}>{t.title}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {subj && <Chip tone="forest">{subj.code}</Chip>}
                  <Chip tone="slate">{t.totalQuestions} Qs</Chip>
                  <Chip tone="brass">{t.totalMarks} marks</Chip>
                </div>
              </div>
              <div className="space-y-1.5 text-xs" style={{ color: SLATE }}>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" strokeWidth={1.5} />
                  <span>{creator?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  <span>{t.duration_minutes} min · {t.scheduledAt || t.startedAt || '—'}</span>
                </div>
              </div>
              <div className="pt-3 mt-auto flex items-center justify-between border-t" style={{ borderColor: HAIRLINE }}>
                <div>
                  <span className={`text-sm font-semibold ${mono}`} style={{ color: INK }}>{subCount}</span>
                  <span className="text-[11px] ml-1" style={{ color: SLATE }}>submissions</span>
                </div>
                <Button variant="ghost" size="sm">
                  Details <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ReportsSection({ submissions, tests, subjects }) {
  const avgPct = submissions.length
    ? (submissions.reduce((a, s) => a + (s.percentage || 0), 0) / submissions.length).toFixed(1)
    : '0.0'
  const passCount = submissions.filter(s => s.passed).length
  const passRate = submissions.length ? ((passCount / submissions.length) * 100).toFixed(1) : '0.0'
  const flaggedCount = submissions.filter(s => (s.flags || []).length > 0).length

  const bySubject = subjects.map(subj => {
    const tids = tests.filter(t => t.subjectId === subj.id).map(t => t.id)
    const relSubs = submissions.filter(s => tids.includes(s.testId))
    const avg = relSubs.length
      ? (relSubs.reduce((a, s) => a + (s.percentage || 0), 0) / relSubs.length).toFixed(1)
      : null
    return { subj, count: relSubs.length, avg }
  })
  const maxAvg = Math.max(1, ...bySubject.map(x => parseFloat(x.avg) || 0))

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Administrative Reports"
        title={<span>Reports &amp; <span style={{ color: FOREST }}>audit summary</span></span>}
        subtitle={
          <span>
            Institution-wide performance summary ·{' '}
            <span className={`${mono}`} style={{ color: SLATE }}>Generated {new Date().toLocaleString()}</span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Submissions Total" value={submissions.length} sub="Across all tests" tone="ink" Icon={ClipboardList} />
        <StatCard label="Average Score" value={`${avgPct}%`} sub="Across submissions" tone="forest" Icon={Award} />
        <StatCard label="Pass Rate" value={`${passRate}%`} sub={`${passCount} of ${submissions.length}`} tone="success" Icon={CheckCircle2} />
        <StatCard label="Flagged" value={flaggedCount} sub="Pending review" tone="brass" Icon={AlertTriangle} />
      </div>

      <Card className="p-6">
        <div className="mb-5">
          <div className="mb-2"><SectionTick /></div>
          <h3 className="text-lg font-semibold" style={{ color: INK }}>Performance by Subject</h3>
          <p className="text-xs mt-1" style={{ color: SLATE }}>Average score across subject submissions</p>
        </div>
        <div className="space-y-4">
          {bySubject.map(({ subj, count, avg }) => (
            <div key={subj.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Chip tone="forest">{subj.code}</Chip>
                  <span className="font-medium" style={{ color: INK }}>{subj.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: SLATE }}>
                    <span className={`${mono} font-semibold`} style={{ color: INK }}>{count}</span> subs
                  </span>
                  <span
                    className={`text-sm font-semibold ${mono}`}
                    style={{ color: avg ? (parseFloat(avg) >= 70 ? SUCCESS : parseFloat(avg) >= 50 ? BRASS : ERROR) : SLATE }}
                  >
                    {avg !== null ? `${avg}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: IVORY }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: avg ? `${(parseFloat(avg) / maxAvg) * 100}%` : '0%',
                    backgroundColor: FOREST,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { t: 'Semester Summary', d: 'Performance by program & department', tone: 'forest' },
          { t: 'Proctoring Logs', d: 'Tab switches, violations & anomalies', tone: 'error' },
          { t: 'Completion Report', d: 'Started / finished / abandoned', tone: 'brass' },
          { t: 'Faculty Activity', d: 'Tests created, grading turnaround', tone: 'ink' },
          { t: 'Attendance Audit', d: 'Check-in & session durations', tone: 'ink' },
          { t: 'Export Full CSV', d: 'All users + submissions for LMS', tone: 'forest' },
        ].map((c) => (
          <Card key={c.t} className="p-5">
            <h4 className="text-base font-semibold" style={{ color: INK }}>{c.t}</h4>
            <p className="text-xs mt-1" style={{ color: SLATE }}>{c.d}</p>
            <div className="pt-4 mt-4 flex items-center justify-between border-t" style={{ borderColor: HAIRLINE }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SLATE }}>
                {c.tone === 'forest' ? 'CSV · PDF' : c.tone === 'error' ? 'Log file' : 'Report'}
              </span>
              <Button variant="secondary" size="sm">
                Generate <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AddTeacherModal({ onClose, onSubmit, subjects }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', department: 'Computer Science' })
  const [touched, setTouched] = useState({})
  const [subjectIds, setSubjectIds] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }))

  const errors = {}
  if (!form.name.trim()) errors.name = 'Full name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password) errors.password = 'Temporary password required'
  else if (form.password.length < 8) errors.password = 'At least 8 characters'
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match'

  const valid = Object.keys(errors).length === 0

  const depts = ['Computer Science', 'Mathematics', 'Physics', 'Electronics', 'Mechanical', 'Electrical', 'Chemistry']

  const toggleSubject = (id) => {
    setSubjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true, confirm: true })
    if (!valid) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ ...form, subjectIds })
    } catch (error) {
      const details = error.response?.data
      const message = details && typeof details === 'object'
        ? Object.values(details).flat().join(' ')
        : error.message
      setSubmitError(message || 'Could not create the teacher. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Add Teacher"
      subtitle="Create a new faculty account. Credentials will be shared via email."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          icon={User}
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          onBlur={() => touch('name')}
          placeholder="Dr. Meera Iyer"
          error={touched.name ? errors.name : null}
          success={!!form.name && !errors.name}
        />
        <Input
          label="Email Address"
          icon={Mail}
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => touch('email')}
          placeholder="name.surname@dtep.edu"
          error={touched.email ? errors.email : null}
          success={form.email && !errors.email}
        />
        <Select
          label="Department"
          value={form.department}
          onChange={(e) => update('department', e.target.value)}
          options={depts}
        />

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
            Assign Subjects (optional)
          </span>
          <div className="rounded-md border p-3 flex flex-wrap gap-1.5" style={{ borderColor: HAIRLINE, backgroundColor: PAPER }}>
            {subjects.length === 0 ? (
              <span className="text-xs" style={{ color: SLATE }}>No subjects available</span>
            ) : subjects.map(s => {
              const selected = subjectIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className="rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: selected ? '#E9F0EC' : IVORY,
                    color: selected ? FOREST : INK,
                    borderColor: selected ? FOREST : HAIRLINE,
                  }}
                >
                  {s.code} · {s.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Temporary Password"
            icon={Lock}
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => touch('password')}
            placeholder="••••••••"
            error={touched.password ? errors.password : null}
            success={form.password && !errors.password}
          />
          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            onBlur={() => touch('confirm')}
            placeholder="Re-type"
            error={touched.confirm ? errors.confirm : null}
            success={form.confirm && !errors.confirm}
          />
        </div>

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" disabled={!valid || submitting} className="flex-1">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> {submitting ? 'Creating…' : 'Create Teacher'}
          </Button>
        </div>
        {submitError && <p className="text-xs" style={{ color: ERROR }}>{submitError}</p>}
      </form>
    </Modal>
  )
}

function AddStudentModal({ onClose, onSubmit, subjects }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', program: 'B.Tech CSE, Sem 6', roll: '' })
  const [touched, setTouched] = useState({})
  const [subjectIds, setSubjectIds] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }))

  const errors = {}
  if (!form.name.trim()) errors.name = 'Full name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password) errors.password = 'Password required'
  else if (form.password.length < 8) errors.password = 'At least 8 characters'
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match'

  const valid = Object.keys(errors).length === 0

  const programs = [
    'B.Tech CSE, Sem 8', 'B.Tech CSE, Sem 6', 'B.Tech CSE, Sem 4',
    'B.Tech ECE, Sem 6', 'B.Tech ECE, Sem 4',
    'B.Tech ME, Sem 5', 'B.Tech ME, Sem 3',
    'B.Tech EE, Sem 5', 'B.Tech EE, Sem 3',
  ]

  const toggleSubject = (id) => {
    setSubjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true, confirm: true })
    if (!valid) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ ...form, subjectIds })
    } catch (error) {
      const details = error.response?.data
      const message = details && typeof details === 'object'
        ? Object.values(details).flat().join(' ')
        : error.message
      setSubmitError(message || 'Could not enroll the student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Add Student"
      subtitle="Create a new student enrollment record."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          icon={User}
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          onBlur={() => touch('name')}
          placeholder="Aarav Sharma"
          error={touched.name ? errors.name : null}
          success={!!form.name && !errors.name}
        />
        <Input
          label="Email Address"
          icon={Mail}
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => touch('email')}
          placeholder="roll.number@dtep.edu"
          error={touched.email ? errors.email : null}
          success={form.email && !errors.email}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Program"
            value={form.program}
            onChange={(e) => update('program', e.target.value)}
            options={programs}
          />
          <Input
            label="Roll Number"
            icon={Hash}
            value={form.roll}
            onChange={(e) => update('roll', e.target.value)}
            placeholder="CS2023-001"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
            Enroll In Subjects (optional)
          </span>
          <div className="rounded-md border p-3 flex flex-wrap gap-1.5" style={{ borderColor: HAIRLINE, backgroundColor: PAPER }}>
            {subjects.length === 0 ? (
              <span className="text-xs" style={{ color: SLATE }}>No subjects available</span>
            ) : subjects.map(s => {
              const selected = subjectIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className="rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: selected ? '#E9F0EC' : IVORY,
                    color: selected ? FOREST : INK,
                    borderColor: selected ? FOREST : HAIRLINE,
                  }}
                >
                  {s.code}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            icon={Lock}
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => touch('password')}
            placeholder="••••••••"
            error={touched.password ? errors.password : null}
            success={form.password && !errors.password}
          />
          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            onBlur={() => touch('confirm')}
            placeholder="Re-type"
            error={touched.confirm ? errors.confirm : null}
            success={form.confirm && !errors.confirm}
          />
        </div>

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" disabled={!valid || submitting} className="flex-1">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> {submitting ? 'Enrolling…' : 'Enroll Student'}
          </Button>
        </div>
        {submitError && <p className="text-xs" style={{ color: ERROR }}>{submitError}</p>}
      </form>
    </Modal>
  )
}

function AssignSubjectModal({ teacher, subjects, onClose, onSubmit }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const assigned = new Set(teacher.subjectIds || [])
  const available = subjects.filter(s => !assigned.has(s.id))

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Assign Subject to Teacher"
      subtitle={`Assign a teaching subject to ${teacher.name}`}
    >
      {available.length === 0 ? (
        <div className="space-y-5">
          <Card className="p-5 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" strokeWidth={1.5} style={{ color: SUCCESS }} />
            <p className="text-sm font-semibold" style={{ color: INK }}>All subjects already assigned</p>
            <p className="text-xs mt-1" style={{ color: SLATE }}>This teacher is already assigned to all available subjects</p>
          </Card>
          <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (subjectId) onSubmit(subjectId) }}
          className="space-y-4"
        >
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Teacher
            </span>
            <div className="flex items-center gap-3 rounded-md border p-3" style={{ borderColor: HAIRLINE, backgroundColor: IVORY }}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold"
                style={{ backgroundColor: PAPER, border: `1px solid ${HAIRLINE}` }}
              >
                {teacher.avatarInitials || '??'}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>{teacher.name}</p>
                <p className={`text-[11px] ${mono}`} style={{ color: SLATE }}>{teacher.department} · {teacher.id}</p>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Currently Assigned
            </span>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem] rounded-md border p-2" style={{ borderColor: HAIRLINE, backgroundColor: PAPER }}>
              {(teacher.subjectIds || []).length === 0 ? (
                <span className="text-xs" style={{ color: SLATE }}>None</span>
              ) : (teacher.subjectIds || []).map(sid => {
                const s = subjects.find(x => x.id === sid)
                return s ? <Chip key={sid} tone="forest">{s.code} · {s.name}</Chip> : null
              })}
            </div>
          </div>

          <Select
            label="Assign New Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={available.map(s => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          />

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!subjectId}>
              <BookOpen className="h-4 w-4" strokeWidth={1.5} /> Assign Subject
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function EnrollStudentModal({ student, subjects, onClose, onSubmit }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const enrolled = new Set(student.enrolledSubjectIds || [])
  const available = subjects.filter(s => !enrolled.has(s.id))

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Enroll Student in Subject"
      subtitle={`Enroll ${student.name} into a subject`}
    >
      {available.length === 0 ? (
        <div className="space-y-5">
          <Card className="p-5 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" strokeWidth={1.5} style={{ color: SUCCESS }} />
            <p className="text-sm font-semibold" style={{ color: INK }}>Fully enrolled</p>
            <p className="text-xs mt-1" style={{ color: SLATE }}>This student is enrolled in all available subjects</p>
          </Card>
          <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (subjectId) onSubmit(subjectId) }}
          className="space-y-4"
        >
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Student
            </span>
            <div className="flex items-center gap-3 rounded-md border p-3" style={{ borderColor: HAIRLINE, backgroundColor: IVORY }}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold"
                style={{ backgroundColor: PAPER, border: `1px solid ${HAIRLINE}` }}
              >
                {student.avatarInitials || '??'}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>{student.name}</p>
                <p className={`text-[11px] ${mono}`} style={{ color: BRASS }}>
                  <Hash className="inline h-3 w-3 align-text-bottom" strokeWidth={1.5} />
                  {student.roll}
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Currently Enrolled
            </span>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem] rounded-md border p-2" style={{ borderColor: HAIRLINE, backgroundColor: PAPER }}>
              {(student.enrolledSubjectIds || []).length === 0 ? (
                <span className="text-xs" style={{ color: SLATE }}>None</span>
              ) : (student.enrolledSubjectIds || []).map(sid => {
                const s = subjects.find(x => x.id === sid)
                return s ? <Chip key={sid} tone="forest">{s.code}</Chip> : null
              })}
            </div>
          </div>

          <Select
            label="Enroll In Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={available.map(s => ({ value: s.id, label: `${s.code} — ${s.name} (${s.department})` }))}
          />

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!subjectId}>
              <GraduationCap className="h-4 w-4" strokeWidth={1.5} /> Enroll
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function AssignTeacherModal({ student, teachers, onClose, onSubmit, onUnassign }) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const assignedTeachers = student.assigned_teachers || []

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!teacherId) return
    setLoading(true)
    setError('')
    try {
      await onSubmit(teacherId)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to assign student to teacher.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async (tId) => {
    setLoading(true)
    setError('')
    try {
      await onUnassign(tId)
    } catch (err) {
      setError(err.message || 'Failed to unassign student from teacher.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Assign Student to Teacher"
      subtitle={`Map ${student.name || student.full_name || student.username} to a designated faculty member.`}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
            Student Details
          </span>
          <div className="flex items-center gap-3 rounded-md border p-3" style={{ borderColor: HAIRLINE, backgroundColor: IVORY }}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold"
              style={{ backgroundColor: PAPER, border: `1px solid ${HAIRLINE}` }}
            >
              {student.avatarInitials || (student.name || student.username || 'ST').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: INK }}>{student.name || student.full_name || student.username}</p>
              <p className={`text-[11px] ${mono}`} style={{ color: SLATE }}>{student.email} · ID: {student.id}</p>
            </div>
          </div>
        </div>

        {assignedTeachers.length > 0 && (
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: SLATE }}>
              Currently Assigned Teachers
            </span>
            <div className="space-y-2">
              {assignedTeachers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border p-2.5"
                  style={{ borderColor: HAIRLINE, backgroundColor: PAPER }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: INK }}>{t.full_name || t.username}</p>
                    <p className="text-xs" style={{ color: SLATE }}>{t.email}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleUnassign(t.id)}
                  >
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {teachers.length === 0 ? (
          <p className="text-xs" style={{ color: SLATE }}>No teachers registered in the portal yet.</p>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <Select
              label="Select Faculty Member"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              options={teachers.map((t) => ({
                value: t.id,
                label: `${t.name || t.full_name || t.username} (${t.email})`,
              }))}
            />

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-2">
              <Button variant="secondary" onClick={onClose} className="flex-1" type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading || !teacherId} className="flex-1">
                {loading ? 'Saving…' : 'Confirm Assignment'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
