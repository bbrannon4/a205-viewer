import type { RS0001, RS0001GridVariables, RS0001LookupVariables } from './types'
import { kelvinToCelsius, wToKw } from './units'

export type RS0001GridKey = keyof RS0001GridVariables
export type RS0001LookupKey = keyof RS0001LookupVariables

/** Human-readable labels + unit strings for each variable */
export const GRID_LABELS: Record<string, { label: string; unit: string; displayFn?: (v: number) => number }> = {
  evaporator_liquid_volumetric_flow_rate: { label: 'Evap Flow', unit: 'm³/s' },
  evaporator_liquid_leaving_temperature:  { label: 'Evap LWT', unit: '°C', displayFn: kelvinToCelsius },
  condenser_liquid_volumetric_flow_rate:        { label: 'Cond Flow', unit: 'm³/s' },
  condenser_liquid_entering_temperature:        { label: 'Cond EWT', unit: '°C', displayFn: kelvinToCelsius },
  condenser_air_entering_drybulb_temperature:  { label: 'Cond Air DB', unit: '°C', displayFn: kelvinToCelsius },
  condenser_air_entering_relative_humidity:    { label: 'Cond Air RH', unit: '' },
  ambient_pressure:                             { label: 'Ambient Pressure', unit: 'Pa' },
  compressor_sequence_number:              { label: 'Compressor Seq', unit: '' },
}

export const LOOKUP_LABELS: Record<string, { label: string; unit: string; displayFn?: (v: number) => number }> = {
  input_power:               { label: 'Input Power', unit: 'kW', displayFn: wToKw },
  net_evaporator_capacity:   { label: 'Net Evap Capacity', unit: 'kW', displayFn: wToKw },
  net_condenser_capacity:    { label: 'Net Cond Capacity', unit: 'kW', displayFn: wToKw },
  condenser_air_volumetric_flow_rate: { label: 'Cond Air Flow', unit: 'm³/s' },
  oil_cooler_heat:           { label: 'Oil Cooler Heat', unit: 'kW', displayFn: wToKw },
  auxiliary_heat:            { label: 'Auxiliary Heat', unit: 'kW', displayFn: wToKw },
}

/** Extract all unique grid variable names present in a file */
export function getGridKeys(rs: RS0001): string[] {
  return Object.keys(rs.performance.performance_map_cooling.grid_variables)
}

export function getLookupKeys(rs: RS0001): string[] {
  return Object.keys(rs.performance.performance_map_cooling.lookup_variables).filter(
    k => k !== 'operation_state'
  )
}

/**
 * Slice the flat lookup array to get values where all pinned axes match.
 * The ASHRAE 205 grid is stored in row-major order with the last axis varying fastest.
 */
export function sliceLookup(
  rs: RS0001,
  xKey: string,
  yKey: string,
  pins: Record<string, number>,  // axis_key → pinned value (actual value from grid)
): { x: number[]; y: number[] } {
  const gv = rs.performance.performance_map_cooling.grid_variables
  const lv = rs.performance.performance_map_cooling.lookup_variables

  const gridKeys = Object.keys(gv) as (keyof RS0001GridVariables)[]
  const gridArrays = gridKeys.map(k => gv[k] as number[])
  const dims = gridArrays.map(a => a.length)
  const totalSize = dims.reduce((a, b) => a * b, 1)

  const xArr = gv[xKey as keyof RS0001GridVariables] as number[]
  const yArrRaw = lv[yKey as keyof RS0001LookupVariables] as number[]

  const yMeta = LOOKUP_LABELS[yKey]
  const xMeta = GRID_LABELS[xKey]

  const xOut: number[] = []
  const yOut: number[] = []

  for (let flatIdx = 0; flatIdx < totalSize; flatIdx++) {
    // Decompose flat index → per-axis indices
    let remainder = flatIdx
    const axisIndices: number[] = new Array(dims.length)
    for (let d = dims.length - 1; d >= 0; d--) {
      axisIndices[d] = remainder % dims[d]
      remainder = Math.floor(remainder / dims[d])
    }

    // Check all pins match
    let pinMatch = true
    for (let d = 0; d < gridKeys.length; d++) {
      const key = gridKeys[d]
      if (key === xKey) continue
      const pinnedVal = pins[key]
      if (pinnedVal !== undefined && gridArrays[d][axisIndices[d]] !== pinnedVal) {
        pinMatch = false
        break
      }
    }
    if (!pinMatch) continue

    const rawX = xArr[axisIndices[gridKeys.indexOf(xKey as keyof RS0001GridVariables)]]
    const rawY = yArrRaw[flatIdx]
    const x = xMeta?.displayFn ? xMeta.displayFn(rawX) : rawX
    const y = yMeta?.displayFn ? yMeta.displayFn(rawY) : rawY
    xOut.push(x)
    yOut.push(y)
  }

  // Sort by x for clean lines
  const pairs = xOut.map((x, i) => [x, yOut[i]] as [number, number])
  pairs.sort((a, b) => a[0] - b[0])
  return { x: pairs.map(p => p[0]), y: pairs.map(p => p[1]) }
}

