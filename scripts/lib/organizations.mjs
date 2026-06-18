import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export function loadYamlList(ymlPath) {
  if (!fs.existsSync(ymlPath)) return []
  return yaml.load(fs.readFileSync(ymlPath, 'utf8')) || []
}

export function loadEvents(eventsDir) {
  if (!fs.existsSync(eventsDir)) return []
  const out = []
  for (const file of fs.readdirSync(eventsDir)) {
    if (!/\.(ya?ml)$/.test(file)) continue
    const id = file.replace(/\.ya?ml$/, '')
    const fullPath = path.join(eventsDir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    if (!data) continue
    out.push({
      ...data,
      id,
      url: `/events/${id}/`,
    })
  }
  return out.sort((a, b) => (b.ordinal || 0) - (a.ordinal || 0))
}
