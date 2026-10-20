import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Info,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Percent,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { fetchSubmissionResult } from '../../services/api.js'

function formatTimeTaken(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (n) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`
  if (m > 0) return `${m}m ${pad(s)}s`
  return `${s}s`
}

const optionLabelFromId = (optionId) => {
  if (!optionId) return '— Not answered —'
  if (typeof optionId === 'string' && optionId.startsWith('o')) {
    const index = Number(optionId.replace('o', ''))
    return index ? `Option ${String.fromCharCode(64 + index)}` : 'Option A'
  }
  if (typeof optionId === 'number') return `Option ${String.fromCharCode(64 + optionId)}`
  return `Option ${String(optionId)}`
}

export default function TestResult() {
  const { submissionId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchSubmissionResult(submissionId)
        if (mounted) setResult(data)
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.detail || 'Failed to load result.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [submissionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-900">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
          <span className="text-sm font-semibold font-mono">Loading result…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-slate-100 text-slate-900">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">Unable to load result</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Return to dashboard
          </button>
        </div>
      </div>
    )
  }

  const pct = Number(result.percentage || 0)
  const tone = pct >= 85
    ? { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', num: 'text-emerald-700', bar: 'from-emerald-500 to-emerald-600', icon: <Trophy className="h-5 w-5 text-emerald-700" strokeWidth={1.75} /> }
    : pct >= 70
    ? { pill: 'bg-amber-50 text-amber-700 border-amber-200', num: 'text-amber-700', bar: 'from-amber-500 to-amber-600', icon: <Award className="h-5 w-5 text-amber-700" strokeWidth={1.75} /> }
    : { pill: 'bg-rose-50 text-rose-700 border-rose-200', num: 'text-rose-700', bar: 'from-rose-500 to-rose-600', icon: <Info className="h-5 w-5 text-rose-700" strokeWidth={1.75} /> }

  const details = result.details || []
  const correctCount = details.filter((d) => d.is_correct).length
  const incorrectCount = details.filter((d) => !d.is_correct && d.user_selected_option_id != null).length
  const skippedCount = details.filter((d) => d.user_selected_option_id == null).length
  const total = details.length

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
        <button onClick={() => navigate('/student')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to my tests
        </button>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
          <div className="absolute inset-x-0 -top-1 h-64 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10" aria-hidden />
          <div className="relative p-8 lg:p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-md ring-1 ring-slate-200">
              {pct >= 70 ? (
                <Trophy className="h-10 w-10 text-blue-700" strokeWidth={1.75} />
              ) : (
                <FileText className="h-10 w-10 text-slate-600" strokeWidth={1.75} />
              )}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Submission #{result.submission_id}
            </p>
            <h1 className="mt-3 font-serif text-[2.5rem] leading-tight tracking-tight font-semibold text-slate-900">
              {result.test_title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              {result.passed ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Test passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold">
                  <XCircle className="h-4 w-4" /> Test not passed
                </span>
              )}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
              <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-200">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Score</p>
                <p className={`mt-1 font-mono text-2xl font-semibold ${tone.num}`}>
                  {result.score}<span className="text-sm text-slate-500"> / {result.total_marks}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-200">
                <div className="flex items-center justify-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1">Percentage</p>
                <p className={`mt-1 font-mono text-2xl font-semibold ${tone.num}`}>{pct.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-200">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Correct</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700">
                  {correctCount}<span className="text-sm text-slate-500"> / {total}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-200">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1">Time taken</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-slate-900">
                  {formatTimeTaken(result.time_taken_seconds)}
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Overall score</span>
                <span className={tone.num}>{pct.toFixed(1)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tone.bar} relative overflow-hidden`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

            <div className={`mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${tone.pill}`}>
              {tone.icon}
              {pct >= 85 ? 'Excellent performance — keep the streak!' : pct >= 70 ? 'Solid attempt — review the ones you missed.' : 'Review the solutions below and try again.'}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span className="text-slate-700 font-medium">Correct:</span>
                <span className="font-mono font-bold text-emerald-700">{correctCount}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm">
                <XCircle className="h-4 w-4 text-rose-700" />
                <span className="text-slate-700 font-medium">Incorrect:</span>
                <span className="font-mono font-bold text-rose-700">{incorrectCount}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm">
                <Info className="h-4 w-4 text-amber-700" />
                <span className="text-slate-700 font-medium">Skipped:</span>
                <span className="font-mono font-bold text-amber-700">{skippedCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Detailed review</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-slate-900">Question-by-question breakdown</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
              {total} questions
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 overflow-hidden">
            {details.map((detail, idx) => {
              const isSubjective =
                detail.question_type === 'DESCRIPTIVE' ||
                detail.type === 'subjective' ||
                detail.user_descriptive_text !== undefined ||
                detail.descriptive_text !== undefined

              let status
              if (isSubjective) {
                if (detail.awarded_marks !== null && detail.awarded_marks !== undefined) {
                  status = {
                    label: `Graded · ${detail.awarded_marks}/${detail.marks || detail.max_score || 5}m`,
                    Icon: CheckCircle2,
                    bg: 'bg-emerald-50',
                    txt: 'text-emerald-700',
                    border: 'border-emerald-200',
                  }
                } else {
                  status = {
                    label: 'Pending Evaluation',
                    Icon: Clock,
                    bg: 'bg-amber-50',
                    txt: 'text-amber-700',
                    border: 'border-amber-200',
                  }
                }
              } else {
                status = detail.is_correct
                  ? { label: 'Correct', Icon: Check, bg: 'bg-emerald-50', txt: 'text-emerald-700', border: 'border-emerald-200' }
                  : detail.user_selected_option_id != null
                  ? { label: 'Incorrect', Icon: X, bg: 'bg-rose-50', txt: 'text-rose-700', border: 'border-rose-200' }
                  : { label: 'Skipped', Icon: Info, bg: 'bg-amber-50', txt: 'text-amber-700', border: 'border-amber-200' }
              }

              return (
                <div key={detail.question_id || idx} className="p-6 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border ${status.border} ${status.bg} font-mono font-bold text-sm ${status.txt}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-slate-900 leading-relaxed">
                            {detail.question_text}
                          </p>
                          <span className="inline-block mt-1 text-[11px] font-mono text-slate-500">
                            {isSubjective ? `[Subjective Question · ${detail.marks || detail.max_score || 5} Marks]` : `[MCQ · ${detail.marks || detail.max_score || 2} Marks]`}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold flex-shrink-0 ${status.bg} ${status.txt} border ${status.border}`}>
                          <status.Icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      {isSubjective ? (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                              Your Submitted Answer
                            </p>
                            <p className="text-sm font-normal text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {detail.user_descriptive_text || detail.descriptive_text || (
                                <span className="text-slate-400 italic">No answer submitted.</span>
                              )}
                            </p>
                          </div>

                          {(detail.model_answer || detail.modelAnswer) && (
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-700 mb-1.5">
                                Model Answer / Grading Rubric
                              </p>
                              <p className="text-sm font-normal text-blue-900 leading-relaxed">
                                {detail.model_answer || detail.modelAnswer}
                              </p>
                            </div>
                          )}

                          {detail.feedback && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1.5">
                                Evaluator Feedback
                              </p>
                              <p className="text-sm font-normal text-emerald-900 leading-relaxed">
                                {detail.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className={`rounded-2xl border p-3.5 ${status.border} ${status.bg}`}>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                              Your answer
                            </p>
                            <p className={`text-sm font-medium ${detail.user_selected_option_id != null ? (detail.is_correct ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-600'}`}>
                              {detail.selected_option_text || optionLabelFromId(detail.user_selected_option_id) || '— Not answered —'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                              Correct answer
                            </p>
                            <p className="text-sm font-medium text-blue-700">
                              {detail.correct_option_text || optionLabelFromId(detail.correct_option_id)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/student')}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-700"
          >
            Return to dashboard
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
          </button>
          <Link
            to="/student"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-blue-200 hover:text-blue-700"
          >
            <Award className="h-4 w-4" strokeWidth={1.75} />
            View all results
          </Link>
        </div>
      </div>
    </div>
  )
}