/** Compute a quick summary for a single RS0001 file at "near-AHRI" conditions.
 *  AHRI 551/591: evap LWT ≈ 6.67°C (279.82 K), cond EWT ≈ 29.44°C (302.59 K). */
export interface RS0001Summary {
  filename: string
  manufacturer?: string
  model?: string
  ratedCapacity_kW?: number
  ratedPower_kW?: number
  cop?: number
  numCompressors: number
  evapTempRange_C: [number, number]
}

export function summarize(filename: string, rs: RS0001): RS0001Summary {
  const gv = rs.performance.performance_map_cooling.grid_variables
  const lv = rs.performance.performance_map_cooling.lookup_variables
  const desc = rs.description.product_information

  const evapTemps = (gv.evaporator_liquid_leaving_temperature as number[])
  const evapTempRange_C: [number, number] = [
    kelvinToCelsius(Math.min(...evapTemps)),
    kelvinToCelsius(Math.max(...evapTemps)),
  ]

  const numCompressors = Math.max(...(gv.compressor_sequence_number as number[] ?? [1]))

  // Try to find row closest to AHRI conditions: evap LWT ≈ 279.82 K, compressor seq = max
  const target_evap = 279.82
  const target_cond = 302.59
  const condKey = gv.condenser_liquid_entering_temperature
    ? 'condenser_liquid_entering_temperature'
    : 'condenser_air_entering_drybulb_temperature'

  const gridKeys = Object.keys(gv) as (keyof RS0001GridVariables)[]
  const gridArrays = gridKeys.map(k => gv[k] as number[])
  const dims = gridArrays.map(a => a.length)
  const totalSize = dims.reduce((a, b) => a * b, 1)

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < totalSize; i++) {
    let remainder = i
    const axisIndices: number[] = new Array(dims.length)
    for (let d = dims.length - 1; d >= 0; d--) {
      axisIndices[d] = remainder % dims[d]
      remainder = Math.floor(remainder / dims[d])
    }
    const evapIdx = gridKeys.indexOf('evaporator_liquid_leaving_temperature')
    const condIdx = gridKeys.indexOf(condKey as keyof RS0001GridVariables)
    const seqIdx = gridKeys.indexOf('compressor_sequence_number')
    const evapVal = evapIdx >= 0 ? gridArrays[evapIdx][axisIndices[evapIdx]] : 0
    const condVal = condIdx >= 0 ? gridArrays[condIdx][axisIndices[condIdx]] : 0
    const seqVal = seqIdx >= 0 ? gridArrays[seqIdx][axisIndices[seqIdx]] : 1
    const dist = Math.abs(evapVal - target_evap) + Math.abs(condVal - target_cond) - seqVal * 0.01
    if (dist < bestDist) { bestDist = dist; bestIdx = i }
  }

  const cap = (lv.net_evaporator_capacity as number[])[bestIdx]
  const pow = (lv.input_power as number[])[bestIdx]

  return {
    filename,
    manufacturer: desc?.manufacturer,
    model: desc?.model_number,
    ratedCapacity_kW: cap ? wToKw(cap) : undefined,
    ratedPower_kW: pow ? wToKw(pow) : undefined,
    cop: (cap && pow && pow > 0) ? cap / pow : undefined,
    numCompressors,
    evapTempRange_C,
  }
}
