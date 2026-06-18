import fs from 'node:fs'
import path from 'node:path'
import { parseAndRender } from './asciidoc.mjs'

const POST_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.(?:adoc|md|asciidoc)$/i
const ADOC_EXT_RE = /\.(adoc|md|asciidoc)$/i
const SUBDIRS = ['faq', 'procedures', 'agenda']

export function buildSiteContext(members, groupsArray) {
  const groups = (groupsArray || []).map(g => ({
    ...g,
    url: g.url || `/groups/${g.id}/`,
  }))
  return {
    data: { members },
    groups,
  }
}

export function loadPosts(postsDir, siteContext = null) {
  if (!fs.existsSync(postsDir)) return []
  const out = []
  for (const file of fs.readdirSync(postsDir)) {
    const match = file.match(POST_FILENAME_RE)
    if (!match) continue
    const date = match[1]
    const slug = match[2]
    const fullPath = path.join(postsDir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { frontmatter, html } = parseAndRender(raw, {}, siteContext)
    out.push({
      slug,
      date,
      html,
      frontmatter,
      url: `/posts/${slug}/`,
    })
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

function loadPagesRecursive(dir, baseUrlPrefix = '', siteContext = null) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue
    if (!ADOC_EXT_RE.test(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { frontmatter, html } = parseAndRender(raw, {}, siteContext)
    const slug = entry.name.replace(ADOC_EXT_RE, '')
    const permalink = frontmatter.permalink
      || (baseUrlPrefix ? `${baseUrlPrefix}/${slug}/` : `/${slug}/`)
    out.push({
      slug: baseUrlPrefix ? `${baseUrlPrefix}/${slug}` : slug,
      html,
      frontmatter,
      url: permalink,
    })
  }
  return out
}

export function loadPages(pagesDir, siteContext = null) {
  if (!fs.existsSync(pagesDir)) return []
  const out = [...loadPagesRecursive(pagesDir, '', siteContext)]
  for (const sub of SUBDIRS) {
    const subDir = path.join(pagesDir, sub)
    if (fs.existsSync(subDir)) {
      out.push(...loadPagesRecursive(subDir, `/${sub}`, siteContext))
    }
  }
  return out
}
