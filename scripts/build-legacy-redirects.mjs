import fs from 'node:fs'
import path from 'node:path'
import yaml from "js-yaml"; const parseYaml = yaml.load;

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, '_data/resolutions')
const EVENTS = path.join(ROOT, '_data/events-edoxen')
const OUT = path.join(ROOT, 'src/data/legacy-redirects.json')

// Source-type → URL segment map (matches the old Vue router).
// Source files for plenary live in plenary/plenary-N.yaml and the URL is
// /resolutions/plenary/plenary-N/ID — i.e. the source dir name is reused
// as the URL "source file" segment.
const SUBDIRS = ['plenary', '7372ma', 'ballots']

const redirects = {}

// 1. Resolution redirects: /resolutions/{type}/{file}/{id} → /decisions/{urn}/
let decisionCount = 0
for (const sub of SUBDIRS) {
  const srcDir = path.join(SRC, sub)
  if (!fs.existsSync(srcDir)) continue
  for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith('.yaml'))) {
    const doc = parseYaml(fs.readFileSync(path.join(srcDir, f), 'utf8'))
    const sourceFile = f.replace(/\.yaml$/, '')
    for (const d of doc?.decisions ?? []) {
      if (!d.urn) continue
      const id = d.identifier?.[0]?.number
      if (id == null) continue
      const oldPath = `/resolutions/${sub}/${sourceFile}/${id}`
      const newUrl = `/decisions/${d.urn}/`
      redirects[oldPath] = newUrl
      decisionCount++
    }
  }
}

// 2. Meeting redirects: /meetings/urn:iso-tc154:meeting:plenary-{n}/ → /meetings/{n}/
// The urn: URLs were introduced during the edoxen-hosted era; meeting detail
// pages are native again at /meetings/{ordinal}/, so the urn form redirects
// to it. The legacy /meetings/{ordinal} URLs need no redirect — they are
// live routes again.
let meetingCount = 0
if (fs.existsSync(EVENTS)) {
  for (const f of fs.readdirSync(EVENTS).filter((f) => f.endsWith('.yaml'))) {
    const doc = parseYaml(fs.readFileSync(path.join(EVENTS, f), 'utf8'))
    const ordinal = doc?.ordinal
    const urn = doc?.urn
    if (ordinal == null || !urn) continue
    redirects[`/meetings/${urn}`] = `/meetings/${ordinal}/`
    meetingCount++
  }
}

// 3. Post redirects: /posts/{title}/ → /posts/{date}-{title}/
// Post slugs gained their yyyy-mm-dd filename prefix; the undated URLs
// from before the change keep working.
let postCount = 0
const POSTS = path.join(ROOT, 'content/posts')
if (fs.existsSync(POSTS)) {
  const postRe = /^(\d{4}-\d{2}-\d{2})-(.+)\.(?:adoc|md|asciidoc)$/i
  for (const f of fs.readdirSync(POSTS)) {
    const m = f.match(postRe)
    if (!m) continue
    redirects[`/posts/${m[2]}`] = `/posts/${m[1]}-${m[2]}/`
    postCount++
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(redirects, null, 2))
console.log(`[build-legacy-redirects] ${decisionCount} decisions, ${meetingCount} meetings, ${postCount} posts → ${path.relative(ROOT, OUT)} (${Object.keys(redirects).length} entries)`)
