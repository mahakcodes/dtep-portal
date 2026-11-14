// JavaScript runner worker (classic worker).
// The student's solution is executed with two in-scope bindings:
//   input() - returns the next line of stdin, or null when exhausted
//   print() - appends a line to stdout
// console.log is captured as stdout as well.
//
// Protocol:
//   { id, type: 'init' }                                    -> { id, type: 'ready' }
//   { id, type: 'run', sourceCode, case: { index, input } } -> { id, type: 'result', index, stdout, stderr, error }

const format = (value) => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const makeInput = (stdin) => {
  const lines = String(stdin ?? '').split('\n')
  let cursor = 0
  return () => {
    if (cursor >= lines.length) return null
    const line = lines[cursor]
    cursor += 1
    return line.replace(/\r$/, '')
  }
}

self.onmessage = (event) => {
  const data = event.data || {}

  if (data.type === 'init') {
    self.postMessage({ id: data.id, type: 'ready' })
    return
  }

  if (data.type !== 'run') return

  const caseItem = data.case
  let stdout = ''
  let stderr = ''
  let error = false

  const writeLine = (...args) => {
    stdout += args.map(format).join(' ') + '\n'
  }

  const originalLog = console.log
  console.log = (...args) => writeLine(...args)

  try {
    // eslint-disable-next-line no-new-func
    const run = new Function('input', 'print', data.sourceCode == null ? '' : String(data.sourceCode))
    run(makeInput(caseItem?.input), writeLine)
  } catch (err) {
    error = true
    stderr = String((err && err.stack) || err)
  } finally {
    console.log = originalLog
  }

  self.postMessage({
    id: data.id,
    type: 'result',
    index: caseItem?.index,
    stdout,
    stderr,
    error,
  })
}
