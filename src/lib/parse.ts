import type { AnyRS, LoadedFile } from './types'
import { isSuspiciousPressure } from './units'

/** Detect CBOR by magic: CBOR arrays start with 0x80-0x97 or 0x98-0x9b for short arrays.
 *  ASHRAE 205 CBOR files are CBOR maps (0xa0-0xb7 or 0xbf for indefinite). */
function isCBOR(bytes: Uint8Array): boolean {
  if (bytes.length < 1) return false
  const first = bytes[0]
  // CBOR major type 5 (map): 0xa0..0xbf
  // CBOR major type 4 (array): 0x80..0x9f
  // Just check it's not a printable ASCII '{' (0x7b) or '[' (0x5b)
  return first !== 0x7b && first !== 0x5b && first !== 0x20 && first !== 0x0d && first !== 0x0a
}

function collectWarnings(rs_type: string, data: AnyRS): string[] {
  const warnings: string[] = []
  if (rs_type === 'RS0001') {
    const rs = data as import('./types').RS0001
    const ap = rs.performance.performance_map_cooling.grid_variables.ambient_pressure
    if (isSuspiciousPressure(ap)) {
      warnings.push('ambient_pressure values look like kPa (expected Pa ≈ 101325). File may have a unit bug.')
    }
  }
  if (rs_type === 'RS0004') {
    const rs = data as import('./types').RS0004
    const ap = rs.performance.performance_map_cooling.grid_variables.ambient_pressure
    if (isSuspiciousPressure(ap)) {
      warnings.push('ambient_pressure values look like kPa (expected Pa ≈ 101325). The DX-Constant-Efficiency example has this known bug.')
    }
  }
  return warnings
}

export async function parseFile(file: File): Promise<LoadedFile> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  let data: AnyRS
  if (isCBOR(bytes)) {
    const { decode } = await import('cbor-x')
    data = decode(bytes) as AnyRS
  } else {
    const text = new TextDecoder().decode(bytes)
    data = JSON.parse(text) as AnyRS
  }

  const rs_type: string = (data as { metadata?: { schema?: string } }).metadata?.schema ?? 'UNKNOWN'
  const warnings = collectWarnings(rs_type, data)

  return { filename: file.name, rs_type, data, warnings }
}

export function validateSameRS(files: LoadedFile[]): string | null {
  if (files.length < 2) return null
  const types = new Set(files.map(f => f.rs_type))
  if (types.size > 1) {
    return `Cannot mix RS types: got ${[...types].join(', ')}. Drop files of the same RS type to compare them.`
  }
  return null
}
