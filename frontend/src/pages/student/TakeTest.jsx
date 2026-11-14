import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Eraser,
  Trophy,
  Check,
  Loader2,
  Maximize2,
  MonitorOff,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { fetchAttemptClock, fetchTestDetails, saveResponse, submitTest, startTest } from '../../services/api.js'
import { fetchCodingQuestionsForTest, describeCodingError } from '../../services/codingApi.js'
import { disposeRunners } from '../../lib/codeRunner.js'
import CodingQuestionPanel from '../../components/coding/CodingQuestionPanel.jsx'
import useAntiCheat from '../../features/antiCheat/useAntiCheat.js'
import { decideInternalPaste } from '../../features/antiCheat/logic.js'

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(m)}:${pad(s)}`
}

function storageGet(key) {
  try { return window.localStorage.getItem(key) } catch { return null }
}

function storageSet(key, value) {
  try { window.localStorage.setItem(key, value) } catch { /* best-effort restore */ }
}

function storageRemove(key) {
  try { window.localStorage.removeItem(key) } catch { /* best-effort cleanup */ }
}

const PAPER = '#FAF9F6'
const IVORY = '#F2F0EA'
const INK = '#161A22'
const FOREST = '#1F4A3D'
const HAIRLINE = '#DEDACE'
const SLATE = '#5C5A52'
const BRASS = '#A8823A'
const ERROR = '#8C3A2E'
const SUCCESS = '#4B6B3A'

export default function TakeTest() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [testData, setTestData] = useState(null)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [showRules, setShowRules] = useState(true)
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [responses, setResponses] = useState({})
  const [visited, setVisited] = useState({})
  const [bookmarks, setBookmarks] = useState({})
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false)
  const [showTerminated, setShowTerminated] = useState(false)
  const [deviceMessage, setDeviceMessage] = useState('')

  // Coding questions share this attempt, timer and violation counter.
  const [codingQuestions, setCodingQuestions] = useState([])
  const [codingError, setCodingError] = useState('')
  const [attemptId, setAttemptId] = useState(null)
  const [clientSessionId, setClientSessionId] = useState('')
  const [codingStatus, setCodingStatus] = useState({})

  const containerRef = useRef(null)
  const textareaClipboardRef = useRef({ owner: null, text: '' })
  const autoSubmitRef = useRef(false)
  const pendingResponseSavesRef = useRef(new Map())
  const [saveRevision, setSaveRevision] = useState(0)

  const showFinalResult = useCallback(() => {
    if (!attemptId) return
    storageRemove(`dtep_active_test_attempt:${id}`)
    storageRemove(`dtep_test_state_v1:${attemptId}`)
    navigate(`/result/${attemptId}`)
  }, [attemptId, id, navigate])
  const showTerminationResult = useCallback(() => {
    setShowTerminated(true)
    window.setTimeout(() => {
      if (attemptId) {
        storageRemove(`dtep_active_test_attempt:${id}`)
        storageRemove(`dtep_test_state_v1:${attemptId}`)
        navigate(`/result/${attemptId}`)
      }
    }, 1800)
  }, [attemptId, id, navigate])
  const antiCheat = useAntiCheat({
    attemptId,
    active: started && !submitting,
    clientSessionId,
    containerRef,
    onTerminated: showTerminationResult,
    onFinalized: showFinalResult,
  })
  const secondsLeft = antiCheat.remainingSeconds ?? 0
  const isFullscreen = antiCheat.isFullscreen

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchTestDetails(id)
        if (mounted) {
          setTestData(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setTestData(null)
          setError(err.response?.data?.detail || 'The test could not be loaded. Check your connection and retry.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, retryKey])

  // Coding questions live in their own resource and share the test attempt.
  useEffect(() => {
    if (!testData) return undefined
    let mounted = true
    ;(async () => {
      try {
        const list = await fetchCodingQuestionsForTest(id)
        if (!mounted) return
        const items = Array.isArray(list) ? list : []
        setCodingQuestions(items)
        setCodingError('')
      } catch (err) {
        if (!mounted) return
        // 404 means the test has no coding questions available to this student.
        if (err?.response?.status === 404) {
          setCodingQuestions([])
        } else {
          setCodingError(describeCodingError(err))
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, testData])

  // Restore an attempt only when this browser has already recorded its id.
  // There is no student-facing response-read endpoint for server autosaves.
  useEffect(() => {
    if (!testData) return undefined
    const activeAttemptKey = `dtep_active_test_attempt:${id}`
    const savedStatePrefix = 'dtep_test_state_v1:'
    const stored = storageGet(activeAttemptKey)
    if (!stored) return undefined
    let activeAttempt
    try {
      activeAttempt = JSON.parse(stored)
    } catch {
      activeAttempt = { id: stored, client_session_id: '' }
    }
    if (!activeAttempt?.id) return undefined
    let mounted = true
    ;(async () => {
      try {
        const clock = await fetchAttemptClock(activeAttempt.id)
        if (!mounted) return
        if (clock.status === 'TERMINATED' || clock.status === 'SUBMITTED') {
          storageRemove(activeAttemptKey)
          navigate(`/result/${activeAttempt.id}`)
          return
        }
        setAttemptId(activeAttempt.id)
        setClientSessionId(activeAttempt.client_session_id || '')
        const saved = storageGet(`${savedStatePrefix}${activeAttempt.id}`)
        if (saved) {
          const state = JSON.parse(saved)
          setResponses(state.responses || {})
          setCurrentIdx(Number.isInteger(state.currentIdx) ? state.currentIdx : 0)
          setBookmarks(state.bookmarks || {})
          setVisited(state.visited || {})
        }
        setStartTime(Date.parse(activeAttempt.started_at) || Date.now())
        setStarted(true)
        setShowRules(false)
        setShowFullscreenOverlay(true)
      } catch {
        if (mounted) storageRemove(activeAttemptKey)
      }
    })()
    return () => { mounted = false }
  }, [id, testData, navigate])

  // Terminate the code runners when leaving the test.
  useEffect(() => () => disposeRunners(), [])

  const requestFullscreen = async () => {
    const el = containerRef.current || document.documentElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else return false
      const entered = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      return entered
    } catch (_) {
      return false
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
    } catch (_) {}
  }

  const beginTest = async () => {
    const el = containerRef.current || document.documentElement
    const canFullscreen = Boolean(el.requestFullscreen || el.webkitRequestFullscreen)
    const desktop = window.innerWidth >= 768 && (!window.matchMedia || window.matchMedia('(pointer: fine)').matches)
    if (!desktop || !canFullscreen) {
      setDeviceMessage('Please use a desktop browser with fullscreen support to take this test.')
      return
    }
    const entered = await requestFullscreen()
    if (!entered) {
      setDeviceMessage('Fullscreen is required to start. Allow fullscreen access and try again.')
      return
    }
    setDeviceMessage('')

    try {
      let attempt
      if (attemptId) {
        const clock = await fetchAttemptClock(attemptId)
        if (clock.status === 'TERMINATED' || clock.status === 'SUBMITTED') {
          navigate(`/result/${attemptId}`)
          return
        }
        attempt = { id: attemptId, started_at: startTime, client_session_id: clientSessionId }
      } else {
        const sessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
        attempt = await startTest({ test_id: id, client_session_id: sessionId })
        if (!attempt?.id) throw new Error('Attempt could not be started.')
        if (attempt.status === 'TERMINATED' || attempt.status === 'SUBMITTED') {
          navigate(`/result/${attempt.id}`)
          return
        }
        setAttemptId(attempt.id)
        setClientSessionId(attempt.client_session_id || sessionId)
        storageSet(`dtep_active_test_attempt:${id}`, JSON.stringify({
          id: attempt.id,
          started_at: attempt.started_at,
          client_session_id: attempt.client_session_id || sessionId,
        }))
        setVisited({ 0: true })
      }
      setStartTime(typeof attempt.started_at === 'number'
        ? attempt.started_at
        : (Date.parse(attempt.started_at) || Date.now()))
      setStarted(true)
      setShowRules(false)
      setShowFullscreenOverlay(false)
    } catch (err) {
      setDeviceMessage(err.response?.data?.detail || 'Could not start the test. Check your connection and retry.')
    }
  }

  const questions = testData?.questions || []
  // Coding questions are appended after the test's own questions so the palette,
  // timer and violation counter stay shared.
  const codingItems = codingQuestions.map((cq, i) => ({
    ...cq,
    type: 'coding',
    number: questions.length + i + 1,
  }))
  const allQuestions = [...questions, ...codingItems]
  const total = allQuestions.length
  const q = allQuestions[currentIdx]

  // Count answered items (MCQ options, descriptive text, and submitted coding questions)
  const answeredCount = useMemo(() => {
    const mcqAnswered = Object.entries(responses).filter(([, val]) => {
      if (val === null || val === undefined) return false
      if (typeof val === 'string' && val.trim() === '') return false
      return true
    }).length
    const codingAnswered = codingQuestions.filter((cq) => codingStatus[cq.id]).length
    return mcqAnswered + codingAnswered
  }, [responses, codingQuestions, codingStatus])

  const unansweredForSubmit = Math.max(0, total - answeredCount)

  const toneWarn = secondsLeft < 300
    ? { color: ERROR, background: '#F9ECE9', borderColor: '#E7C9C3' }
    : secondsLeft < 600
    ? { color: BRASS, background: '#F8F3E6', borderColor: '#E5D8B8' }
    : { color: FOREST, background: '#EBF1EC', borderColor: '#C9D9D0' }
  const toneNum = secondsLeft < 300 ? { color: ERROR } : secondsLeft < 600 ? { color: BRASS } : { color: INK }

  const queueResponseSave = (questionId, value, isDescriptive) => {
    pendingResponseSavesRef.current.set(questionId, { questionId, value, isDescriptive })
    setSaveRevision((revision) => revision + 1)
  }

  useEffect(() => {
    if (!attemptId || !started) return
    try {
      storageSet(`dtep_test_state_v1:${attemptId}`, JSON.stringify({
        responses, currentIdx, bookmarks, visited,
      }))
    } catch {
      // Browser restoration is best-effort when storage is unavailable.
    }
  }, [attemptId, started, responses, currentIdx, bookmarks, visited])

  useEffect(() => {
    if (!attemptId || !started || submitting || pendingResponseSavesRef.current.size === 0) return undefined
    const timer = window.setTimeout(async () => {
      const pending = [...pendingResponseSavesRef.current.values()]
      pendingResponseSavesRef.current.clear()
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index]
        try {
          await saveResponse({
            attempt_id: attemptId,
            question_id: item.questionId,
            selected_option_id: item.isDescriptive ? null : item.value,
            descriptive_text: item.isDescriptive ? item.value : undefined,
            client_session_id: clientSessionId,
          })
        } catch (err) {
          const code = err.response?.data?.code
          if (code === 'attempt_terminated') showTerminationResult()
          else if (code === 'attempt_finalized' || code === 'attempt_expired') showFinalResult()
        }
        if (index < pending.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 1100))
      }
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [attemptId, started, submitting, clientSessionId, saveRevision, showFinalResult, showTerminationResult])

  const selectOption = (optionId) => {
    if (!q) return
    const value = responses[q.id] === optionId ? null : optionId
    setResponses((prev) => ({ ...prev, [q.id]: value }))
    queueResponseSave(q.id, value, false)
  }

  const handleTextChange = (e) => {
    if (!q) return
    const text = e.target.value
    setResponses((prev) => ({ ...prev, [q.id]: text }))
    queueResponseSave(q.id, text, true)
  }

  const reportRestrictedAction = (action) => {
    const labels = { copy: 'Copy', cut: 'Cut', paste: 'Paste', contextmenu: 'Right-click', drag: 'Dragging' }
    antiCheat.showToast(`${labels[action] || action} is disabled during the test.`)
    antiCheat.queueEvent('COPY_PASTE', { action })
  }

  const handleTextareaClipboard = (event, action) => {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    const value = String(responses[q?.id] || '')
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? start
    reportRestrictedAction(action)

    if (action === 'copy' || action === 'cut') {
      textareaClipboardRef.current = { owner: target, text: value.slice(start, end) }
      if (action === 'cut' && end > start) {
        const next = `${value.slice(0, start)}${value.slice(end)}`
        setResponses((prev) => ({ ...prev, [q.id]: next }))
        queueResponseSave(q.id, next, true)
      }
      return
    }

    const decision = decideInternalPaste({
      owner: textareaClipboardRef.current.owner,
      target,
      internalText: textareaClipboardRef.current.text,
    })
    if (!decision.allowed) return
    const next = `${value.slice(0, start)}${decision.text}${value.slice(end)}`
    setResponses((prev) => ({ ...prev, [q.id]: next }))
    queueResponseSave(q.id, next, true)
    window.setTimeout(() => {
      target.focus()
      target.setSelectionRange(start + decision.text.length, start + decision.text.length)
    }, 0)
  }

  const clearResponse = () => {
    if (!q) return
    setResponses((prev) => ({ ...prev, [q.id]: null }))
    queueResponseSave(q.id, null, isCurrentDescriptive)
  }

  const toggleBookmark = () => {
    if (!q) return
    setBookmarks((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
  }

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
      setVisited((v) => ({ ...v, [currentIdx - 1]: true }))
    }
  }
  const goNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1)
      setVisited((v) => ({ ...v, [currentIdx + 1]: true }))
    } else {
      setShowSubmit(true)
    }
  }
  const goTo = (i) => {
    setCurrentIdx(i)
    setVisited((v) => ({ ...v, [i]: true }))
  }

  const getTimeTaken = () => {
    if (!startTime) return 0
    return Math.floor((Date.now() - startTime) / 1000)
  }

  const buildAnswersPayload = () => {
    return Object.entries(responses)
      .filter(([, val]) => {
        if (val == null) return false
        if (typeof val === 'string' && val.trim() === '') return false
        return true
      })
      .map(([qid, val]) => {
        const questionObj = questions.find((item) => item.id === qid || String(item.id) === String(qid))
        const isDescriptive =
          questionObj?.question_type === 'DESCRIPTIVE' ||
          questionObj?.question_type === 'subjective' ||
          questionObj?.type === 'DESCRIPTIVE' ||
          questionObj?.type === 'subjective'

        if (isDescriptive) {
          return { question_id: qid, descriptive_text: val, text: val }
        }
        return { question_id: qid, selected_option_id: val }
      })
  }

  const submitWithRetry = async () => {
    const payload = { time_taken_seconds: getTimeTaken(), answers: buildAnswersPayload() }
    let lastError
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result = await submitTest(id, payload)
        storageRemove(`dtep_active_test_attempt:${id}`)
        storageRemove(`dtep_test_state_v1:${attemptId}`)
        await exitFullscreen()
        navigate(`/result/${result.submission_id}`)
        return
      } catch (err) {
        const code = err.response?.data?.code
        if (['attempt_finalized', 'attempt_terminated', 'attempt_expired'].includes(code)) {
          storageRemove(`dtep_active_test_attempt:${id}`)
          storageRemove(`dtep_test_state_v1:${attemptId}`)
          await exitFullscreen()
          navigate(`/result/${attemptId}`)
          return
        }
        lastError = err
        if (attempt < 4) await new Promise((resolve) => window.setTimeout(resolve, Math.min(4000, 500 * (2 ** attempt))))
      }
    }
    throw lastError
  }

  const handleForceSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await submitWithRetry()
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  const confirmSubmit = async () => {
    setShowSubmit(false)
    await handleForceSubmit()
  }

  useEffect(() => {
    if (antiCheat.remainingSeconds !== 0 || !antiCheat.deadline || !started || submitting || autoSubmitRef.current) return
    autoSubmitRef.current = true
    void handleForceSubmit()
  }, [antiCheat.remainingSeconds, antiCheat.deadline, started, submitting])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAPER, color: INK }}>
        <div className="flex items-center gap-3" style={{ color: SLATE }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: FOREST }} />
          <span className="text-sm font-semibold font-mono">Loading test…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: PAPER, color: INK }}>
        <div className="max-w-md w-full rounded-md border p-8 text-center" style={{ backgroundColor: 'white', borderColor: HAIRLINE }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md" style={{ backgroundColor: '#F9ECE9', color: ERROR }}>
            <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold" style={{ color: INK }}>Unable to load test</h2>
          <p className="mt-2 text-sm" style={{ color: SLATE }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetryKey((value) => value + 1) }}
            className="mt-6 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: FOREST, color: PAPER }}>
            <Loader2 className="h-4 w-4" /> Retry loading test
          </button>
          <button onClick={() => navigate('/student')} className="mt-4 block w-full text-sm" style={{ color: SLATE }}>
            <ArrowLeft className="mr-1 inline h-4 w-4" /> Return to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (showRules) {
    return (
      <div className="min-h-screen bg-cream-100 text-charcoal-300" ref={containerRef}>
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
          <button onClick={() => navigate('/student')} className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-100 transition-colors duration-200 hover:text-charcoal-300">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to my tests
          </button>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-5xl border border-beige-100 bg-white p-8 lg:p-10 shadow-soft overflow-hidden relative">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-olive-200/60 to-transparent blur-2xl" aria-hidden />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive-500">Test overview</p>
                <h1 className="mt-3 font-serif text-[2.25rem] leading-[1.08] tracking-tight font-semibold text-charcoal-300">
                  {testData.title}
                </h1>
                {testData.description && (
                  <p className="mt-3 text-sm text-charcoal-100 leading-relaxed">{testData.description}</p>
                )}

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-cream-100 p-4 text-center">
                    <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl bg-white text-olive-500">
                      <Clock className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-wider font-semibold text-charcoal-50">Duration</p>
                    <p className="mt-1 font-serif text-xl font-semibold text-charcoal-300">
                      {Number(testData.duration_minutes) > 0 ? <>{testData.duration_minutes}<span className="text-[11px] text-charcoal-50 ml-1">min</span></> : 'No deadline'}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-cream-100 p-4 text-center">
                    <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl bg-white text-olive-500">
                      <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-wider font-semibold text-charcoal-50">Questions</p>
                    <p className="mt-1 font-serif text-xl font-semibold text-charcoal-300">{total}</p>
                  </div>
                  <div className="rounded-3xl bg-cream-100 p-4 text-center">
                    <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl bg-white text-olive-500">
                      <Trophy className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-wider font-semibold text-charcoal-50">Marks</p>
                    <p className="mt-1 font-serif text-xl font-semibold text-charcoal-300">{total}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-100">Rules &amp; Instructions</p>
                  <ol className="space-y-2.5 text-sm leading-relaxed text-charcoal-200 list-decimal list-inside marker:text-olive-500 marker:font-semibold">
                    <li>Full-screen mode is <span className="font-semibold text-charcoal-300">required</span> throughout the test.</li>
                    <li>Switching tabs, minimizing, or exiting full-screen counts as a violation.</li>
                    <li>Right-click, copy, paste, and cut actions are <span className="font-semibold text-charcoal-300">disabled</span>.</li>
                    <li>Reaching the server's limit for tab switches and fullscreen exits terminates the attempt. Copy and paste restrictions are recorded but do not count.</li>
                  </ol>
                </div>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={beginTest}
                    className="group inline-flex items-center gap-2.5 rounded-full bg-charcoal-300 px-6 py-3.5 text-sm font-semibold text-cream-100 transition-all duration-300 hover:bg-charcoal-400 hover:shadow-soft-xl hover:-translate-y-0.5"
                  >
                    <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
                    Enter fullscreen &amp; start
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => navigate('/student')}
                    className="inline-flex items-center gap-2 rounded-full border border-beige-200 bg-white px-6 py-3.5 text-sm font-semibold text-charcoal-200 transition-colors duration-200 hover:border-beige-300 hover:text-charcoal-300"
                  >
                    Cancel &amp; return later
                  </button>
                </div>
                {deviceMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{deviceMessage}</p>}
              </div>
            </div>

            <div className="space-y-6 lg:pt-10">
              <div className="rounded-4xl border border-beige-100 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-100">Question palette legend</p>
                <div className="mt-5 space-y-3 text-sm">
                  {[
                    { dot: 'bg-olive-400', label: 'Answered' },
                    { dot: 'bg-beige-100 text-charcoal-200', label: 'Not answered' },
                    { dot: 'bg-charcoal-300', label: 'Currently viewing' },
                    { dot: 'bg-white border border-beige-100', label: 'Not visited' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2.5">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-cream-100 ${l.dot}`} />
                      <span className="text-charcoal-200">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isCurrentCoding = q?.type === 'coding'

  const isCurrentDescriptive =
    q?.question_type === 'DESCRIPTIVE' ||
    q?.question_type === 'subjective' ||
    q?.type === 'DESCRIPTIVE' ||
    q?.type === 'subjective'

  const currentText = typeof responses[q?.id] === 'string' ? responses[q?.id] : ''
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length
  const charCount = currentText.length

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 ${isFullscreen ? 'h-screen overflow-y-auto' : ''}`}
      ref={containerRef}
    >
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-x-2.5 gap-y-2 px-3 py-2.5 sm:h-18 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-0 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 flex-shrink-0">
              <FileText className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-50">Test #{testData.id}</p>
              <p className="truncate font-serif text-sm font-semibold text-charcoal-300 sm:text-base">{testData.title}</p>
            </div>
          </div>

          {antiCheat.remainingSeconds !== null && <div className={`order-last inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1.5 font-medium shadow-soft-sm sm:order-none sm:w-auto sm:gap-2.5 sm:px-4 sm:py-2 ${toneWarn}`}>
            <Clock className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80">Time left</span>
            <span className={`font-serif text-base font-bold tabular-nums sm:text-lg ${toneNum}`}>{formatTime(secondsLeft)}</span>
          </div>}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] ${
              antiCheat.count >= 2 ? 'bg-terracotta-50 text-terracotta-400 border-terracotta-400/30' : antiCheat.count >= 1 ? 'bg-terracotta-50/70 text-terracotta-400 border-terracotta-400/20' : 'bg-olive-50 text-olive-500 border-olive-400/20'
            }`}>
              <MonitorOff className="h-3.5 w-3.5" strokeWidth={2} />
              Violations {antiCheat.count}/{antiCheat.max}
            </span>
            <button
              onClick={() => setShowSubmit(true)}
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-charcoal-300 px-3 py-2 text-[11px] font-semibold text-cream-100 transition-all duration-300 hover:bg-charcoal-400 hover:shadow-soft hover:-translate-y-0.5 disabled:opacity-50 sm:gap-2 sm:px-4.5 sm:py-2.5 sm:text-xs"
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
              {submitting ? 'Submitting…' : 'Submit test'}
            </button>
          </div>
        </div>
      </header>

      {antiCheat.offline && <div role="status" className="sticky top-[4.5rem] z-20 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
        You are offline. Anti-cheating events are queued and will be sent when the connection returns.
      </div>}

      <div className={`mx-auto max-w-[1400px] grid gap-6 px-4 py-6 lg:px-8 ${
        isCurrentCoding
          ? 'lg:flex lg:h-[calc(100vh-4.5rem)] lg:min-h-0 lg:flex-col lg:gap-3 lg:overflow-hidden lg:py-4'
          : 'lg:py-8 lg:grid-cols-[320px_1fr]'
      }`}>
        <aside className={isCurrentCoding ? 'min-h-0 shrink-0' : 'space-y-6'}>
          <div className={
            isCurrentCoding
              ? 'rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm lg:flex lg:items-center lg:gap-4'
              : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24'
          }>
            <div className={isCurrentCoding ? 'flex items-center gap-2' : 'flex items-center justify-between'}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Progress</p>
              <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {answeredCount}<span className="text-xs text-slate-500 font-medium"> / {total}</span>
              </span>
            </div>
            <div className={
              isCurrentCoding
                ? 'mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 lg:mt-0 lg:w-40 lg:shrink-0'
                : 'mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100'
            }>
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: total ? `${(answeredCount / total) * 100}%` : '0%' }}
              />
            </div>

            <div className={isCurrentCoding ? 'mt-3 lg:mt-0 lg:min-w-0 lg:flex-1' : 'mt-6'}>
              {!isCurrentCoding && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Question palette</p>
              )}
              <div className={isCurrentCoding ? 'flex gap-2 overflow-x-auto pb-1 lg:pb-0' : 'mt-4 grid grid-cols-5 gap-2'}>
                {allQuestions.map((qq, i) => {
                  const val = responses[qq.id]
                  const hasAnswered =
                    (val !== null && val !== undefined && val !== '') ||
                    (qq.type === 'coding' && Boolean(codingStatus[qq.id]))
                  const v = visited[i]
                  const b = bookmarks[qq.id]
                  const cur = i === currentIdx
                  return (
                    <button
                      key={`${qq.type === 'coding' ? 'c' : 'q'}-${qq.id}`}
                      onClick={() => goTo(i)}
                      className={`group relative inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${
                        isCurrentCoding ? 'h-8 w-8 shrink-0' : 'h-10'
                      } ${
                        cur
                          ? 'ring-2 ring-blue-600 bg-blue-50 text-blue-700 shadow-sm scale-[1.03] -translate-y-0.5'
                          : hasAnswered
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : b
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : v
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className={`space-y-6 ${isCurrentCoding ? 'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col' : ''}`}>
          <div className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm ${
            isCurrentCoding ? 'lg:shrink-0 lg:px-4 lg:py-2' : ''
          }`}>
            <div className={`flex items-center gap-3 ${isCurrentCoding ? 'lg:gap-2' : ''}`}>
              <span className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 font-semibold text-white text-base ${
                isCurrentCoding ? 'lg:h-7 lg:w-7 lg:rounded-lg lg:text-xs' : ''
              }`}>
                {currentIdx + 1}
              </span>
              <div className={`leading-tight ${isCurrentCoding ? 'lg:flex lg:items-baseline lg:gap-2' : ''}`}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-charcoal-50">Question {currentIdx + 1} of {total}</p>
                <p className={`text-sm font-medium text-charcoal-100 ${isCurrentCoding ? 'lg:text-xs' : ''}`}>
                  {isCurrentCoding
                    ? 'Write your solution and run it against the samples'
                    : isCurrentDescriptive
                    ? 'Type your subjective answer below'
                    : 'Select one option below'}
                </p>
              </div>
            </div>
          </div>

          {codingError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
              {codingError}
            </div>
          )}

          <div className={`rounded-2xl border border-slate-200 bg-white p-7 lg:p-9 shadow-sm relative ${
            isCurrentCoding ? 'overflow-visible lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:p-6' : 'overflow-hidden'
          }`}>
            {isCurrentCoding ? (
              <>
                <CodingQuestionPanel
                  key={q.id}
                  attemptId={attemptId}
                  questionId={q.id}
                  title={q.title}
                  maxMarks={q.max_marks}
                  antiCheatActive={started && !submitting}
                  onRestrictedAction={reportRestrictedAction}
                  onResult={(result) => setCodingStatus((prev) => ({ ...prev, [q.id]: result }))}
                />
                <div className="mt-8 flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 pt-5 lg:mt-4 lg:pt-3">
                  <button
                    onClick={goPrev}
                    disabled={currentIdx === 0}
                    className="group inline-flex items-center gap-2 rounded-full border border-beige-200 bg-white px-4.5 py-2.5 text-xs font-semibold text-charcoal-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Previous
                  </button>
                  <button
                    onClick={goNext}
                    className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {currentIdx === total - 1 ? 'Finish' : 'Next question'}
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="relative select-none font-serif text-2xl leading-[1.35] text-charcoal-300 lg:text-[1.75rem]">
                  {q?.text}
                </h2>

                <div className="relative mt-8">
              {isCurrentDescriptive ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Your Descriptive Answer
                    </label>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {q?.marks || 5} Marks
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={responses[q.id] || ''}
                    onChange={handleTextChange}
                    onCopy={(event) => handleTextareaClipboard(event, 'copy')}
                    onCut={(event) => handleTextareaClipboard(event, 'cut')}
                    onPaste={(event) => handleTextareaClipboard(event, 'paste')}
                    placeholder="Type your detailed answer here..."
                    className="w-full rounded-2xl border border-slate-200 p-4 text-base text-charcoal-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Auto-saved in session
                    </p>
                    <p className="font-mono tabular-nums">
                      {wordCount} words · {charCount} chars
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {q?.options?.map((opt) => {
                    const isSelected = responses[q.id] === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectOption(opt.id)}
                        className={`group relative flex items-start gap-4 rounded-2xl border p-4 lg:p-5 text-left transition-all duration-250 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200 shadow-sm -translate-y-0.5'
                            : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`relative mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold shrink-0 transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-300 bg-white text-slate-700 group-hover:border-blue-400 group-hover:text-blue-700'
                          }`}
                        >
                          {isSelected && <Check className="absolute inset-0 m-auto h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="select-none pt-0.5 text-base leading-relaxed text-charcoal-200">
                          {opt.text}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="relative mt-8 flex flex-col items-start justify-between gap-4 border-t border-beige-100 pt-6 md:flex-row md:items-center">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={clearResponse}
                  disabled={!responses[q?.id]}
                  className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                >
                  <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Clear response
                </button>
                <button
                  onClick={toggleBookmark}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    bookmarks[q?.id] ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {bookmarks[q?.id] ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {bookmarks[q?.id] ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                  className="group inline-flex items-center gap-2 rounded-full border border-beige-200 bg-white px-4.5 py-2.5 text-xs font-semibold text-charcoal-200 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  Previous
                </button>
                <button
                  onClick={goNext}
                  className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {currentIdx === total - 1 ? 'Finish' : 'Save & Next'}
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-charcoal-400/40 backdrop-blur-sm" onClick={() => setShowSubmit(false)} />
          <div className="relative w-full max-w-md rounded-4xl border border-beige-100 bg-white p-7 shadow-2xl">
            <h3 className="font-serif text-2xl font-semibold text-charcoal-300">Submit your test?</h3>
            <p className="mt-2 text-sm text-charcoal-100 leading-relaxed">
              You answered <span className="font-bold text-charcoal-300">{answeredCount}</span> out of <span className="font-bold text-charcoal-300">{total}</span> questions. Once submitted, answers cannot be changed.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowSubmit(false)}
                className="flex-1 rounded-full border border-beige-200 bg-white px-5 py-3 text-xs font-semibold text-charcoal-200"
              >
                Continue test
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 rounded-full bg-charcoal-300 px-5 py-3 text-xs font-semibold text-cream-100 hover:bg-charcoal-400 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Yes, submit now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(showFullscreenOverlay || antiCheat.fullscreenExited) && !showTerminated && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-6 text-center text-white">
          <div className="max-w-md rounded-2xl border border-white/20 bg-slate-900 p-8 shadow-2xl">
            <MonitorOff className="mx-auto h-10 w-10 text-amber-300" />
            <h2 className="mt-4 text-2xl font-semibold">Return to fullscreen</h2>
            <p className="mt-2 text-sm text-slate-300">The test remains paused behind this notice until fullscreen is restored.</p>
            <button onClick={async () => {
              const entered = await antiCheat.reenterFullscreen()
              if (entered) setShowFullscreenOverlay(false)
            }} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">
              Re-enter fullscreen
            </button>
          </div>
        </div>
      )}
      {showTerminated && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-rose-300" />
            <h2 className="mt-4 text-2xl font-semibold">Test terminated</h2>
            <p className="mt-2 text-sm text-slate-300">The violation limit was reached. Opening your finalized result…</p>
          </div>
        </div>
      )}
      {antiCheat.toast && <div role="status" className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
        {antiCheat.toast}
      </div>}
    </div>
  )
}
