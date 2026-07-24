import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, '_data/resolutions')
const STAGE = path.join(ROOT, '_data/resolutions-edoxen')

const SUBDIRS = ['plenary', '7372ma', 'ballots']

// Start clean — staging dir is .gitignored and ephemeral.
if (fs.existsSync(STAGE)) {
  fs.rmSync(STAGE, { recursive: true, force: true })
}
fs.mkdirSync(STAGE, { recursive: true })

let total = 0
for (const sub of SUBDIRS) {
  const srcDir = path.join(SRC, sub)
  if (!fs.existsSync(srcDir)) {
    console.warn(`[prepare-edoxen-data] skip ${sub}/ (missing)`)
    continue
  }
  const yamlFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.yaml'))
  for (const f of yamlFiles) {
    // Hard-link when possible (same filesystem, fast), fall back to copy.
    const src = path.join(srcDir, f)
    const dst = path.join(STAGE, f)
    try {
      fs.linkSync(src, dst)
    } catch {
      fs.copyFileSync(src, dst)
    }
  }
  console.log(`[prepare-edoxen-data] ${sub}/ → ${yamlFiles.length} YAML files (flat)`)
  total += yamlFiles.length
}
console.log(`[prepare-edoxen-data] staged ${total} YAML files in ${path.relative(ROOT, STAGE)}/`)
