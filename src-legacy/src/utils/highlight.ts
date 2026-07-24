/**
 * Highlights occurrences of `query` inside `text` for search result display.
 *
 * Output is HTML-safe: the text is escaped before the query is wrapped in
 * `<mark>`. Callers must use `v-html` on the result.
 *
 * SSR-safe: no DOM access — uses a regex-based HTML escaper.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] || ch)
}

export function highlightText(text: string, query: string): string {
  if (!text) return text
  const escapedText = escapeHtml(text)
  if (!query) return escapedText
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>')
}
