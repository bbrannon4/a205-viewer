import { useState, useCallback } from 'react'
import type { LoadedFile } from './lib/types'
import { validateSameRS } from './lib/parse'
import { DropZone } from './components/DropZone'
import { Rs0001View } from './views/Rs0001View'

function RSView({ files }: { files: LoadedFile[] }) {
  const rs = files[0]?.rs_type
  switch (rs) {
    case 'RS0001': return <Rs0001View files={files} />
    default:
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{rs} viewer coming soon</p>
          <p className="text-sm mt-1">Metadata loaded for {files.length} file(s). Full visualization support for RS0001 only right now.</p>
          <div className="mt-4 text-left max-w-2xl mx-auto">
            <pre className="bg-gray-100 rounded p-4 text-xs overflow-auto max-h-64">
              {JSON.stringify(files[0]?.data?.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )
  }
}

export default function App() {
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleLoad = useCallback((newFiles: LoadedFile[]) => {
    setError(null)
    // Allow accumulating files if same RS type, or replace if different
    const allFiles = files.length > 0 && files[0].rs_type === newFiles[0]?.rs_type
      ? [...files, ...newFiles]
      : newFiles
    const mixErr = validateSameRS(allFiles)
    if (mixErr) {
      setError(mixErr)
      return
    }
    setFiles(allFiles)
  }, [files])

  const reset = () => { setFiles([]); setError(null) }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ASHRAE 205 Viewer</h1>
          <p className="text-sm text-gray-500">Equipment performance data visualization</p>
        </div>
        {files.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{files.length} file(s) — {files[0].rs_type}</span>
            <button
              onClick={reset}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:border-gray-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <DropZone onLoad={handleLoad} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={reset}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Load different files
              </button>
            </div>
            <RSView files={files} />
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-400 text-center">Add more files of the same RS type:</p>
              <DropZone onLoad={handleLoad} />
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        ASHRAE 205 Viewer — pure static site, no data leaves your browser
      </footer>
    </div>
  )
}
