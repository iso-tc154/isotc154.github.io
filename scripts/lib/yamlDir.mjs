import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const YAML_RE = /\.ya?ml$/

export function loadYamlFile(fullPath, { fallback } = {}) {
  if (!fs.existsSync(fullPath)) return fallback ?? null
  return yaml.load(fs.readFileSync(fullPath, 'utf8'))
}

export function loadYamlDir(dir, opts = {}) {
  const { predicate, transform, fallback } = opts
  if (!fs.existsSync(dir)) return fallback ?? []
  const out = []
  for (const file of fs.readdirSync(dir)) {
    if (!YAML_RE.test(file)) continue
    const fullPath = path.join(dir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    if (data == null) continue
    if (predicate && !predicate(data, file)) continue
    out.push(transform ? transform(data, file) : data)
  }
  return out
}
