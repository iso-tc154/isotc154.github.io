// AsciiDoc rendering for detail pages. One shared Asciidoctor instance
// serves every page that renders prose from the data pipeline.
import Asciidoctor from '@asciidoctor/core'

const asciidoctor = Asciidoctor()

export function renderProse(text?: string | null): string {
  if (!text) return ''
  return String(asciidoctor.convert(text, {
    standalone: false,
    safe: 'safe',
    attributes: { showtitle: false },
  }))
}

// Minimal inline markdown (links, emphasis, code) for short data strings
// that are not full AsciiDoc blocks (e.g. history descriptions).
export function renderProseInline(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}
