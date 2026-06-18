import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import {
  buildResolutionRecord,
  buildMeetingRecord,
  sortResolutions,
} from './transforms.mjs'

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
        parsed = yaml.load(fs.readFileSync(fullPath, 'utf8'))
      } catch (e) {
        console.error(`[resolutions] failed to parse ${fullPath}: ${e.message}`)
        continue
      }
      if (!parsed || !parsed.resolutions) continue

      const metadata = parsed.metadata || {}
      const records = parsed.resolutions.map((r) =>
        buildResolutionRecord(r, sourceType, sourceFile, metadata),
      )
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
