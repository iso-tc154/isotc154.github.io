import type { AgendaItem, AgendaSession } from '../types/event'

// Flatten a nested agenda tree into renderable rows.
//
// Both AgendaDrawer (single-session drawer) and MeetingAgenda (opening +
// closing collapsibles) render the same shape: a flat list of rows with
// depth, sequence number, title, responsible party, and reference document.
// The flattening logic is non-trivial (leading "1.2." sequences are parsed
// out of titles when no explicit number is set; underscores in speaker
// slugs become spaces) and was previously duplicated in both components.

export interface FlatRow {
  seq: string
  title: string
  responsible: string
  ref: string
  depth: number
}

const LEADING_SEQ_RE = /^(\d+(?:\.\d+)*)\s+(.+)$/

export function parseLeadingSeq(title: string): { seq: string; title: string } {
  const m = title.match(LEADING_SEQ_RE)
  if (m) return { seq: m[1], title: m[2] }
  return { seq: '', title }
}

export function cleanResponsible(s?: string): string {
  return s ? s.replace(/_/g, ' ') : ''
}

export function flattenAgenda(items: AgendaItem[] | undefined, depth = 0): FlatRow[] {
  const out: FlatRow[] = []
  if (!items) return out
  for (const item of items) {
    const parsed = parseLeadingSeq(item.title)
    const seq = item.number != null ? String(item.number) : parsed.seq
    const title = item.number != null ? item.title : parsed.title
    out.push({
      seq,
      title,
      responsible: cleanResponsible(item.speaker),
      ref: item.n_doc ?? '',
      depth,
    })
    if (item.subitems?.length) {
      out.push(...flattenAgenda(item.subitems, depth + 1))
    }
  }
  return out
}

export function flattenSession(session: AgendaSession | null | undefined): FlatRow[] {
  return session ? flattenAgenda(session.items) : []
}
