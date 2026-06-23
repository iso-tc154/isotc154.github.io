/**
 * Date formatting helpers shared across views.
 *
 * Dates arrive as ISO 8601 strings (e.g. "2024-10-18") from the Edoxen YAML.
 * All formatting uses UTC to avoid off-by-one shifts on the parsed date.
 */

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}

export function formatDateCompact(dateStr: string): string {
  if (!dateStr) return ''
  const s = String(dateStr)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return s
  const [, y, mo, d] = m
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIdx = parseInt(mo, 10) - 1
  if (monthIdx < 0 || monthIdx >= 12) return s
  return `${parseInt(d, 10)} ${months[monthIdx]} ${y}`
}
