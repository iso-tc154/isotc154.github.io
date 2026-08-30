// The site's display language — labels, ordinals, dates, initials.
// Mirrors src-legacy/src/domain/*Presentation.ts so vocabulary stays aligned
// with the parity checker's source of truth.
export function standardStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'published': return 'Published'
    case 'withdrawn': return 'Withdrawn'
    case 'current': return 'Current'
    case 'under-development':
    case 'under_development': return 'Under development'
    case 'under-review':
    case 'under_review': return 'Under review'
    case 'deleted': return 'Deleted'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function projectStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'current': return 'Current'
    case 'deleted': return 'Deleted'
    case 'withdrawn': return 'Withdrawn'
    case 'new': return 'New'
    case 'under-development':
    case 'under_development': return 'Under development'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export const ROLE_LABELS: Record<string, string> = {
  chair: 'Chair',
  co_chair: 'Co-chair',
  committee_manager: 'Committee Manager',
  convenor: 'Convenor',
  editorial_programme_manager: 'Editorial Programme Manager',
  'editorial-programme-manager': 'Editorial Programme Manager',
  manager: 'Manager',
  member: 'Member',
  observer: 'Observer',
  partner: 'Partner',
  project_leader: 'Project Leader',
  'project-leader': 'Project Leader',
  secretary: 'Secretary',
  technical_programme_manager: 'Technical Programme Manager',
  'technical-programme-manager': 'Technical Programme Manager',
}

export function roleLabel(roleId?: string): string {
  if (!roleId) return ''
  return ROLE_LABELS[roleId] ?? roleId
}

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function ordinalText(n: number): string {
  return `${n}${ordinalSuffix(n)}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    })
  } catch {
    return dateStr
  }
}

export function formatDateCompact(dateStr: string): string {
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(dateStr)
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`
}

export function formatDateLong(value: unknown): string {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(value)
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

export function postExcerpt(html: string, max = 200): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max).trim() + '…' : text
}

export function postTitle(slug: string, title?: string): string {
  if (title) return title
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function postCategories(categories: unknown): string[] {
  if (!categories) return []
  if (Array.isArray(categories)) return categories.map(String)
  return String(categories).split(/[,\s]+/).filter(Boolean)
}

export function flagEmoji(countryCode?: string | null): string {
  if (!countryCode) return ''
  const trimmed = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(trimmed)) return ''
  return trimmed.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

// Org monograms take the first two letters of a single word ("DIN" → "DI");
// person initials (above) take first + last letter.
export function orgInitials(text: string): string {
  if (!text) return '?'
  const parts = text.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function groupCategoryLabel(category?: string): string {
  if (!category) return ''
  switch (category) {
    case 'working': return 'Working Group'
    case 'advisory': return 'Advisory Group'
    case 'cag': return "Chairman's Advisory Group"
    case 'joint': return 'Joint Working Group'
    case 'ahwg': return 'Ad Hoc Working Group'
    case 'sg': return 'Study Group'
    case 'rtc': return 'Resolution Drafting Group'
    default: return category.charAt(0).toUpperCase() + category.slice(1)
  }
}

export function membershipLabel(m?: string): { short: string; long: string } {
  if (m === 'P') return { short: 'P', long: 'Participating member' }
  if (m === 'O') return { short: 'O', long: 'Observer member' }
  return { short: m || '', long: m || '' }
}

export function liaisonCategoryLabel(cat?: string, form: 'short' | 'long' = 'short'): string {
  if (!cat) return ''
  if (form === 'long') {
    if (cat === 'A') return 'Category A — Active cooperation'
    if (cat === 'B') return 'Category B — Kept informed'
    return `Category ${cat}`
  }
  return `Category ${cat}`
}

const HISTORY_CATEGORY_META: Record<string, { label: string; color: string }> = {
  founding:    { label: 'Founding',         color: '#b91c1c' },
  leadership:  { label: 'Leadership',       color: '#1e3a8a' },
  meeting:     { label: 'Plenary meetings', color: '#b45309' },
  standard:    { label: 'Standards',        color: '#047857' },
  structure:   { label: 'Structure',        color: '#6d28d9' },
  liaison:     { label: 'Liaisons',         color: '#0f766e' },
  cooperation: { label: 'Cooperation',      color: '#9a3412' },
  withdrawn:   { label: 'Withdrawn',        color: '#78716c' },
}

export function historyCategoryKeys(): string[] {
  return Object.keys(HISTORY_CATEGORY_META)
}

export function historyCategoryLabel(cat: string): string {
  return HISTORY_CATEGORY_META[cat]?.label ?? cat
}

export function historyCategoryColor(cat: string): string {
  return HISTORY_CATEGORY_META[cat]?.color ?? '#78716c'
}

export function formatDatePrecision(dateStr: string, precision?: 'day' | 'month' | 'year'): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    if (precision === 'year') return String(d.getUTCFullYear())
    if (precision === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}
