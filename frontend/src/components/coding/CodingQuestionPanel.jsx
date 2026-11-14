import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Play,
  Send,
  Terminal,
  Timer,
  XCircle,
} from 'lucide-react'
import CodeEditor from './CodeEditor.jsx'
import { runCodingQuestion, toCaseResultsPayload } from '../../lib/codeRunner.js'
import {
  describeCodingError,
  fetchCodingQuestion,
  fetchGradingCases,
  submitCodingSolution,
} from '../../services/codingApi.js'

const LANGUAGE_LABEL = { python: 'Python', javascript: 'JavaScript' }
const CUSTOM_CASE_ID = '__custom_input__'

// Column-splitter size, stored as a ratio so it stays valid on any window size.
const SIZES_KEY = 'coding-panel-sizes'
const DEFAULT_SIZES = { left: 0.4 }
const MIN_COLUMN_LEFT = 280
const MIN_COLUMN_RIGHT = 420

function readSizes() {
  try {
    const raw = localStorage.getItem(SIZES_KEY)
    if (!raw) return DEFAULT_SIZES
    const parsed = JSON.parse(raw)
    const left = Number(parsed?.left)
    return { left: Number.isFinite(left) && left > 0 && left < 1 ? left : DEFAULT_SIZES.left }
  } catch {
    return DEFAULT_SIZES
  }
}

function saveSizes(sizes) {
  try {
    localStorage.setItem(SIZES_KEY, JSON.stringify(sizes))
  } catch {
    /* storage unavailable: panel sizes are best-effort */
  }
}

// Returns null when the bounds are impossible (container too small to honour both minimums).
function clampRatio(value, min, max) {
  if (!(max > min)) return null
  return Math.min(Math.max(value, min), max)
}

function PanelSplitter({ axis, onRatio, onCommit, onReset, onDragging }) {
  const active = useRef(false)
  const isRow = axis === 'row'

  const handlePointerDown = (event) => {
    event.preventDefault()
    active.current = true
    onDragging?.(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* pointer capture is best-effort */
    }
  }

  const handlePointerMove = (event) => {
    if (!active.current) return
    onRatio?.(event.clientX, event.clientY)
  }

  const handlePointerUp = (event) => {
    if (!active.current) return
    active.current = false
    onDragging?.(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    onCommit?.()
  }

  return (
    <div
      role="separator"
      aria-orientation={isRow ? 'horizontal' : 'vertical'}
      title="Drag to resize · double-click to reset"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onReset}
      className={`group hidden shrink-0 touch-none select-none items-center justify-center lg:flex ${
        isRow ? 'h-3 w-full cursor-row-resize' : 'w-2 cursor-col-resize'
      }`}
    >
      <div
        className={`rounded-full bg-slate-300 transition-all group-hover:bg-blue-500 ${
          isRow ? 'h-1.5 w-14' : 'h-10 w-1 group-hover:w-1.5'
        }`}
      />
    </div>
  )
}

function draftKeyFor(attemptId, questionId) {
  return `dtep_coding_draft_v1:${attemptId}:${questionId}`
}

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { language: null, code: {} }
    const parsed = JSON.parse(raw)
    return {
      language: typeof parsed?.language === 'string' ? parsed.language : null,
      code: parsed?.code && typeof parsed.code === 'object' ? parsed.code : {},
    }
  } catch {
    return { language: null, code: {} }
  }
}

// Runner failures (load_error) are not axios errors, so handle them before the API mapper.
function runnerErrorMessage(err, language) {
  if (err?.status === 'load_error') {
    return `The ${LANGUAGE_LABEL[language] || language} runner could not be loaded. Check your connection and try again.`
  }
  return describeCodingError(err)
}

