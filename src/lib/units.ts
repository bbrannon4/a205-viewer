export const kelvinToCelsius = (k: number) => k - 273.15
export const paToKPa = (pa: number) => pa / 1000
export const wToKw = (w: number) => w / 1000
export const m3sToLs = (m3s: number) => m3s * 1000
export const m3sToGpm = (m3s: number) => m3s * 15850.32

/** Format a number for display, choosing appropriate precision */
export function fmt(v: number, decimals = 2): string {
  return v.toFixed(decimals)
}

/** Suspicious pressure check: ambient_pressure values < 50000 Pa are likely kPa mislabeled as Pa */
export function isSuspiciousPressure(values: number[]): boolean {
  return values.some(v => v > 0 && v < 50_000)
}
