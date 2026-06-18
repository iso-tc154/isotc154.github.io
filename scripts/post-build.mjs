// Post-build: emit sitemap.xml, robots.txt, and a noindex 404 fallback.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')
const DATA_DIR = path.resolve(__dirname, '../public/data')
const SITE_ORIGIN = 'https://www.isotc154.org'

function readJson(rel) {
  const full = path.join(DATA_DIR, rel)
  if (!fs.existsSync(full)) return null
  return JSON.parse(fs.readFileSync(full, 'utf-8'))
}

function walkHtml(dir, base = '', out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      walkHtml(fullPath, rel, out)
    } else if (entry.name === 'index.html') {
      out.push({ fullPath, route: base ? `/${base}/` : '/' })
    }
  }
  return out
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Derive a content-stable lastmod for a route: prefer the most recent
// "date-shaped" field across the matching data record(s); fall back to the
// file's git-tracked mtime equivalent (file mtime), but only if no content
// date is available. This keeps sitemap lastmod stable across rebuilds
// unless the underlying content actually changed.
function lastmodForRoute(route, data) {
  const clean = route.replace(/\/+$/, '') || '/'
  const parts = clean.split('/').filter(Boolean)
  const candidates = []

  if (parts[0] === 'resolutions' && parts.length === 4) {
    const res = (data.resolutions || []).find(
      (r) => r.source_type === parts[1] && r.source_file === parts[2] && r.id === parts[3],
    )
    if (res?.meeting_date) candidates.push(res.meeting_date)
  } else if (parts[0] === 'meetings' && parts.length === 2 && /^\d+$/.test(parts[1])) {
    const ordinal = parseInt(parts[1], 10)
    const m = (data.meetings || []).find((x) => x.ordinal === ordinal)
    if (m?.primary?.end_date) candidates.push(m.primary.end_date)
    if (m?.primary?.start_date) candidates.push(m.primary.start_date)
  } else if (parts[0] === 'posts' && parts.length === 2) {
    const post = (data.posts || []).find((p) => p.slug === parts[1])
    if (post?.date) candidates.push(post.date)
  } else if (parts[0] === 'standards' && parts.length === 2) {
    const std = (data.standards || []).find((s) => s.id === parts[1])
    if (std?.iso?.publication_date) candidates.push(std.iso.publication_date)
  }

  if (candidates.length > 0) {
    const iso = candidates
      .map((s) => {
        const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/)
        return m ? `${m[1]}-${m[2]}-${m[3]}` : null
      })
      .filter(Boolean)
      .sort()
    if (iso.length > 0) return iso[iso.length - 1]
  }

  // Stable fallback: build date stamped at release time, not file mtime.
  return process.env.SOURCE_DATE_EPOCH
    ? new Date(parseInt(process.env.SOURCE_DATE_EPOCH, 10) * 1000).toISOString().split('T')[0]
    : null
}

function buildSitemap(pages, data) {
  const urls = pages
    .filter((p) => p.route !== '/404/')
    .map((p) => {
      const lastmod = lastmodForRoute(p.route, data)
      const loc = `${SITE_ORIGIN}${p.route === '/' ? '/' : p.route}`
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

function buildRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n')
}

function ensureNoindex404() {
  const notFoundPath = path.join(DIST_DIR, '404.html')
  if (!fs.existsSync(notFoundPath)) return
  let html = fs.readFileSync(notFoundPath, 'utf-8')
  if (html.includes('content="noindex')) return
  html = html
    .replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex,nofollow">')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '')
    .replace(/<title>[^<]*<\/title>/i, '<title>Page not found — ISO/TC 154</title>')
  fs.writeFileSync(notFoundPath, html)
  console.log('[post-build] stamped 404.html with noindex,nofollow')
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn(`[post-build] dist/ not found at ${DIST_DIR}; skipping`)
    return
  }

  const indexPath = path.join(DIST_DIR, 'index.html')
  const notFoundPath = path.join(DIST_DIR, '404.html')
  if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexPath, notFoundPath)
    console.log('[post-build] generated 404.html fallback')
  }
  ensureNoindex404()

  const data = {
    resolutions: readJson('resolutions.json'),
    meetings: readJson('meetings.json'),
    posts: readJson('posts.json'),
    standards: readJson('standards.json'),
  }

  const pages = walkHtml(DIST_DIR)
  const sitemap = buildSitemap(pages, data)
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap)
  console.log(`[post-build] wrote sitemap.xml (${pages.length} URLs)`)

  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), buildRobots())
  console.log('[post-build] wrote robots.txt')
}

main()
