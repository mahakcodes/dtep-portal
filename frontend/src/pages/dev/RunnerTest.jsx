// DEV-ONLY manual verification page for the browser code runner.
// Route: /dev/runner — registered in App.jsx only when import.meta.env.DEV.
// Not included in production builds. No role guard.

import { useState } from 'react'
import { runCodingQuestion } from '../../lib/codeRunner.js'
import { normalizeOutput, sha256Hex } from '../../lib/normalizeOutput.js'

const sumCases = async () => [
  { id: 1, input: '2 3', expected_output: '5' },
  { id: 2, input: '8 9', expected_hash: await sha256Hex(normalizeOutput('17')) },
]

const PY = {
  sum: "a, b = map(int, input().split())\nprint(a + b)",
  trailing: "a, b = map(int, input().split())\nprint(a + b, end=' ')",
  tab: "a, b = map(int, input().split())\nprint('\\t' + str(a + b))",
  wrong: "a, b = map(int, input().split())\nprint(0)",
  infinite: "while True:\n    pass",
  syntax: "def broken(:\n    pass",
  runtime: "print(1 / 0)",
}

const JS = {
  correct: "const [a, b] = input().split(' ').map(Number)\nconsole.log(a + b)",
  infinite: "while (true) {}",
  syntax: "const = 1",
  runtime: "throw new Error('boom')",
}

const TESTS = [
  { id: 'py-correct', label: 'Python · correct output (2 ints → sum)', language: 'python', source: PY.sum, buildCases: sumCases },
  { id: 'py-wrong', label: 'Python · wrong output', language: 'python', source: PY.wrong, buildCases: sumCases },
  { id: 'py-infinite', label: 'Python · infinite loop (timeout)', language: 'python', source: PY.infinite, buildCases: sumCases, timeoutMs: 2000 },
  { id: 'py-syntax', label: 'Python · syntax error', language: 'python', source: PY.syntax, buildCases: sumCases },
  { id: 'py-runtime', label: 'Python · runtime error (1/0)', language: 'python', source: PY.runtime, buildCases: sumCases },
  { id: 'py-trailing', label: "Python · trailing space output (end=' ')", language: 'python', source: PY.trailing, buildCases: sumCases },
  { id: 'py-tab', label: "Python · tab output (print('\\t'+sum); expected '5' → must FAIL)", language: 'python', source: PY.tab, buildCases: sumCases },
  { id: 'js-correct', label: 'JavaScript · correct output (input() + console.log)', language: 'javascript', source: JS.correct, buildCases: sumCases },
  { id: 'js-infinite', label: 'JavaScript · infinite loop (timeout)', language: 'javascript', source: JS.infinite, buildCases: sumCases, timeoutMs: 2000 },
  { id: 'js-syntax', label: 'JavaScript · syntax error', language: 'javascript', source: JS.syntax, buildCases: sumCases },
  { id: 'js-runtime', label: 'JavaScript · runtime error', language: 'javascript', source: JS.runtime, buildCases: sumCases },
]

const STATUS_TONE = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  wrong: 'bg-amber-50 text-amber-700 border-amber-200',
  runtime_error: 'bg-rose-50 text-rose-700 border-rose-200',
  timeout: 'bg-slate-100 text-slate-700 border-slate-300',
  load_error: 'bg-purple-50 text-purple-700 border-purple-300',
}

