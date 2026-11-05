import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, CheckCircle2, Eye, Info, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createCodingQuestion,
  describeTeacherCodingError,
  fetchCodingQuestion,
  fetchCodingQuestionsForTest,
  updateCodingQuestion,
} from '../../services/codingApi.js'

// Same palette as EvaluatorDashboard.jsx.
const PAPER = '#FAF9F6'
const IVORY = '#F2F0EA'
const INK = '#161A22'
const SLATE = '#5C5A52'
const FOREST = '#1F4A3D'
const BRASS = '#A8823A'
const HAIRLINE = '#DEDACE'
const ERROR = '#8C3A2E'
const SUCCESS = '#4B6B3A'

// Status-message tones: calm blue for the 409 conflict, soft red for errors, soft green for success.
const INFO_BG = '#EEF3F9'
const INFO_BORDER = '#C3D6E8'
const INFO_TEXT = '#2F4A63'
const ERROR_BG = '#FBEEEA'
const ERROR_BORDER = '#E6C6BE'
const SUCCESS_BG = '#EDF5EA'
const SUCCESS_BORDER = '#C9DCC1'

// Limits from API_CONTRACT.md ("Coding questions").
const LIMIT_TITLE = 255
const LIMIT_STATEMENT = 20000
const LIMIT_CONSTRAINTS = 10000
const LIMIT_CASE_FIELD = 10000
const LIMIT_STARTER_CODE = 100000
const MAX_CASES = 50

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
]
const LANGUAGE_LABEL = LANGUAGES.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

let caseSeq = 0
function makeCase(isHidden) {
  caseSeq += 1
  return { key: `case-${Date.now()}-${caseSeq}`, input: '', expectedOutput: '', marks: '1', isHidden }
}

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em]'
const fieldStyle = { background: PAPER, border: `1px solid ${HAIRLINE}`, color: INK }
const fieldClass = 'w-full rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-700/30'

