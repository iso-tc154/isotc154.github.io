import fs from 'node:fs'
import path from 'node:path'
import { loadYamlFile } from './yamlDir.mjs'
import {
  buildResolutionRecord,
  buildMeetingRecord,
  sortResolutions,
} from './transforms.mjs'

// Edoxen-schema YAMLs express text as localized arrays:
//   title: [{ spelling: eng, value: "..." }]
// The view layer (transforms.mjs) predates that and expects plain strings.
// Flatten localized fields once, here, so every downstream consumer sees
// the legacy shape regardless of which schema a file uses.
function localized(value) {
  if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && 'value' in value[0]) {
    return value[0].value ?? ''
  }
  return value
}

function normalizeDecision(res) {
  const identifier = Array.isArray(res.identifier)
    ? (res.identifier[0]?.number ?? String(res.identifier))
    : res.identifier
  const normalizeActions = (actions) =>
    (actions || []).map((a) => ({ ...a, message: localized(a.message) }))
  return {
    ...res,
    identifier,
    title: localized(res.title),
    subject: localized(res.subject),
    actions: normalizeActions(res.actions),
    considerations: normalizeActions(res.considerations),
    approvals: (res.approvals || []).map((a) => ({ ...a, message: localized(a.message) })),
  }
}

export function loadResolutions(resolutionsRoot) {
  if (!fs.existsSync(resolutionsRoot)) {
    return { resolutions: [], meetings: [] }
  }
  const resolutions = []
  const meetingsBySource = new Map()

  for (const sub of fs.readdirSync(resolutionsRoot)) {
    const subdir = path.join(resolutionsRoot, sub)
    if (!fs.statSync(subdir).isDirectory()) continue
    const sourceType = sub
    for (const file of fs.readdirSync(subdir)) {
      if (!/\.(ya?ml)$/.test(file)) continue
      const sourceFile = file.replace(/\.ya?ml$/, '')
      const fullPath = path.join(subdir, file)
      let parsed
      try {
        parsed = loadYamlFile(fullPath)
      } catch (e) {
        console.error(`[resolutions] failed to parse ${fullPath}: ${e.message}`)
        continue
      }
      // The resolution YAMLs use `decisions:` (edoxen schema); older local
      // checkouts used `resolutions:`. Accept both.
      const decisionList = parsed?.decisions ?? parsed?.resolutions
      if (!parsed || !decisionList) continue

      const metadata = parsed.metadata || {}
      const records = decisionList.map((raw) => buildResolutionRecord(normalizeDecision(raw), sourceType, sourceFile, metadata))
      resolutions.push(...records)
      meetingsBySource.set(`${sourceType}/${sourceFile}`, {
        sourceType,
        sourceFile,
        metadata,
        records,
      })
    }
  }

  resolutions.sort(sortResolutions)

  const meetings = []
  for (const { sourceType, sourceFile, metadata, records } of meetingsBySource.values()) {
    meetings.push(buildMeetingRecord(sourceType, sourceFile, metadata, records))
  }
  meetings.sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''))

  return { resolutions, meetings }
}
