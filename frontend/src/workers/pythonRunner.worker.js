// Python runner worker (classic worker, uses importScripts).
// Pyodide is loaded LAZILY from jsdelivr at one exact pinned version, ONCE, and
// reused for every case. Student code runs only in this worker.
//
// Protocol:
//   { id, type: 'init' }                                  -> { id, type: 'loading' } ... { id, type: 'ready' | 'load_error' }
//   { id, type: 'run', sourceCode, case: { index, input } } -> { id, type: 'result', index, stdout, stderr, error }

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

let pyodidePromise = null
let pyodide = null

// Loads and initialises Pyodide exactly once for the lifetime of the worker.
async function ensurePyodide(id) {
  if (pyodide) return pyodide
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      self.postMessage({ id, type: 'loading', message: `Loading Python ${PYODIDE_VERSION}…` })
      importScripts(`${PYODIDE_BASE}pyodide.js`)
      return await self.loadPyodide({ indexURL: PYODIDE_BASE })
    })()
  }
  pyodide = await pyodidePromise
  return pyodide
}

// Runs `__student_code` with `__case_input` as stdin, capturing stdout/stderr.
// The "<exec>" harness frame is filtered out of the traceback so the student
// only sees frames from their own code. Returns a tuple (stdout, stderr, errored).
const HARNESS = `
import sys, io, traceback
_stdout, _stderr = sys.stdout, sys.stderr
_out, _err = io.StringIO(), io.StringIO()
sys.stdin = io.StringIO(__case_input)
sys.stdout, sys.stderr = _out, _err
_error = False
try:
    exec(compile(__student_code, "<solution>", "exec"), {"__name__": "__main__"})
except BaseException:
    _error = True
    _err.write("".join(l for l in traceback.format_exc().splitlines(True) if '"<exec>"' not in l and 'exec(compile(__student_code' not in l))
finally:
    sys.stdout, sys.stderr = _stdout, _stderr
(_out.getvalue(), _err.getvalue(), _error)
`

async function runCase(id, sourceCode, caseItem) {
  const py = await ensurePyodide(id)
  py.globals.set('__student_code', sourceCode == null ? '' : String(sourceCode))
  py.globals.set('__case_input', caseItem?.input == null ? '' : String(caseItem.input))
  const proxy = py.runPython(HARNESS)
  const [stdout, stderr, error] = proxy.toJs()
  proxy.destroy()
  return {
    stdout: stdout == null ? '' : String(stdout),
    stderr: stderr == null ? '' : String(stderr),
    error: Boolean(error),
  }
}

self.onmessage = async (event) => {
  const data = event.data || {}

  if (data.type === 'init') {
    try {
      await ensurePyodide(data.id)
      self.postMessage({ id: data.id, type: 'ready' })
    } catch (err) {
      self.postMessage({ id: data.id, type: 'load_error', error: String((err && err.message) || err) })
    }
    return
  }

  if (data.type !== 'run') return

  try {
    const result = await runCase(data.id, data.sourceCode, data.case)
    self.postMessage({ id: data.id, type: 'result', index: data.case?.index, ...result })
  } catch (err) {
    self.postMessage({
      id: data.id,
      type: 'result',
      index: data.case?.index,
      stdout: '',
      stderr: String((err && err.message) || err),
      error: true,
    })
  }
}