export default function RunnerTest() {
  const [results, setResults] = useState({})
  const [runningId, setRunningId] = useState(null)
  const [pythonStatus, setPythonStatus] = useState(null)

  const runTest = async (test) => {
    setRunningId(test.id)
    setResults((prev) => ({ ...prev, [test.id]: { phase: 'running', cases: null, error: null } }))

    let cases
    try {
      cases = await test.buildCases()
    } catch (err) {
      setResults((prev) => ({ ...prev, [test.id]: { phase: 'error', cases: null, error: `buildCases: ${err?.message || err}` } }))
      setRunningId(null)
      return
    }

    const marks = []
    const onStatus = (s) => {
      if (s.phase === 'loading') setPythonStatus(s.message)
      else if (s.phase === 'ready') setPythonStatus('Python runtime ready')
      else if (s.phase === 'case') marks[s.index] = performance.now()
      else if (s.phase === 'done') marks[s.total] = performance.now()
    }

    try {
      const caseResults = await runCodingQuestion({
        language: test.language,
        sourceCode: test.source,
        cases,
        timeoutMs: test.timeoutMs || 5000,
        onStatus,
      })
      const totalMs = marks.length ? marks[marks.length - 1] - marks[0] : null
      setResults((prev) => ({ ...prev, [test.id]: { phase: 'done', cases: caseResults, marks, totalMs, error: null } }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [test.id]: { phase: 'error', cases: null, error: String(err?.message || err), errorStatus: err?.status || null },
      }))
    } finally {
      setRunningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-mono text-2xl font-bold">/dev/runner — browser code-runner check</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dev-only. Runs each case through <code>src/lib/codeRunner.js</code> in a Web Worker. Visible cases compare
          with <code>expected_output</code>; hidden cases compare with <code>expected_hash</code>. Python loads once in
          a separate load phase (30 s load timeout, Pyodide v0.26.4) before any per-case timeout starts.
        </p>

        <div className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-sm">
          Python runtime:{' '}
          {pythonStatus ? (
            <span className={pythonStatus === 'Python runtime ready' ? 'text-emerald-700' : 'text-blue-700'}>
              {pythonStatus}
              {pythonStatus !== 'Python runtime ready' && <span className="ml-2 animate-pulse">…</span>}
            </span>
          ) : (
            <span className="text-slate-500">not started (click a Python test to load Pyodide)</span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {TESTS.map((test) => {
            const state = results[test.id]
            return (
              <div key={test.id} className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">{test.label}</p>
                    <pre className="mt-1.5 max-w-full overflow-x-auto rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-700">{test.source}</pre>
                  </div>
                  <button
                    onClick={() => runTest(test)}
                    disabled={runningId !== null}
                    className="flex-shrink-0 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {runningId === test.id ? 'Running…' : 'Run'}
                  </button>
                </div>

                {state && (
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    {state.phase === 'running' && <p className="text-blue-700">Running…{test.language === 'python' && pythonStatus && pythonStatus !== 'Python runtime ready' ? ` (${pythonStatus})` : ''}</p>}
                    {state.error && (
                      <p className="text-rose-700">
                        {state.errorStatus && (
                          <span className={`mr-2 rounded-full border px-2 py-0.5 font-semibold ${STATUS_TONE[state.errorStatus] || ''}`}>
                            {state.errorStatus}
                          </span>
                        )}
                        Error: {state.error}
                      </p>
                    )}
                    {state.totalMs != null && <p className="text-slate-500">total elapsed: {Math.round(state.totalMs)} ms</p>}

                    {state.cases?.map((c, i) => {
                      const perCase = state.marks && state.marks[i + 1] != null && state.marks[i] != null ? Math.round(state.marks[i + 1] - state.marks[i]) : null
                      return (
                        <div key={c.case_id ?? i} className="rounded border border-slate-200 p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">case #{i} (id {c.case_id})</span>
                            <span className={`rounded-full border px-2 py-0.5 font-semibold ${STATUS_TONE[c.status] || STATUS_TONE.timeout}`}>{c.status}</span>
                            <span className={c.passed ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>{c.passed ? 'PASS' : 'FAIL'}</span>
                            {perCase != null && <span className="ml-auto text-slate-500">{perCase} ms</span>}
                          </div>
                          <p className="mt-2 text-slate-500">stdout:</p>
                          <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-slate-800">{JSON.stringify(c.stdout ?? '')}</pre>
                          {c.stderr ? (
                            <>
                              <p className="mt-2 text-slate-500">stderr:</p>
                              <pre className="overflow-x-auto rounded bg-rose-50 p-2 text-rose-800">{c.stderr}</pre>
                            </>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