function caseTone(result, judged) {
  if (result.status === 'timeout') return { label: 'Timed out', cls: 'text-rose-700 bg-rose-50 border-rose-200' }
  if (result.status === 'runtime_error') return { label: 'Runtime error', cls: 'text-rose-700 bg-rose-50 border-rose-200' }
  if (!judged) return { label: 'Ran', cls: 'text-slate-700 bg-slate-50 border-slate-200' }
  return result.passed
    ? { label: 'Passed', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    : { label: 'Wrong answer', cls: 'text-amber-700 bg-amber-50 border-amber-200' }
}

export default function CodingQuestionPanel({
  attemptId, questionId, title, maxMarks, onResult, antiCheatActive = false, onRestrictedAction,
}) {
  const draftKey = draftKeyFor(attemptId, questionId)
  const initialDraft = useMemo(() => readDraft(draftKey), [draftKey])
  const initialSizes = useMemo(() => readSizes(), [])

  const [question, setQuestion] = useState(null)
  const [loadingQuestion, setLoadingQuestion] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [language, setLanguage] = useState(initialDraft.language)
  const [codeByLang, setCodeByLang] = useState(initialDraft.code)
  const [customInput, setCustomInput] = useState('')

  const [busy, setBusy] = useState(null) // null | 'run' | 'submit'
  const [runnerStatus, setRunnerStatus] = useState(null)
  const [runResults, setRunResults] = useState(null)
  const [runJudged, setRunJudged] = useState(true)
  const [runError, setRunError] = useState('')
  const [submitResult, setSubmitResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [tab, setTab] = useState('input')

  // Splitter state (large screens only).
  const [leftRatio, setLeftRatio] = useState(initialSizes.left)
  const [dragging, setDragging] = useState(false)
  const [isLg, setIsLg] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )
  const leftColRef = useRef(null)
  const rightColRef = useRef(null)
  const consolePaneRef = useRef(null)

  useEffect(() => {
    let mounted = true
    setLoadingQuestion(true)
    fetchCodingQuestion(questionId)
      .then((data) => {
        if (!mounted) return
        setQuestion(data)
        setLoadError('')
      })
      .catch((err) => {
        if (mounted) setLoadError(describeCodingError(err))
      })
      .finally(() => {
        if (mounted) setLoadingQuestion(false)
      })
    return () => {
      mounted = false
    }
  }, [questionId])

  // Pick a valid language and seed starter code once the question loads.
  useEffect(() => {
    if (!question) return
    const allowed = question.allowed_languages?.length ? question.allowed_languages : ['python']
    setLanguage((prev) => (prev && allowed.includes(prev) ? prev : allowed[0]))
    setCodeByLang((prev) => {
      const next = { ...prev }
      for (const lang of allowed) {
        if (next[lang] == null) next[lang] = question.starter_code?.[lang] ?? ''
      }
      return next
    })
  }, [question])

  // Keep each question's draft per attempt in localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ language, code: codeByLang }))
    } catch {
      /* storage full or unavailable: drafts are best-effort */
    }
  }, [draftKey, language, codeByLang])

  // Track the lg breakpoint so the flex-based split layout only applies on large screens.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = (event) => setIsLg(event.matches)
    setIsLg(media.matches)
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  // Disable text selection on the page while a splitter drag is in flight.
  useEffect(() => {
    if (!dragging) return undefined
    const previous = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = previous
    }
  }, [dragging])

  // Clamp the stored column ratio to the current width.
  useEffect(() => {
    if (!isLg) return
    const left = leftColRef.current
    const right = rightColRef.current
    if (!left || !right) return
    const total = left.offsetWidth + right.offsetWidth
    const next = total ? clampRatio(leftRatio * total, MIN_COLUMN_LEFT, total - MIN_COLUMN_RIGHT) : null
    if (next !== null) setLeftRatio(next / total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLg])

  const allowedLanguages = question?.allowed_languages?.length ? question.allowed_languages : ['python']
  const visibleCases = useMemo(
    () => (question?.test_cases || []).filter((c) => !c.is_hidden),
    [question]
  )
  const code = codeByLang[language] ?? ''
  const setCode = useCallback(
    (value) => setCodeByLang((prev) => ({ ...prev, [language]: value })),
    [language]
  )

  // Splitter drag: measured against the real pane sizes so the handle tracks the pointer.
  const handleColumnDrag = useCallback((clientX) => {
    const left = leftColRef.current
    const right = rightColRef.current
    if (!left || !right) return
    const total = left.offsetWidth + right.offsetWidth
    if (!total) return
    const next = clampRatio(clientX - left.getBoundingClientRect().left, MIN_COLUMN_LEFT, total - MIN_COLUMN_RIGHT)
    if (next !== null) setLeftRatio(next / total)
  }, [])

  const commitSizes = () => saveSizes({ left: leftRatio })
  const resetColumnSize = () => {
    setLeftRatio(DEFAULT_SIZES.left)
    saveSizes({ left: DEFAULT_SIZES.left })
  }
  const resetLayout = () => {
    try {
      localStorage.removeItem(SIZES_KEY)
    } catch {
      /* ignore */
    }
    setLeftRatio(DEFAULT_SIZES.left)
  }

  const resetOutput = () => {
    setRunError('')
    setRunResults(null)
    setSubmitError('')
    setSubmitResult(null)
  }

  const handleRun = async () => {
    if (busy) return
    resetOutput()
    setTab('output')
    if (!code.trim()) {
      setRunError('Your code is empty. Write something before running.')
      return
    }

    const useCustom = customInput !== ''
    let cases
    if (useCustom) {
      cases = [{ id: CUSTOM_CASE_ID, input: customInput }]
    } else {
      if (!visibleCases.length) {
        setRunError('This question has no sample cases. Type custom input above and run again.')
        return
      }
      cases = visibleCases.map((c) => ({ id: c.id, input: c.input ?? '', expected_output: c.expected_output }))
    }

    setRunJudged(!useCustom)
    setBusy('run')
    try {
      const results = await runCodingQuestion({
        language,
        sourceCode: code,
        cases,
        onStatus: setRunnerStatus,
      })
      setRunResults(results)
    } catch (err) {
      setRunError(runnerErrorMessage(err, language))
    } finally {
      setBusy(null)
      setRunnerStatus(null)
      setTab('output')
    }
  }

  const handleSubmit = async () => {
    if (busy) return
    resetOutput()
    setTab('result')
    if (!code.trim()) {
      setSubmitError('Your code is empty. Write a solution before submitting.')
      return
    }

    setBusy('submit')
    try {
      const gradingCases = await fetchGradingCases(questionId, attemptId)
      const cases = (gradingCases || []).map((c) => ({
        id: c.id,
        input: c.input ?? '',
        expected_output: c.expected_output,
        expected_hash: c.expected_hash,
      }))
      if (!cases.length) {
        const e = new Error('No grading cases available.')
        e.friendly = 'No grading cases are available for this question yet.'
        throw e
      }

      const results = await runCodingQuestion({
        language,
        sourceCode: code,
        cases,
        onStatus: setRunnerStatus,
      })
      const result = await submitCodingSolution({
        questionId,
        attemptId,
        language,
        sourceCode: code,
        caseResults: toCaseResultsPayload(results),
      })
      setSubmitResult(result)
      onResult?.(result)
    } catch (err) {
      setSubmitError(err?.friendly || runnerErrorMessage(err, language))
    } finally {
      setBusy(null)
      setRunnerStatus(null)
      setTab('result')
    }
  }

  const runnerMessage = (() => {
    if (!runnerStatus) return ''
    if (runnerStatus.phase === 'loading') {
      return runnerStatus.message || `Loading the ${LANGUAGE_LABEL[language] || language} runner…`
    }
    if (runnerStatus.phase === 'case') {
      return `Running on case ${runnerStatus.index + 1} of ${runnerStatus.total}…`
    }
    return ''
  })()

  if (loadingQuestion) {
    return (
      <div className="flex items-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Loading coding question…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Unable to load this coding question
        </div>
        <p className="mt-1.5">{loadError}</p>
      </div>
    )
  }

  const disabled = Boolean(busy)

  const busyText =
    busy === 'run' ? runnerMessage || 'Running…' : busy === 'submit' ? runnerMessage || 'Submitting…' : ''

  return (
    <div className={`grid gap-6 lg:flex lg:min-w-0 lg:flex-row lg:gap-0 ${dragging ? 'select-none' : ''}`}>
      {/* Left: statement, constraints, visible samples */}
      <div
        ref={leftColRef}
        className="space-y-5 lg:max-h-[calc(100vh-220px)] lg:min-w-[280px] lg:overflow-y-auto lg:pr-2 lg:pb-6"
        style={isLg ? { flexGrow: leftRatio, flexBasis: 0 } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-xl leading-snug text-slate-900">{question?.title || title}</h2>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {question?.max_marks ?? maxMarks ?? 0} marks
          </span>
        </div>

        {question?.statement && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{question.statement}</p>
        )}

        {question?.constraints && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Constraints</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{question.constraints}</p>
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sample cases</p>
          {visibleCases.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No sample cases were provided for this question.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {visibleCases.map((c, i) => (
                <div key={c.id ?? i} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold text-slate-500">Case {i + 1}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Input</p>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2.5 font-mono text-xs text-slate-800">
                        {c.input === '' ? '(no input)' : c.input}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Expected output</p>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2.5 font-mono text-xs text-slate-800">
                        {c.expected_output === '' ? '(no output)' : c.expected_output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console */}
        <div ref={consolePaneRef} className="shrink-0 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Terminal className="h-3.5 w-3.5" />
              Console
            </span>
            {[
              { key: 'input', label: 'Input' },
              { key: 'output', label: 'Output' },
              { key: 'result', label: 'Result' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={resetLayout}
              title="Clear the saved panel sizes and restore the defaults"
              className="ml-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Reset layout
            </button>
            {busyText && (
              <span className="ml-auto flex items-center gap-1.5 pr-1 text-[11px] font-semibold text-blue-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {busyText}
              </span>
            )}
          </div>

          <div className="h-[220px] overflow-y-auto p-4 pb-6">
            {tab === 'input' && (
              <>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Custom input
                </label>
                <textarea
                  rows={3}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  disabled={disabled}
                  placeholder="Leave empty to run the visible samples, or type stdin here."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 font-mono text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {customInput !== '' ? 'Run uses your custom input.' : 'Run uses the visible sample cases.'}
                </p>
                <p className="mt-3 text-[11px] text-slate-400">
                  Run executes in your browser only and is never sent to the server. Your draft is saved for this attempt.
                </p>
              </>
            )}

            {tab === 'output' && (
              <>
                {runError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {runError}
                  </div>
                )}
                {runResults && (
                  <div className="space-y-2.5">
                    {runResults.map((r, i) => {
                      const tone = caseTone(r, runJudged)
                      return (
                        <div key={r.case_id ?? i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              {r.case_id === CUSTOM_CASE_ID ? 'Custom input' : `Case ${i + 1}`}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.cls}`}>
                              {tone.label}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">Output</p>
                            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-2.5 font-mono text-xs text-slate-800">
                              {r.stdout === '' ? '(no output)' : r.stdout}
                            </pre>
                          </div>
                          {r.stderr && (
                            <div className="mt-2">
                              <p className="text-[10px] uppercase tracking-wider text-rose-500">Error</p>
                              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-rose-50 p-2.5 font-mono text-xs text-rose-700">
                                {r.stderr}
                              </pre>
                            </div>
                          )}
                          {r.status === 'timeout' && (
                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-600">
                              <Timer className="h-3 w-3" />
                              Your code did not finish in time (5s limit for this case).
                            </p>
                          )}
                        </div>
                      )
                    })}
                    {!runJudged && (
                      <p className="text-[11px] text-slate-400">
                        Custom input runs are not graded (no expected output), so only the program output is shown.
                      </p>
                    )}
                  </div>
                )}
                {!runError && !runResults && (
                  <p className="text-xs text-slate-400">Run or submit to see results here.</p>
                )}
              </>
            )}

            {tab === 'result' && (
              <>
                {submitError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {submitError}
                  </div>
                )}

                {submitResult && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {submitResult.status === 'accepted' ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-amber-600" />
                        )}
                        <span className="text-sm font-bold uppercase tracking-wide text-slate-800">
                          {String(submitResult.status || '').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="font-mono text-lg font-bold tabular-nums text-slate-900">
                        {submitResult.score}
                        <span className="text-xs font-semibold text-slate-500"> / {submitResult.max_score}</span>
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {submitResult.passed} of {submitResult.total} cases passed. This score counts toward your test result.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(submitResult.cases || []).map((c) => (
                        <span
                          key={c.index}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                            c.passed
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {c.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          Case {c.index + 1}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <ChevronRight className="h-3 w-3" />
                      Submitting code does not end the test. Use “Submit test” in the header when you are done.
                    </p>
                  </div>
                )}

                {!submitError && !submitResult && (
                  <p className="text-xs text-slate-400">Run or submit to see results here.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <PanelSplitter
        axis="col"
        onRatio={handleColumnDrag}
        onCommit={commitSizes}
        onReset={resetColumnSize}
        onDragging={setDragging}
      />

      {/* Right: toolbar and editor only. The console lives in the left column. */}
      <div
        ref={rightColRef}
        className="flex flex-col gap-4 lg:min-w-[420px]"
        style={isLg ? { flexGrow: 1 - leftRatio, flexBasis: 0 } : undefined}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 lg:pb-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Language
            <select
              value={language || ''}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={disabled}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            >
              {allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABEL[lang] || lang}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === 'run' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {busy === 'run' ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === 'submit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {busy === 'submit' ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>

        <div
          className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
          style={{ height: 'clamp(360px, 62vh, 640px)' }}
        >
          <CodeEditor
            language={language}
            value={code}
            onChange={setCode}
            height="100%"
            antiCheatActive={antiCheatActive}
            onRestrictedAction={onRestrictedAction}
          />
        </div>
      </div>
    </div>
  )
}
