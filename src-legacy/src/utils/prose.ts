import { asciidocify } from './asciidoc'

export type ProseFormat = 'asciidoc' | 'inline' | 'plain'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(text: string): string {
  return escapeHtml(text).replace(/_([^_][^_\n]*?)_/g, '<em>$1</em>')
}

export function renderProse(
  text: string | undefined | null,
  format: ProseFormat = 'asciidoc',
): string {
  if (!text) return ''
  switch (format) {
    case 'asciidoc': return asciidocify(text)
    case 'inline': return formatInline(text)
    case 'plain': return escapeHtml(text)
  }
}
