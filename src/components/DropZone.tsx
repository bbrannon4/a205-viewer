import React, { useCallback, useState } from 'react'
import { parseFile } from '../lib/parse'
import type { LoadedFile } from '../lib/types'

interface Props {
  onLoad: (files: LoadedFile[]) => void
}

const EXAMPLES = [
  { label: 'RS0001 — Chiller (ASHRAE 90.1-2022 App J)', rs: 'RS0001', filename: 'ASHRAE90-1-2022-AppJ-Curve-Set-A.RS0001.a205.json' },
  { label: 'RS0002 — Unitary Constant Efficiency', rs: 'RS0002', filename: 'Unitary-Constant-Efficiency.RS0002.a205.json' },
  { label: 'RS0003 — Fan Continuous', rs: 'RS0003', filename: 'Fan-Continuous.RS0003.a205.json' },
  { label: 'RS0004 — DX Constant Efficiency', rs: 'RS0004', filename: 'DX-Constant-Efficiency.RS0004.a205.json' },
  { label: 'RS0005 — Motor Constant Efficiency', rs: 'RS0005', filename: 'Motor-Constant-Efficiency.RS0005.a205.json' },
  { label: 'RS0006 — Drive Constant Efficiency', rs: 'RS0006', filename: 'Drive-Constant-Efficiency.RS0006.a205.json' },
  { label: 'RS0007 — Belt Drive Constant Efficiency', rs: 'RS0007', filename: 'Belt-Drive-Constant-Efficiency.RS0007.a205.json' },
]

export function DropZone({ onLoad }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setLoading(true)
    setError(null)
    try {
      const files = Array.from(fileList)
      const parsed = await Promise.all(files.map(parseFile))
      onLoad(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [onLoad])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      void processFiles(e.target.files)
    }
  }, [processFiles])

  const loadExample = useCallback(async (ex: typeof EXAMPLES[0]) => {
    setLoading(true)
    setError(null)
    try {
      // Examples are bundled in public/examples/
      const url = `${import.meta.env.BASE_URL}examples/${ex.rs}/${ex.filename}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to load example: ${res.status} ${res.statusText}`)
      const blob = await res.blob()
      const file = new File([blob], ex.filename, { type: 'application/json' })
      const parsed = await parseFile(file)
      onLoad([parsed])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [onLoad])

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4">
      <div
        className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="*"
          className="hidden"
          onChange={onInputChange}
        />
        <div className="text-4xl mb-3">📂</div>
        <p className="text-lg font-medium text-gray-700">Drop .a205 files here</p>
        <p className="text-sm text-gray-500 mt-1">or click to browse — accepts CBOR binary (.a205) or JSON (.a205.json)</p>
        {loading && <p className="text-blue-600 mt-3 text-sm">Parsing…</p>}
      </div>

      {error && (
        <div className="w-full max-w-2xl bg-red-50 border border-red-300 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Load example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex.filename}
              onClick={() => void loadExample(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
