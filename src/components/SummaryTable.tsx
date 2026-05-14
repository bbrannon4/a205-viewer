import type { LoadedFile } from '../lib/types'
import type { RS0001 } from '../lib/types'
import { summarize } from '../lib/rs0001'

interface Props {
  files: LoadedFile[]
}

function fmt(v: number | undefined, decimals = 1): string {
  return v != null ? v.toFixed(decimals) : '—'
}

export function SummaryTable({ files }: Props) {
  const rs0001Files = files.filter(f => f.rs_type === 'RS0001')
  if (rs0001Files.length === 0) return null

  const summaries = rs0001Files.map(f => summarize(f.filename, f.data as RS0001))

  return (
    <div className="border rounded-lg p-4 overflow-x-auto">
      <h2 className="font-semibold text-gray-800 mb-3">Performance Summary</h2>
      <p className="text-xs text-gray-500 mb-3">Approximate AHRI 551/591 rating point (evap LWT ≈ 6.7°C, cond EWT ≈ 29.4°C, max compressor sequence)</p>
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-4 text-gray-500 font-medium">Metric</th>
            {summaries.map(s => (
              <th key={s.filename} className="text-right py-1 px-4 text-gray-700 font-medium max-w-40">
                <div className="truncate" title={s.filename}>{s.model ?? s.filename}</div>
                {s.manufacturer && <div className="text-xs font-normal text-gray-500">{s.manufacturer}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr>
            <td className="py-1.5 pr-4 text-gray-500">Rated Capacity</td>
            {summaries.map(s => <td key={s.filename} className="text-right px-4">{fmt(s.ratedCapacity_kW)} kW</td>)}
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-gray-500">Rated Power</td>
            {summaries.map(s => <td key={s.filename} className="text-right px-4">{fmt(s.ratedPower_kW)} kW</td>)}
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-gray-500">COP</td>
            {summaries.map(s => <td key={s.filename} className="text-right px-4">{fmt(s.cop, 2)}</td>)}
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-gray-500">Compressor Stages</td>
            {summaries.map(s => <td key={s.filename} className="text-right px-4">{s.numCompressors}</td>)}
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-gray-500">Evap Temp Range</td>
            {summaries.map(s => (
              <td key={s.filename} className="text-right px-4">
                {s.evapTempRange_C[0].toFixed(1)}–{s.evapTempRange_C[1].toFixed(1)} °C
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
