import type { AnyRS, A205Metadata } from '../lib/types'

interface Props {
  files: Array<{ filename: string; data: AnyRS; warnings: string[] }>
}

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 min-w-32 shrink-0">{label}</span>
      <span className="font-medium text-gray-900">{String(value)}</span>
    </div>
  )
}

function FileCard({ filename, data, warnings }: { filename: string; data: AnyRS; warnings: string[] }) {
  const meta = data.metadata as A205Metadata
  const desc = (data as { description?: { product_information?: Record<string, unknown> } }).description
  const pi = desc?.product_information

  return (
    <div className="border rounded-lg p-4 flex-1 min-w-64">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 mb-1">
            {meta.schema} v{meta.schema_version}
          </span>
          <p className="text-sm text-gray-500 font-mono truncate max-w-64">{filename}</p>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <InfoRow label="Manufacturer" value={pi?.manufacturer as string} />
        <InfoRow label="Model" value={pi?.['model_number'] as string} />
        <InfoRow label="Description" value={meta.description} />
        <InfoRow label="ID" value={meta.id} />
        <InfoRow label="Source" value={meta.source} />
        <InfoRow label="Timestamp" value={meta.timestamp} />
        <InfoRow label="Final" value={meta.is_final != null ? String(meta.is_final) : undefined} />
      </div>
      {warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800">
              ⚠ {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MetadataCard({ files }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {files.map(f => (
        <FileCard key={f.filename} {...f} />
      ))}
    </div>
  )
}
