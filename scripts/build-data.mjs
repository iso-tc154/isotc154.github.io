import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadGroups, loadMembers, buildOrganizationMembers } from './lib/members.mjs'
import { buildGroupRecords } from './lib/groupPipeline.mjs'
import { loadStandards, loadProjects } from './lib/standards.mjs'
import {
  loadEvents,
  loadYamlList,
} from './lib/organizations.mjs'
import { loadPosts, loadPages, buildSiteContext } from './lib/content.mjs'
import { loadResolutions } from './lib/resolutions.mjs'
import { loadCanonicalMeetings } from './lib/meetings.mjs'
import { loadEdoxenMeetingsDir } from './lib/edoxenMeetings.mjs'
import { loadGroupEvents } from './lib/groupHistory.mjs'
import { toISODate } from './lib/dates.mjs'
import {
  partitionByStatus,
  filterOpenForComment,
  latestPublication,
} from './lib/standardsClassification.mjs'
import { buildOrgIndex } from './lib/orgIndex.mjs'
import { loadYamlFile } from './lib/yamlDir.mjs'

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
  return loadYamlFile(path.join(DATA_DIR, file))
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  // Groups + Members + lifecycle (curated events → history, lineage, terms).
  // The pipeline encodes the three-pass build order; see groupPipeline.mjs.
  const groups = loadGroups(path.join(DATA_DIR, 'groups'))
  const members = loadMembers(path.join(DATA_DIR, 'members'), CHAIR_MEMBER_ID)
  const groupEvents = loadGroupEvents(path.join(DATA_DIR, 'group_events.yml'))
  buildGroupRecords(groups, members.all, groupEvents)

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
  // Load legacy-shape events (one YAML per ordinal) from _data/events/.
  const meetings = loadCanonicalMeetings(
    path.join(DATA_ROOT, 'meetings.yml'),
    path.join(DATA_DIR, 'events'),
    resolutionMeetings,
    orgIndex,
  )

  // Additionally, load edoxen-shape events from _data/events-edoxen/ and
  // merge them into the existing per-ordinal records by ordinal. The
  // edoxen-shape files coexist with the legacy files during the
  // migration window; per-ordinal fields prefer edoxen (it is the
  // canonical target shape), with legacy providing fallback.
  const edoxenDir = path.join(DATA_DIR, 'events-edoxen')
  if (fs.existsSync(edoxenDir)) {
    const edoxenMeetings = loadEdoxenMeetingsDir(edoxenDir).meetings
    const edoxenByOrdinal = new Map()
    for (const e of edoxenMeetings) {
      if (Number.isFinite(e.ordinal)) edoxenByOrdinal.set(e.ordinal, e)
    }
    for (const m of meetings) {
      const e = edoxenByOrdinal.get(m.ordinal)
      if (!e) continue
      // Prefer edoxen-shape fields where present; fall back to legacy.
      m._edoxen = e
      if (e.title) m.rich_title = e.title
      if (e.schedule?.length) m.schedule = e.schedule
      if (e.deadlines?.length) m.deadlines = e.deadlines
      if (e.venues?.length) m.edoxen_venues = e.venues
      if (e.urn) m.edoxen_urn = e.urn
      if (e.identifier?.length) m.edoxen_identifier = e.identifier
    }
  }

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

  const {
    published: publishedStandards,
    withdrawn: withdrawnStandards,
    underDevelopment: underDevelopmentStandards,
  } = partitionByStatus(standards)

  // js-yaml parses unquoted dates as Date objects; quoted dates stay as strings.
  // Normalise both to YYYY-MM-DD so sorts compare apples to apples.
  const toDateStr = toISODate
  const latestPub = latestPublication(publishedStandards)

  const openForComment = filterOpenForComment(underDevelopmentStandards)

  const upcomingPlenary = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))[0]

  const resolutionsSortedNewest = resolutions
    .slice()
    .sort((a, b) => toDateStr(b.meeting_date).localeCompare(toDateStr(a.meeting_date)))
  const latestResolution = resolutionsSortedNewest[0]

  // ISO membership roster: P/O counts exclude `former: true` bodies (those have
  // left the committee). `nationalBodies` above includes historical bodies.
  const activeNb = nationalBodies.filter((nb) => !nb.former)
  const participatingMembers = activeNb.filter((nb) => String(nb.membership).toUpperCase() === 'P').length
  const observingMembers = activeNb.filter((nb) => String(nb.membership).toUpperCase() === 'O').length

  writeJson('meta.json', {
    generatedAt: new Date().toISOString(),
    counts: {
      groups: Object.keys(groups).length,
      activeGroups: Object.values(groups).filter((g) => !g.inactive).length,
      activeWorkingGroups: Object.values(groups).filter((g) => !g.inactive && g.category === 'working').length,
      members: Object.keys(members.all).length,
      standards: standards.length,
      publishedStandards: publishedStandards.length,
      withdrawnStandards: withdrawnStandards.length,
      underDevelopmentStandards: underDevelopmentStandards.length,
      projects: projects.length,
      events: events.length,
      liaisons: liaisons.length,
      nationalBodies: nationalBodies.length,
      participatingMembers,
      observingMembers,
      totalMembers: participatingMembers + observingMembers,
      associates: associates.length,
      resolutions: resolutions.length,
      meetings: meetings.length,
      posts: posts.length,
      pages: pages.length,
      acknowledgments: acks.length,
      history: history.length,
    },
    current: {
      latestPublication: latestPub
        ? {
            id: latestPub.id,
            url: latestPub.url,
            name: latestPub.iso?.name,
            title: latestPub.iso?.title,
            publication_date: toDateStr(latestPub.iso?.publication_date),
          }
        : null,
      latestResolution: latestResolution
        ? {
            id: latestResolution.id,
            url: latestResolution.url,
            title: latestResolution.title,
            meeting_date: toDateStr(latestResolution.meeting_date),
            source_title: latestResolution.source_title,
          }
        : null,
      openForComment: openForComment.map((s) => ({
          id: s.id,
          url: s.url,
          name: s.iso?.name,
          title: s.iso?.title,
          stage: s.iso?.stage,
          store_id: s.iso?.store_id,
        })),
      nextPlenary: upcomingPlenary
        ? {
            id: upcomingPlenary.id,
            url: upcomingPlenary.url,
            ordinal: upcomingPlenary.ordinal,
            general_area: upcomingPlenary.general_area,
            from_date: toDateStr(upcomingPlenary.time?.from?.date),
            to_date: toDateStr(upcomingPlenary.time?.to?.date),
            registration_url: upcomingPlenary.registration_url,
          }
        : null,
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
