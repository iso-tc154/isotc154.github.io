// Normalises the many date shapes that flow through the build pipeline
// into a canonical ISO 8601 'YYYY-MM-DD' string.
//
// YAML auto-parses unquoted dates as JS Date objects; quoted dates stay
// strings; member role records use {date, precision} hashes. All three
// shapes are normalised here so downstream sort/compare logic is uniform.

export function toISODate(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string') return value.slice(0, 10)
  if (typeof value === 'object' && value.date) return toISODate(value.date)
  return String(value).slice(0, 10)
}

// Same as toISODate but returns null for empty input, so it can be used
// to express "no date" distinctly from "default to today" in convenor
// term derivation.
export function toNullableISODate(value) {
  const out = toISODate(value)
  return out || null
}
