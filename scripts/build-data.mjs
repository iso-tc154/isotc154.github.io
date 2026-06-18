import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadGroups, loadMembers, attachMembersToGroups, buildOrganizationMembers } from './lib/members.mjs'
import { loadStandards, loadProjects } from './lib/standards.mjs'
import {
  loadEvents,
  loadYamlList,
} from './lib/organizations.mjs'
import { loadPosts, loadPages, buildSiteContext } from './lib/content.mjs'
import { loadResolutions } from './lib/resolutions.mjs'
import { loadCanonicalMeetings } from './lib/meetings.mjs'
import { load as yamlLoad } from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, '_data')
const DATA_ROOT = path.join(ROOT, 'data')
const CONTENT_DIR = path.join(ROOT, 'content')
const OUT_DIR = path.join(ROOT, 'public', 'data')

const CHAIR_MEMBER_ID = 'pan-wei'

function writeJson(name, data) {
  const outPath = path.join(OUT_DIR, name)
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
  const size = fs.statSync(outPath).size
  console.log(`[build-data] ${name}  ${size.toLocaleString()} bytes`)
}

function loadYaml(file) {
  const full = path.join(DATA_DIR, file)
  if (!fs.existsSync(full)) return null
  return yamlLoad(fs.readFileSync(full, 'utf-8'))
}

function normalizeKey(s) {
  return String(s || '').trim().toLowerCase()
}

function buildOrgIndex(nationalBodies, liaisons, associates) {
  const byKey = new Map() // normalized key -> { record, type }
  const records = []

  const add = (org, type) => {
    if (!org || !org.id) return
    const path = type === 'liaison'
      ? `/liaisons/${org.id}/`
      : type === 'associate'
        ? null
        : `/national-bodies/${org.id}/`
    const record = {
      ref: org.id,
      type,
      kind: type,
      name: org.short_name || org.name,
      short_name: org.short_name,
      url: org.url,
      path,
      logo: org.logo,
      logo_light: org.logo_light,
      logo_dark: org.logo_dark,
      country: org.country,
      category: org.category,
    }
    records.push({ record, raw: org, type })

    const keys = new Set()
    keys.add(org.id)
    if (org.short_name) keys.add(org.short_name)
    if (Array.isArray(org.aliases)) org.aliases.forEach((a) => keys.add(a))
    keys.add(org.name)
    // Also add short_name + parenthetical forms like "DIN (Germany)"
    if (org.short_name && org.country) keys.add(`${org.short_name} (${org.country})`)
    for (const k of keys) {
      const nk = normalizeKey(k)
      if (!nk) continue
      // NBs and liaisons override associates on collision (canonical ISO orgs win)
      if (byKey.has(nk)) {
        const existing = byKey.get(nk)
        const rank = { 'national-body': 3, liaison: 2, associate: 1 }
        if (rank[type] > rank[existing.type]) byKey.set(nk, { record, type })
      } else {
        byKey.set(nk, { record, type })
      }
    }
  }
  // Add associates first so NBs/liaisons override on collision
  for (const a of associates || []) add(a, 'associate')
  for (const l of liaisons || []) add(l, 'liaison')
  for (const nb of nationalBodies || []) add(nb, 'national-body')

  return {
    lookup(token, hintType) {
      const key = normalizeKey(token)
      if (!key) return null
      const match = byKey.get(key)
      if (!match) return null
      if (hintType && match.type !== hintType) return null
      return match.record
    },
    lookupAny(token, hintTypes) {
      const key = normalizeKey(token)
      if (!key) return null
      const match = byKey.get(key)
      if (!match) return null
      if (hintTypes && hintTypes.length && !hintTypes.includes(match.type)) return null
      return match.record
    },
  }
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  // Groups + Members (mirror members.rb)
  const groups = loadGroups(path.join(DATA_DIR, 'groups'))
  const members = loadMembers(path.join(DATA_DIR, 'members'), CHAIR_MEMBER_ID)
  attachMembersToGroups(groups, members.all)

  // Organizations
  const liaisons = loadYamlList(path.join(DATA_DIR, 'liaisons.yml'))
  const nationalBodies = loadYamlList(path.join(DATA_DIR, 'national_bodies.yml'))
  const associates = loadYamlList(path.join(DATA_DIR, 'associates.yml'))
  const secretariat = loadYamlList(path.join(DATA_DIR, 'secretariat.yml'))
  const organizationMembers = buildOrganizationMembers(nationalBodies, liaisons, members.all)

  // Standards + Projects
  const standards = loadStandards(path.join(DATA_DIR, 'standards'))
  const projects = loadProjects(path.join(DATA_DIR, 'projects'))

  // Events (plenary meetings)
  const events = loadEvents(path.join(DATA_DIR, 'events'))

  // Resolutions + Meetings
  const { resolutions, meetings: resolutionMeetings } = loadResolutions(path.join(DATA_DIR, 'resolutions'))

  // Unified meetings: canonical xlsx-derived list merged with rich per-meeting YAMLs
  // and resolution cross-references.
  const orgIndex = buildOrgIndex(nationalBodies, liaisons, associates)
  const meetings = loadCanonicalMeetings(
    path.join(DATA_ROOT, 'meetings.yml'),
    path.join(DATA_DIR, 'events'),
    resolutionMeetings,
    orgIndex,
  )

  // Posts + Pages
  const siteContext = buildSiteContext(members, Object.values(groups))
  const posts = loadPosts(path.join(CONTENT_DIR, 'posts'), siteContext)
  const pages = loadPages(CONTENT_DIR, siteContext)

  // Acknowledgments
  const acksRaw = loadYaml('acknowledgments.yml')
  const acks = Array.isArray(acksRaw) ? acksRaw.filter((a) => a && a.name) : []

  // History milestones (curated)
  const historyRaw = loadYaml('history.yml')
  const history = Array.isArray(historyRaw) ? historyRaw.filter((h) => h && h.date && h.title) : []

  writeJson('meta.json', {
    generatedAt: new Date().toISOString(),
    counts: {
      groups: Object.keys(groups).length,
      members: Object.keys(members.all).length,
      standards: standards.length,
      projects: projects.length,
      events: events.length,
      liaisons: liaisons.length,
      nationalBodies: nationalBodies.length,
      associates: associates.length,
      resolutions: resolutions.length,
      meetings: meetings.length,
      posts: posts.length,
      pages: pages.length,
      acknowledgments: acks.length,
      history: history.length,
    },
  })
  writeJson('groups.json', Object.values(groups))
  writeJson('members.json', members)
  writeJson('standards.json', standards)
  writeJson('projects.json', projects)
  writeJson('events.json', events)
  writeJson('liaisons.json', liaisons)
  writeJson('national-bodies.json', nationalBodies)
  writeJson('associates.json', associates)
  writeJson('secretariat.json', secretariat)
  writeJson('organization-members.json', organizationMembers)
  writeJson('resolutions.json', resolutions)
  writeJson('meetings.json', meetings)
  writeJson('posts.json', posts)
  writeJson('pages.json', pages)
  writeJson('acknowledgments.json', acks)
  writeJson('history.json', history)

  console.log('[build-data] done')
}

main()
