// Post-build: emit sitemap.xml, robots.txt, and 404.html fallback.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')
const SITE_ORIGIN = 'https://www.isotc154.org'

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

function buildSitemap(pages) {
  const urls = pages
    .filter(p => p.route !== '/404/')
    .map(p => {
      const mtime = fs.statSync(p.fullPath).mtime
      const lastmod = mtime.toISOString().split('T')[0]
      const loc = `${SITE_ORIGIN}${p.route === '/' ? '/' : p.route}`
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
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

  const pages = walkHtml(DIST_DIR)
  const sitemap = buildSitemap(pages)
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap)
  console.log(`[post-build] wrote sitemap.xml (${pages.length} URLs)`)

  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), buildRobots())
  console.log('[post-build] wrote robots.txt')
}

main()
