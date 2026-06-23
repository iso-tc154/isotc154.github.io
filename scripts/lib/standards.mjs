import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { standardPath, projectPath } from '../../src/utils/urn.ts'

export function loadStandards(standardsDir) {
  if (!fs.existsSync(standardsDir)) return []
  const out = []
  for (const file of fs.readdirSync(standardsDir)) {
    if (!/\.(ya?ml)$/.test(file)) continue
    const fullPath = path.join(standardsDir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    if (!data || !data.iso) continue
    const id = file.replace(/\.ya?ml$/, '')
    out.push({
      ...data,
      id,
      url: standardPath(id),
    })
  }
  return out
}

export function loadProjects(projectsDir) {
  if (!fs.existsSync(projectsDir)) return []
  const out = []
  for (const file of fs.readdirSync(projectsDir)) {
    if (!/\.(ya?ml)$/.test(file)) continue
    const fullPath = path.join(projectsDir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    if (!data || !data.id) continue
    out.push({
      ...data,
      url: projectPath(data.id),
    })
  }
  return out
}
