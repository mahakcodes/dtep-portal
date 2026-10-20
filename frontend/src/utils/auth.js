export function normalizeRole(role) {
  const value = String(role || '').toUpperCase()
  if (value === 'ADMIN') return 'admin'
  if (value === 'STUDENT') return 'student'
  return 'evaluator'
}

export function dashboardPath(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return '/admin'
  if (normalized === 'student') return '/student'
  return '/evaluator'
}

export function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first_name: '', last_name: '' }
  if (parts.length === 1) return { first_name: parts[0], last_name: '' }
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') }
}

export function mapAuthUser(data = {}) {
  const backendRole = String(data.role || '').toUpperCase()
  const role = normalizeRole(backendRole)
  const teaching = data.teaching_subjects || []
  const enrolled = data.enrolled_subjects || []
  const name = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || data.email
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    name,
    role,
    backendRole: backendRole || (role === 'admin' ? 'ADMIN' : role === 'student' ? 'STUDENT' : 'EVALUATOR'),
    avatarInitials: String(name)
      .split(' ')
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    status: 'active',
    subjectIds: teaching.map((subject) => subject.id),
    enrolledSubjectIds: enrolled.map((subject) => subject.id),
    teaching_subjects: teaching,
    enrolled_subjects: enrolled,
    title: data.title || (role === 'evaluator' ? 'Faculty' : ''),
    department: teaching[0]?.department || data.department || '',
  }
}

export function mapTeacherRecord(teacher) {
  const mapped = mapAuthUser({ ...teacher, role: teacher.role || 'EVALUATOR' })
  return {
    ...mapped,
    role: 'evaluator',
    subjectIds: (teacher.teaching_subjects || []).map((subject) => subject.id),
    joined: teacher.created_at ? new Date(teacher.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : '',
    stats: teacher.stats || { testsCreated: 0, submissionsGraded: 0, avgTurnaround: '—', activeClasses: 0 },
  }
}

export function mapStudentRecord(student) {
  const mapped = mapAuthUser({ ...student, role: student.role || 'STUDENT' })
  return {
    ...mapped,
    role: 'student',
    enrolledSubjectIds: (student.enrolled_subjects || []).map((subject) => subject.id),
    roll: student.username,
    program: student.program || '',
    joined: student.created_at ? new Date(student.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : '',
    stats: student.stats || { testsTaken: 0, avgScore: 0, percentile: 0, streak: 0 },
  }
}

export function mapTestRecord(test) {
  return {
    ...test,
    id: test.id,
    title: test.title,
    subjectId: test.subject_id ?? test.subject ?? null,
    createdBy: test.created_by,
    duration_minutes: test.duration_minutes,
    status: test.status || 'active',
    totalQuestions: Array.isArray(test.questions) ? test.questions.length : test.totalQuestions || 0,
    scheduledAt: test.created_at ? new Date(test.created_at).toLocaleString() : test.scheduledAt,
  }
}

export function mapSubmissionRecord(attempt) {
  const details = (attempt.answers || attempt.details || []).map((item) => ({
    question_id: item.question_id,
    questionId: item.question_id,
    question_text: item.question_text,
    question_type: item.question_type,
    type: item.question_type === 'DESCRIPTIVE' ? 'subjective' : 'mcq',
    marks: item.marks,
    max_score: item.marks,
    user_selected_option_id: item.selected_option_id,
    user_descriptive_text: item.descriptive_text,
    descriptive_text: item.descriptive_text,
    awarded_marks: item.awarded_marks,
    feedback: item.feedback,
    is_correct: item.awarded_marks == null ? null : item.awarded_marks > 0,
  }))
  return {
    id: attempt.id,
    studentId: attempt.student,
    studentName: attempt.student_name || attempt.student_username,
    testId: attempt.test,
    test_title: attempt.test_title,
    submittedAt: attempt.submitted_at || '',
    status: String(attempt.status || 'SUBMITTED').toLowerCase(),
    autoScore: attempt.score,
    score: attempt.score,
    maxScore: attempt.max_score,
    percentage: attempt.percentage,
    details,
    flags: [],
  }
}

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}