export default function TeacherCodingQuestionsModal({ test, onClose, onSaved }) {
  const testId = test?.id
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [notice, setNotice] = useState('')

  const loadList = useCallback(async () => {
    if (!testId) return
    setLoading(true)
    setListError('')
    try {
      const data = await fetchCodingQuestionsForTest(testId)
      setQuestions(Array.isArray(data) ? data : [])
    } catch (err) {
      setListError(describeTeacherCodingError(err))
    } finally {
      setLoading(false)
    }
  }, [testId])

  useEffect(() => {
    loadList()
  }, [loadList])

  // The success note is short-lived: it clears itself after a few seconds.
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const startCreate = () => {
    setEditing(null)
    setMode('form')
  }

  const startEdit = async (questionId) => {
    setLoadingQuestion(true)
    setListError('')
    try {
      const full = await fetchCodingQuestion(questionId)
      setEditing(full)
      setMode('form')
    } catch (err) {
      setListError(describeTeacherCodingError(err))
    } finally {
      setLoadingQuestion(false)
    }
  }

  const handleSaved = () => {
    setEditing(null)
    setMode('list')
    setNotice('Question saved')
    loadList()
    // Lets the dashboard refresh this test's coding totals for the cards.
    onSaved?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(22, 26, 34, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${HAIRLINE}`, background: IVORY }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRASS }}>
                Coding Questions
              </span>
              {testId ? (
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full" style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: SLATE }}>
                  test #{testId}
                </span>
              ) : null}
            </div>
            <h2 className="font-serif text-[20px] font-semibold mt-1" style={{ color: INK }}>
              {test?.title || 'Test'}
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

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!testId && (
            <p className="text-[12px]" style={{ color: ERROR }}>
              This test has no id, so coding questions cannot be created for it.
            </p>
          )}

          {listError && mode === 'list' && (
            <div className="flex items-start gap-2 rounded-md p-3 text-[12px]" style={{ background: ERROR_BG, border: `1px solid ${ERROR_BORDER}`, color: ERROR }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{listError}</span>
            </div>
          )}

          {notice && mode === 'list' && (
            <div className="flex items-center gap-2 rounded-md p-3 text-[12px]" style={{ background: SUCCESS_BG, border: `1px solid ${SUCCESS_BORDER}`, color: SUCCESS }}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={labelClass} style={{ color: SLATE }}>
                  Questions ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={startCreate}
                  disabled={!testId}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md shadow-sm text-white disabled:opacity-50"
                  style={{ background: FOREST }}
                >
                  <Plus className="h-4 w-4" /> New coding question
                </button>
              </div>

              {loading ? (
                <p className="inline-flex items-center gap-2 text-[12px]" style={{ color: SLATE }}>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
                </p>
              ) : questions.length === 0 ? (
                <p className="text-[12px] italic text-stone-400">
                  No coding questions for this test yet. Create the first one.
                </p>
              ) : (
                <div className="space-y-2">
                  {questions.map((question, index) => (
                    <div
                      key={question.id ?? index}
                      className="flex items-center justify-between gap-3 rounded-lg p-3"
                      style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold"
                          style={{ background: INK, color: PAPER }}
                        >
                          {(Number(question.order) || index) + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: INK }}>
                            {question.title || 'Untitled question'}
                          </p>
                          <p className="font-mono text-[11px]" style={{ color: SLATE }}>
                            id #{question.id} · {question.max_marks} max marks
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(question.id)}
                        disabled={loadingQuestion}
                        className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-md disabled:opacity-50"
                        style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: INK }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <CodingQuestionForm
              test={test}
              question={editing}
              onCancel={() => {
                setEditing(null)
                setMode('list')
              }}
              onSaved={handleSaved}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function CodingQuestionForm({ test, question, onCancel, onSaved }) {
  const isEdit = Boolean(question?.id)
  const [title, setTitle] = useState(question?.title || '')
  const [statement, setStatement] = useState(question?.statement || '')
  const [constraints, setConstraints] = useState(question?.constraints || '')
  const [allowedLanguages, setAllowedLanguages] = useState(() => {
    const list = Array.isArray(question?.allowed_languages) ? question.allowed_languages : []
    return list.length ? list : ['python']
  })
  const [starterCode, setStarterCode] = useState(() => {
    const base = { python: '', javascript: '' }
    if (question?.starter_code && typeof question.starter_code === 'object') {
      for (const key of Object.keys(question.starter_code)) {
        base[key] = question.starter_code[key] || ''
      }
    }
    return base
  })
  const [maxMarks, setMaxMarks] = useState(question?.max_marks != null ? String(question.max_marks) : '10')
  const [isPublished, setIsPublished] = useState(question ? Boolean(question.is_published) : true)
  const [cases, setCases] = useState(() => {
    const existing = Array.isArray(question?.test_cases) ? question.test_cases : []
    if (existing.length) {
      return existing.map((item, index) => ({
        key: item.id != null ? `case-${item.id}` : `case-${index}-${Date.now()}`,
        input: item.input ?? '',
        expectedOutput: item.expected_output ?? '',
        marks: String(item.marks ?? '1'),
        isHidden: Boolean(item.is_hidden),
      }))
    }
    return [makeCase(false), makeCase(true)]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState('')
  const messageRef = useRef(null)

  // When Save surfaces a message, make sure it is visible above the sticky footer.
  useEffect(() => {
    if (conflict || error) {
      messageRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [conflict, error])

  const updateCase = (key, patch) => {
    setCases((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }
  const addCase = () => {
    setCases((current) => (current.length >= MAX_CASES ? current : [...current, makeCase(false)]))
  }
  const removeCase = (key) => {
    setCases((current) => (current.length <= 1 ? current : current.filter((item) => item.key !== key)))
  }
  const toggleLanguage = (value) => {
    setAllowedLanguages((current) => {
      if (current.includes(value)) {
        return current.length <= 1 ? current : current.filter((item) => item !== value)
      }
      return LANGUAGES.map((item) => item.value).filter((item) => current.includes(item) || item === value)
    })
  }

  const visibleCount = cases.filter((item) => !item.isHidden).length
  const hiddenCount = cases.filter((item) => item.isHidden).length
  const orderLanguages = (values) => LANGUAGES.map((item) => item.value).filter((value) => values.includes(value))

  const validate = () => {
    if (!title.trim()) return 'Title is required.'
    if (title.trim().length > LIMIT_TITLE) return `Title must be at most ${LIMIT_TITLE} characters.`
    if (!statement.trim()) return 'Statement is required.'
    if (statement.trim().length > LIMIT_STATEMENT) return `Statement must be at most ${LIMIT_STATEMENT} characters.`
    if (constraints.trim().length > LIMIT_CONSTRAINTS) return `Constraints must be at most ${LIMIT_CONSTRAINTS} characters.`
    if (allowedLanguages.length === 0) return 'Choose at least one allowed language.'
    if (!(Number(maxMarks) > 0)) return 'Max marks must be greater than 0.'
    if (cases.length === 0) return 'Add at least one test case.'
    if (cases.length > MAX_CASES) return `A question may have at most ${MAX_CASES} test cases.`
    if (visibleCount === 0 || hiddenCount === 0) return 'Include at least one visible and one hidden test case.'
    for (const item of cases) {
      if (!(Number(item.marks) > 0)) return 'Every test case needs a marks value greater than 0.'
      if (item.input.length > LIMIT_CASE_FIELD) return `Case input must be at most ${LIMIT_CASE_FIELD} characters.`
      if (item.expectedOutput.length > LIMIT_CASE_FIELD) return `Case expected output must be at most ${LIMIT_CASE_FIELD} characters.`
    }
    for (const language of allowedLanguages) {
      if ((starterCode[language] || '').length > LIMIT_STARTER_CODE) {
        return `Starter code for ${LANGUAGE_LABEL[language] || language} must be at most ${LIMIT_STARTER_CODE} characters.`
      }
    }
    return ''
  }

  const buildStarterCode = () =>
    orderLanguages(allowedLanguages).reduce((acc, language) => {
      acc[language] = starterCode[language] || ''
      return acc
    }, {})

  // No `order` and no case-level order are ever sent: the server assigns them.
  const buildCases = () =>
    cases.map((item) => ({
      input: item.input,
      expected_output: item.expectedOutput,
      is_hidden: Boolean(item.isHidden),
      marks: Number(item.marks),
    }))

  const submit = async (event) => {
    event.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      setConflict('')
      return
    }
    setSaving(true)
    setError('')
    setConflict('')
    try {
      const payload = {
        title: title.trim(),
        statement: statement.trim(),
        constraints: constraints.trim(),
        starter_code: buildStarterCode(),
        allowed_languages: orderLanguages(allowedLanguages),
        max_marks: Number(maxMarks),
        is_published: isPublished,
        test_cases: buildCases(),
      }
      const saved = isEdit
        ? await updateCodingQuestion(question.id, payload)
        : await createCodingQuestion({ ...payload, test_id: test.id })
      onSaved(saved)
    } catch (err) {
      if (err?.response?.status === 409) {
        setConflict(describeTeacherCodingError(err))
      } else {
        setError(describeTeacherCodingError(err))
      }
    } finally {
      setSaving(false)
    }
  }

  // After a 409 the locked fields are rejected, but title/statement/constraints/
  // starter_code/is_published remain editable, so let the teacher save just those.
  const saveAllowedFieldsOnly = async () => {
    const problem = !title.trim() ? 'Title is required.' : (!statement.trim() ? 'Statement is required.' : '')
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateCodingQuestion(question.id, {
        title: title.trim(),
        statement: statement.trim(),
        constraints: constraints.trim(),
        starter_code: buildStarterCode(),
        is_published: isPublished,
      })
      onSaved()
    } catch (err) {
      setError(describeTeacherCodingError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className={labelClass} style={{ color: SLATE }}>
          {isEdit ? `Edit question #${question.id}` : 'New coding question'}
        </h3>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: SLATE }}>
          <span className="font-mono">{visibleCount} visible</span>
          <span>·</span>
          <span className="font-mono">{hiddenCount} hidden</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 min-w-0">
          <div className="space-y-1.5">
            <label className={labelClass} style={{ color: SLATE }} htmlFor="cq-title">
              Title *
            </label>
            <input
              id="cq-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={LIMIT_TITLE}
              placeholder="Add two numbers"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} style={{ color: SLATE }} htmlFor="cq-statement">
              Statement *
            </label>
            <textarea
              id="cq-statement"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              maxLength={LIMIT_STATEMENT}
              rows={6}
              placeholder="Read two integers and print their sum."
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} style={{ color: SLATE }} htmlFor="cq-constraints">
              Constraints
            </label>
            <textarea
              id="cq-constraints"
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              maxLength={LIMIT_CONSTRAINTS}
              rows={3}
              placeholder="Integers fit in 32 bits."
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className={labelClass} style={{ color: SLATE }}>
                Allowed languages *
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {LANGUAGES.map((language) => {
                  const active = allowedLanguages.includes(language.value)
                  return (
                    <button
                      key={language.value}
                      type="button"
                      onClick={() => toggleLanguage(language.value)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md"
                      style={{
                        background: active ? FOREST : PAPER,
                        border: `1px solid ${active ? FOREST : HAIRLINE}`,
                        color: active ? '#FFFFFF' : SLATE,
                      }}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                      {language.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: SLATE }} htmlFor="cq-max-marks">
                  Max marks *
                </label>
                <input
                  id="cq-max-marks"
                  type="number"
                  min="1"
                  value={maxMarks}
                  onChange={(event) => setMaxMarks(event.target.value)}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
              <div className="space-y-1.5">
                <span className={labelClass} style={{ color: SLATE }}>
                  Published
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublished((value) => !value)}
                  className="w-full px-3 py-2 text-[12px] font-semibold rounded-md"
                  style={{
                    background: isPublished ? FOREST : PAPER,
                    border: `1px solid ${isPublished ? FOREST : HAIRLINE}`,
                    color: isPublished ? '#FFFFFF' : SLATE,
                  }}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </button>
              </div>
            </div>
          </div>

          {orderLanguages(allowedLanguages).map((language) => (
            <div key={language} className="space-y-1.5">
              <label className={labelClass} style={{ color: SLATE }} htmlFor={`cq-starter-${language}`}>
                {LANGUAGE_LABEL[language]} starter code
              </label>
              <textarea
                id={`cq-starter-${language}`}
                value={starterCode[language] || ''}
                onChange={(event) => setStarterCode((current) => ({ ...current, [language]: event.target.value }))}
                maxLength={LIMIT_STARTER_CODE}
                rows={4}
                spellCheck={false}
                className={`${fieldClass} font-mono text-[12px]`}
                style={{ ...fieldStyle, background: IVORY }}
              />
            </div>
          ))}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className={labelClass} style={{ color: SLATE }}>
                Test cases ({cases.length}/{MAX_CASES})
              </span>
              <button
                type="button"
                onClick={addCase}
                disabled={cases.length >= MAX_CASES}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md disabled:opacity-50"
                style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: INK }}
              >
                <Plus className="h-3.5 w-3.5" /> Add case
              </button>
            </div>
            <p className="text-[11px]" style={{ color: SLATE }}>
              Needs at least one visible and one hidden case. Hidden cases are never shown to students.
            </p>

            <div className="space-y-3">
              {cases.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-lg p-3 space-y-2"
                  style={{ background: IVORY, border: `1px solid ${HAIRLINE}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold" style={{ color: SLATE }}>
                      Case {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCase(item.key, { isHidden: !item.isHidden })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md"
                        style={{
                          background: item.isHidden ? INK : PAPER,
                          border: `1px solid ${item.isHidden ? INK : HAIRLINE}`,
                          color: item.isHidden ? PAPER : SLATE,
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {item.isHidden ? 'Hidden' : 'Visible'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCase(item.key)}
                        disabled={cases.length <= 1}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
                        style={{ background: PAPER, border: `1px solid ${HAIRLINE}`, color: ERROR }}
                        title="Remove case"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
                        Input
                      </span>
                      <textarea
                        value={item.input}
                        onChange={(event) => updateCase(item.key, { input: event.target.value })}
                        maxLength={LIMIT_CASE_FIELD}
                        rows={3}
                        spellCheck={false}
                        className={`${fieldClass} font-mono text-[12px]`}
                        style={fieldStyle}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
                        Expected output
                      </span>
                      <textarea
                        value={item.expectedOutput}
                        onChange={(event) => updateCase(item.key, { expectedOutput: event.target.value })}
                        maxLength={LIMIT_CASE_FIELD}
                        rows={3}
                        spellCheck={false}
                        className={`${fieldClass} font-mono text-[12px]`}
                        style={fieldStyle}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
                        Marks
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={item.marks}
                        onChange={(event) => updateCase(item.key, { marks: event.target.value })}
                        className={fieldClass}
                        style={fieldStyle}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <StudentPreview
          title={title}
          statement={statement}
          constraints={constraints}
          maxMarks={maxMarks}
          allowedLanguages={orderLanguages(allowedLanguages)}
          starterCode={starterCode}
          cases={cases}
        />
      </div>

      <div
        className="sticky bottom-0 -mx-6 -mb-6 space-y-2 px-6 py-3"
        style={{ background: PAPER, borderTop: `1px solid ${HAIRLINE}` }}
      >
        {(conflict || error) && (
          <div ref={messageRef} className="space-y-2">
            {conflict && (
              <div className="rounded-md p-3 text-[12px] space-y-2" style={{ background: INFO_BG, border: `1px solid ${INFO_BORDER}`, color: INFO_TEXT }}>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{conflict}</span>
                </div>
                <p className="text-[11px] opacity-80">
                  Title, statement, constraints, starter code and published can still be saved.
                </p>
                <button
                  type="button"
                  onClick={saveAllowedFieldsOnly}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-md disabled:opacity-50"
                  style={{ background: PAPER, border: `1px solid ${INFO_BORDER}`, color: INFO_TEXT }}
                >
                  <Check className="h-3.5 w-3.5" /> Save the other fields only
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-md p-3 text-[12px]" style={{ background: ERROR_BG, border: `1px solid ${ERROR_BORDER}`, color: ERROR }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-[12px] font-medium rounded-md disabled:opacity-50"
            style={{ border: `1px solid ${HAIRLINE}`, background: PAPER, color: SLATE }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md shadow-sm text-white disabled:opacity-50"
            style={{ background: FOREST }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Create question'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Mirrors the read-only parts of what a student sees. Hidden cases are reduced to
// a count: their input and expected output are never rendered here.
function StudentPreview({ title, statement, constraints, maxMarks, allowedLanguages, starterCode, cases }) {
  const samples = cases.filter((item) => !item.isHidden)
  const hiddenCount = cases.length - samples.length
  const firstLanguage = allowedLanguages[0]

  return (
    <aside className="min-w-0 lg:sticky lg:top-0 self-start">
      <div className="rounded-lg overflow-hidden" style={{ background: '#FFFFFF', border: `1px solid ${HAIRLINE}` }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: IVORY, borderBottom: `1px solid ${HAIRLINE}` }}>
          <Eye className="h-3.5 w-3.5" style={{ color: SLATE }} />
          <span className={`${labelClass}`} style={{ color: SLATE }}>
            Student preview
          </span>
        </div>

        <div className="p-3 space-y-3 text-[12px]">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-[15px] font-semibold" style={{ color: INK }}>
              {title.trim() || 'Untitled question'}
            </h4>
            <span className="font-mono text-[11px]" style={{ color: SLATE }}>
              {Number(maxMarks) > 0 ? maxMarks : '–'} marks
            </span>
          </div>

          <p className="whitespace-pre-line leading-relaxed" style={{ color: INK }}>
            {statement.trim() || 'The problem statement appears here.'}
          </p>

          {constraints.trim() ? (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
                Constraints
              </span>
              <p className="whitespace-pre-line leading-relaxed" style={{ color: SLATE }}>
                {constraints}
              </p>
            </div>
          ) : null}

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
              Languages
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allowedLanguages.length === 0 ? (
                <span className="text-[11px] italic text-stone-400">None selected</span>
              ) : (
                allowedLanguages.map((language) => (
                  <span
                    key={language}
                    className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                    style={{ background: IVORY, border: `1px solid ${HAIRLINE}`, color: INK }}
                  >
                    {LANGUAGE_LABEL[language] || language}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
              Sample cases ({samples.length})
            </span>
            {samples.length === 0 ? (
              <p className="text-[11px] italic text-stone-400">No visible sample cases yet.</p>
            ) : (
              samples.map((item, index) => (
                <div key={item.key} className="rounded-md p-2 space-y-1" style={{ background: IVORY }}>
                  <span className="text-[10px] font-semibold" style={{ color: SLATE }}>
                    Sample {index + 1}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase" style={{ color: SLATE }}>
                      Input
                    </span>
                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-words" style={{ color: INK }}>
                      {item.input || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase" style={{ color: SLATE }}>
                      Expected output
                    </span>
                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-words" style={{ color: SUCCESS }}>
                      {item.expectedOutput || '(empty)'}
                    </pre>
                  </div>
                </div>
              ))
            )}
            {hiddenCount > 0 ? (
              <p className="text-[11px] leading-relaxed" style={{ color: SLATE }}>
                {hiddenCount} hidden {hiddenCount === 1 ? 'case' : 'cases'} will be run but{' '}
                {hiddenCount === 1 ? 'its' : 'their'} input and expected output are never shown.
              </p>
            ) : null}
          </div>

          {firstLanguage ? (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold" style={{ color: SLATE }}>
                {LANGUAGE_LABEL[firstLanguage]} starter code
              </span>
              <pre
                className="font-mono text-[11px] whitespace-pre-wrap break-words rounded-md p-2"
                style={{ background: IVORY, border: `1px solid ${HAIRLINE}`, color: INK }}
              >
                {starterCode[firstLanguage] || '(empty)'}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
