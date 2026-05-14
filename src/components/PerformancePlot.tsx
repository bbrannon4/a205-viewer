import { useMemo, useState, useCallback } from 'react'
import Plot from 'react-plotly.js'
import type { RS0001, LoadedFile } from '../lib/types'
import {
  getGridKeys, getLookupKeys, sliceLookup,
  GRID_LABELS, LOOKUP_LABELS,
} from '../lib/rs0001'

interface Props {
  files: LoadedFile[]
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

function RS0001Plot({ files }: { files: LoadedFile[] }) {
  const firstRS = files[0].data as RS0001
  const gridKeys = getGridKeys(firstRS)
  const lookupKeys = getLookupKeys(firstRS)

  const [xKey, setXKey] = useState<string>(gridKeys[1] ?? gridKeys[0])
  const [yKey, setYKey] = useState<string>(lookupKeys[0])
  const gv = firstRS.performance.performance_map_cooling.grid_variables as unknown as Record<string, number[]>

  const [pinIndices, setPinIndices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const k of gridKeys) {
      const arr = gv[k]
      init[k] = Math.floor(arr.length / 2)
    }
    return init
  })
  const otherKeys = gridKeys.filter(k => k !== xKey)

  const handleXKeyChange = useCallback((k: string) => {
    setXKey(k)
    setPinIndices(prev => {
      const next = { ...prev }
      const arr = gv[k]
      next[k] = Math.floor(arr.length / 2)
      return next
    })
  }, [gv])

  const traces = useMemo(() => {
    return files.map((f, i) => {
      const rs = f.data as RS0001
      const { x, y } = sliceLookup(rs, xKey, yKey, pinIndices)
      return {
        x,
        y,
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: f.filename.replace(/\.a205\.(?:json|cbor)$|\.a205$/, ''),
        line: { color: COLORS[i % COLORS.length], width: 2 },
        marker: { size: 5 },
      }
    })
  }, [files, xKey, yKey, pinIndices])

  const xLabel = GRID_LABELS[xKey] ? `${GRID_LABELS[xKey].label} (${GRID_LABELS[xKey].unit})` : xKey
  const yLabel = LOOKUP_LABELS[yKey] ? `${LOOKUP_LABELS[yKey].label} (${LOOKUP_LABELS[yKey].unit})` : yKey

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="font-semibold text-gray-800">Performance Map</h2>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">X axis (grid variable)</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={xKey}
            onChange={e => handleXKeyChange(e.target.value)}
          >
            {gridKeys.map(k => (
              <option key={k} value={k}>
                {GRID_LABELS[k]?.label ?? k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Y axis (lookup variable)</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={yKey}
            onChange={e => setYKey(e.target.value)}
          >
            {lookupKeys.map(k => (
              <option key={k} value={k}>
                {LOOKUP_LABELS[k]?.label ?? k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {otherKeys.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Pin other axes:</p>
          <div className="flex flex-wrap gap-4">
            {otherKeys.map(k => {
              const arr = gv[k]
              const meta = GRID_LABELS[k]
              const displayFn = meta?.displayFn
              const idx = pinIndices[k] ?? Math.floor(arr.length / 2)
              const displayVal = displayFn ? displayFn(arr[idx]).toFixed(2) : arr[idx].toFixed(2)
              return (
                <div key={k} className="flex flex-col gap-1 min-w-40">
                  <label className="text-xs text-gray-600">
                    {meta?.label ?? k}: <span className="font-medium">{displayVal} {meta?.unit ?? ''}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={arr.length - 1}
                    value={idx}
                    onChange={e => setPinIndices(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 420,
          margin: { l: 60, r: 30, t: 30, b: 60 },
          xaxis: { title: { text: xLabel }, gridcolor: '#e5e7eb' },
          yaxis: { title: { text: yLabel }, gridcolor: '#e5e7eb' },
          legend: { orientation: 'h', y: -0.2 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: '#f9fafb',
        }}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          toImageButtonOptions: { format: 'png', filename: 'a205-plot', scale: 2 },
          responsive: true,
        }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  )
}

export function PerformancePlot({ files }: Props) {
  const rs0001Files = files.filter(f => f.rs_type === 'RS0001')
  if (rs0001Files.length === 0) return null
  return <RS0001Plot files={rs0001Files} />
}
