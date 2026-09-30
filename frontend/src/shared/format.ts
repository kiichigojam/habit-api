export function formatNumber(value: number | null) {
  return value == null || Number.isNaN(value) ? 'n/a' : value.toFixed(1)
}

export function formatServing(size: number | null, unit: string | null, dataType?: string | null) {
  if (size == null && !unit && dataType === 'SR Legacy') {
    return '100.0 g'
  }
  if (size == null && !unit) {
    return 'n/a'
  }
  if (size == null) {
    return unit
  }
  return `${size.toFixed(1)} ${unit ?? ''}`.trim()
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
