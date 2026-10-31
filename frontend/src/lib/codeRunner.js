// Orchestrates the Web Workers that execute student code in the browser and
// turns raw per-case output into the browser-reported case results the backend
// expects (see API_CONTRACT.md, "Submit code and browser-reported case results").
//
// Both Run and Submit use this module. Nothing here talks to the network.
//
// Two phases:
// 1. Runtime load (ensureRuntime): generous timeout (default 30s). A failure or
//    timeout here throws an Error with `.status === 'load_error'` and is NEVER
//    reported as a case timeout. Per language the runtime is loaded once and reused.
// 2. Per-case execution: the per-case timeout starts only AFTER the runtime is ready.

import { normalizeOutput, sha256Hex } from './normalizeOutput.js'

const DEFAULT_TIMEOUT_MS = 5000
const DEFAULT_LOAD_TIMEOUT_MS = 30000

// One worker per language, created lazily and kept between cases so Pyodide is
// only loaded once. A hung worker is terminated on an execution timeout.
const workers = new Map()
// language -> Promise resolved once the runtime (e.g. Pyodide) is ready.
const readyPromises = new Map()

function createWorker(language) {
  if (language === 'python') {
    // Classic worker (no { type: 'module' }) so importScripts works.
    return new Worker(new URL('../workers/pythonRunner.worker.js', import.meta.url))
  }
  if (language === 'javascript') {
    return new Worker(new URL('../workers/jsRunner.worker.js', import.meta.url))
  }
  throw new Error(`Unsupported language: ${language}`)
}

function getWorker(language) {
  if (!workers.has(language)) workers.set(language, createWorker(language))
  return workers.get(language)
}

function disposeWorker(language) {
  const worker = workers.get(language)
  if (worker) {
    worker.terminate()
    workers.delete(language)
  }
  // The next call must re-load the runtime before running a case.
  readyPromises.delete(language)
}

// Terminate every cached worker. Call when leaving the test.
export function disposeRunners() {
  for (const language of Array.from(workers.keys())) disposeWorker(language)
  readyPromises.clear()
}

let messageSeq = 0

function loadError(language, detail) {
  const err = new Error(detail || `Failed to load the ${language} runtime.`)
  err.status = 'load_error'
  return err
}

// Phase 1: make sure the runtime is ready. Cached per language.
function ensureRuntime(language, { loadTimeoutMs, onStatus } = {}) {
  const existing = readyPromises.get(language)
  if (existing) return existing

  const promise = new Promise((resolve, reject) => {
    let worker
    try {
      worker = getWorker(language)
    } catch (err) {
      reject(loadError(language, String(err?.message || err)))
      return
    }

    const id = `init-${++messageSeq}`
    let settled = false

    const cleanup = () => {
      clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onWorkerError)
    }
    const succeed = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }
    const fail = (detail) => {
      if (settled) return
      settled = true
      cleanup()
      disposeWorker(language)
      reject(loadError(language, detail))
    }

    const timer = setTimeout(
      () => fail(`Timed out after ${loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT_MS} ms while loading the ${language} runtime.`),
      loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT_MS
    )

    const onMessage = (event) => {
      const data = event.data || {}
      if (data.id !== id) return
      if (data.type === 'loading') {
        onStatus?.({ phase: 'loading', message: data.message })
        return
      }
      if (data.type === 'ready') succeed()
      else if (data.type === 'load_error') fail(data.error)
    }
    const onWorkerError = (event) => fail(event?.message || `The ${language} worker failed to start.`)

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onWorkerError)
    worker.postMessage({ id, type: 'init' })
  })

  const guarded = promise.catch((err) => {
    // Do not cache a failure, so the next attempt can retry the load.
    readyPromises.delete(language)
    throw err
  })
  readyPromises.set(language, guarded)
  return guarded
}

// Phase 2: run one case. The timeout applies only to this execution.
function runSingleCase(language, sourceCode, caseItem, timeoutMs) {
  return new Promise((resolve) => {
    let worker
    try {
      worker = getWorker(language)
    } catch (err) {
      resolve({ timedOut: false, error: true, stdout: '', stderr: String(err?.message || err) })
      return
    }

    const id = `run-${++messageSeq}`
    let settled = false

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
      resolve(result)
    }

    const timer = setTimeout(() => {
      // A hung worker cannot be interrupted; drop it. The next case re-loads
      // the runtime through ensureRuntime (outside the case timeout).
      worker.removeEventListener('message', onMessage)
      disposeWorker(language)
      settled = true
      resolve({ timedOut: true, error: false, stdout: '', stderr: '' })
    }, timeoutMs)

    const onMessage = (event) => {
      const data = event.data || {}
      if (data.id !== id || data.type !== 'result') return
      finish({
        timedOut: false,
        error: Boolean(data.error),
        stdout: String(data.stdout ?? ''),
        stderr: String(data.stderr ?? ''),
      })
    }

    worker.addEventListener('message', onMessage)
    worker.postMessage({ id, type: 'run', sourceCode, case: { index: caseItem.index, input: caseItem.input } })
  })
}

async function classifyCase(caseDef, raw) {
  if (raw.timedOut) {
    return { case_id: caseDef.id, passed: false, status: 'timeout', stdout: '', stderr: '' }
  }
  if (raw.error || raw.stderr.trim() !== '') {
    return { case_id: caseDef.id, passed: false, status: 'runtime_error', stdout: raw.stdout, stderr: raw.stderr }
  }

  const normalized = normalizeOutput(raw.stdout)
  let passed
  if (caseDef.expected_hash) {
    passed = (await sha256Hex(normalized)) === String(caseDef.expected_hash).toLowerCase()
  } else if (caseDef.expected_output !== undefined && caseDef.expected_output !== null) {
    passed = normalized === normalizeOutput(caseDef.expected_output)
  } else {
    passed = false
  }

  return { case_id: caseDef.id, passed, status: passed ? 'ok' : 'wrong', stdout: raw.stdout, stderr: '' }
}

// cases: [{ id, input, expected_output? (visible), expected_hash? (hidden) }]
// Returns: [{ case_id, passed, status, stdout, stderr }]
// status is one of ok | wrong | runtime_error | timeout.
// Throws an Error with `.status === 'load_error'` if the runtime fails to load.
export async function runCodingQuestion({
  language,
  sourceCode,
  cases,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  loadTimeoutMs = DEFAULT_LOAD_TIMEOUT_MS,
  onStatus,
} = {}) {
  if (!Array.isArray(cases)) throw new Error('cases must be an array')

  // Phase 1 (separate load phase with its own generous timeout).
  await ensureRuntime(language, { loadTimeoutMs, onStatus })

  const results = []
  for (let index = 0; index < cases.length; index++) {
    // Re-ensure in case a previous case timed out and its worker was terminated.
    await ensureRuntime(language, { loadTimeoutMs, onStatus })
    onStatus?.({ phase: 'case', index, total: cases.length })
    const raw = await runSingleCase(
      language,
      sourceCode,
      { index, input: cases[index].input ?? '' },
      timeoutMs
    )
    results.push(await classifyCase(cases[index], raw))
  }
  onStatus?.({ phase: 'done', total: cases.length })
  return results
}

// Strips the extra detail, keeping exactly the fields the API accepts.
export function toCaseResultsPayload(results) {
  return results.map((r) => ({ case_id: r.case_id, passed: r.passed, status: r.status }))
}
