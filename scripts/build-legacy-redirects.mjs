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

// 2. Meeting redirects: /meetings/{ordinal} → /meetings/urn:iso-tc154:meeting:plenary-{ordinal}/
let meetingCount = 0
if (fs.existsSync(EVENTS)) {
  for (const f of fs.readdirSync(EVENTS).filter((f) => f.endsWith('.yaml'))) {
    const doc = parseYaml(fs.readFileSync(path.join(EVENTS, f), 'utf8'))
    const ordinal = doc?.ordinal
    const urn = doc?.urn
    if (ordinal == null || !urn) continue
    const oldPath = `/meetings/${ordinal}`
    const newUrl = `/meetings/${urn}/`
    redirects[oldPath] = newUrl
    meetingCount++
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(redirects, null, 2))
console.log(`[build-legacy-redirects] ${decisionCount} decisions, ${meetingCount} meetings → ${path.relative(ROOT, OUT)} (${Object.keys(redirects).length} entries)`)
