import Editor from '@monaco-editor/react'
import { useRef } from 'react'

const MONACO_LANGUAGE = {
  python: 'python',
  javascript: 'javascript',
}

export default function CodeEditor({
  language,
  value,
  onChange,
  height = '100%',
  antiCheatActive = false,
  onRestrictedAction,
}) {
  const internalClipboard = useRef({ editor: null, text: '' })

  const handleMount = (editor) => {
    editor.updateOptions({ contextmenu: !antiCheatActive })
    editor.onKeyDown((event) => {
      if (!antiCheatActive) return
      const browserEvent = event.browserEvent
      const key = String(browserEvent?.key || '').toLowerCase()
      const modified = browserEvent?.ctrlKey || browserEvent?.metaKey
      const action = modified && ['c', 'x', 'v'].includes(key)
        ? ({ c: 'copy', x: 'cut', v: 'paste' })[key]
        : (browserEvent?.shiftKey && key === 'insert' ? 'paste' : null)
      if (!action) return

      event.preventDefault()
      event.stopPropagation()
      browserEvent?.preventDefault?.()
      browserEvent?.stopPropagation?.()
      onRestrictedAction?.(action)

      if (action === 'copy' || action === 'cut') {
        const selection = editor.getSelection()
        const model = editor.getModel()
        if (!selection || !model || selection.isEmpty()) return
        internalClipboard.current = { editor, text: model.getValueInRange(selection) }
        if (action === 'cut') editor.executeEdits('anti-cheat-cut', [{ range: selection, text: '' }])
        return
      }

      const { editor: sourceEditor, text } = internalClipboard.current
      if (sourceEditor !== editor || !text) return
      const selection = editor.getSelection()
      if (selection) editor.executeEdits('anti-cheat-paste', [{ range: selection, text, forceMoveMarkers: true }])
    })
  }

  return (
    <Editor
      height={height}
      language={MONACO_LANGUAGE[language] || 'plaintext'}
      value={value}
      onChange={(next) => onChange?.(next ?? '')}
      onMount={handleMount}
      theme="vs"
      loading={
        <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
          Loading editor…
        </div>
      }
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        renderWhitespace: 'selection',
        fixedOverflowWidgets: true,
        scrollbar: { alwaysConsumeMouseWheel: false },
        contextmenu: !antiCheatActive,
      }}
    />
  )
}
