import Editor from '@monaco-editor/react'

const MONACO_LANGUAGE = {
  python: 'python',
  javascript: 'javascript',
}

export default function CodeEditor({ language, value, onChange, height = '100%' }) {
  return (
    <div className="h-[45vh] min-h-[260px] max-h-[420px] lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1">
      <Editor
        height={height}
        language={MONACO_LANGUAGE[language] || 'plaintext'}
        value={value}
        onChange={(next) => onChange?.(next ?? '')}
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
        }}
      />
    </div>
  )
}
