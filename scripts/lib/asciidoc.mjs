import Asciidoctor from '@asciidoctor/core'
import { load as yamlLoad } from 'js-yaml'
import { hasLiquid, renderLiquid } from './liquid.mjs'

const asciidoctor = Asciidoctor()

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/

export function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) {
    return { frontmatter: {}, body: raw }
  }
  let frontmatter = {}
  try {
    frontmatter = yamlLoad(match[1]) || {}
  } catch (e) {
    console.warn(`[asciidoc] frontmatter parse failed: ${e.message}`)
  }
  return { frontmatter, body: raw.slice(match[0].length) }
}

export function renderAsciiDoc(body, attributes = {}) {
  return asciidoctor.convert(body, {
    safe: 'unsafe',
    attributes: {
      'no-header': true,
      'nofooter': true,
      'skip-front-matter': true,
      ...attributes,
    },
  })
}

export function parseAndRender(raw, attributes = {}, siteContext = null) {
  const { frontmatter, body } = parseFrontmatter(raw)
  const processed = siteContext && hasLiquid(body) ? renderLiquid(body, siteContext) : body
  const html = renderAsciiDoc(processed, attributes)
  return { frontmatter, html }
}
