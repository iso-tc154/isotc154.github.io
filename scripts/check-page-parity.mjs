// Page-parity checker: verifies that every legacy Vue view's scoped CSS
// is present in the Astro site, so migrations don't silently drop styles.
//
// Usage: node scripts/check-page-parity.mjs
// Exit code 1 when any selector is missing; 0 when all pages match.
//
// How it works:
// 1. Each legacy view (src-legacy/src/views/*.vue) maps to its Astro page
//    (or layout). Edoxen-hosted views (meetings/resolutions/event detail)
//    are skipped — those routes are rendered by @edoxen/browser.
// 2. Scoped-CSS selectors are extracted from the legacy view. Vue-isms are
//    normalized to their Astro equivalents:
//      :global(.dark) .foo  →  .dark .foo
//      .foo :deep(.bar)     →  .foo .bar
//      .foo :global(.bar)   →  .foo .bar   (Astro side)
// 3. A selector passes when it appears in the Astro page's own styles OR
//    in the shared pool (src/styles/*.css, PageHero.astro, islands,
//    BaseLayout.astro).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const views = readdirSync('src-legacy/src/views').filter((f) => f.endsWith('.vue'))

// legacy view → Astro page (relative to src/pages/ unless noted)
const MAPPING = {
  'AboutView.vue': 'about.astro',
  'AcknowledgmentsView.vue': 'acknowledgments.astro',
  'ContactView.vue': 'contact.astro',
  'GroupsListView.vue': 'groups.astro',
  'GroupDetailView.vue': 'groups/[id].astro',
  'HistoryView.vue': 'history.astro',
  'LiaisonsListView.vue': 'liaisons.astro',
  'LiaisonDetailView.vue': 'liaisons/[id].astro',
  'MembersListView.vue': 'members.astro',
  'MemberDetailView.vue': 'members/[id].astro',
  'NationalBodiesListView.vue': 'national-bodies.astro',
  'NationalBodyDetailView.vue': 'national-bodies/[id].astro',
  'NewsListView.vue': 'posts.astro',
  'NewsPostView.vue': 'posts/[slug].astro',
  'NotFoundView.vue': '404.astro',
  'ProceduresView.vue': 'procedures.astro',
  'ProjectsListView.vue': 'projects.astro',
  'ProjectDetailView.vue': 'projects/[id].astro',
  'StandardsListView.vue': 'standards.astro',
  'StandardDetailView.vue': 'standards/[id].astro',
  'HomeView.vue': 'index.astro',
  'AsciiDocPageView.vue': '../layouts/AsciiDocLayout.astro',
}

// Rendered by @edoxen/browser (edoxen-host integration), not ported here.
const SKIPPED = new Set([
  'EventDetailView.vue',
  'MeetingDetailView.vue',
  'MeetingsLandingView.vue',
  'MeetingsListView.vue',
  'MeetingsTimelineView.vue',
  'ResolutionDetailView.vue',
  'ResolutionsListView.vue',
])

function extractStyles(src) {
  const out = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(src))) out.push(m[1])
  return out.join('\n')
}

function selectors(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = new Set()
  const re = /(^|\})([^{}@]+)\{/g
  let m
  while ((m = re.exec(css))) {
    const sel = m[2].trim()
    if (!sel || sel.startsWith('@')) continue
    sel.split(',').forEach((s) => {
      s = s.trim().replace(/\s+/g, ' ')
      if (s) out.add(s)
    })
  }
  return out
}

// Normalize Vue/Astro scoping pseudo-classes on both sides of the compare.
const norm = (css) =>
  css
    .replace(/:global\((\.dark)\)/g, '$1')
    .replace(/ ?:deep\(([^)]+)\)/g, ' $1')
    .replace(/ ?:global\(([^)]+)\)/g, ' $1')
    .replace(/\s+/g, ' ')

let shared = ''
for (const f of readdirSync('src/styles')) shared += readFileSync(join('src/styles', f), 'utf8')
shared += readFileSync('src/components/PageHero.astro', 'utf8')
shared += readFileSync('src/layouts/BaseLayout.astro', 'utf8')
for (const f of readdirSync('src/islands')) {
  shared += readFileSync(join('src/islands', f), 'utf8')
}
const sharedText = norm(shared)

let totalMissing = 0
let pagesOk = 0
let pagesChecked = 0

for (const v of views) {
  if (SKIPPED.has(v)) {
    console.log(`SKIP ${v} (edoxen-hosted)`)
    continue
  }
  const mapped = MAPPING[v]
  if (!mapped) {
    console.error(`UNMAPPED ${v} — add it to MAPPING or SKIPPED`)
    totalMissing += 1
    continue
  }
  pagesChecked += 1
  const legacy = readFileSync(join('src-legacy/src/views', v), 'utf8')
  const css = extractStyles(legacy)
  let astro = ''
  try {
    astro = readFileSync(join('src/pages', mapped), 'utf8')
  } catch {
    console.error(`MISSING ${v}: expected page src/pages/${mapped}`)
    totalMissing += 1
    continue
  }
  const astroCss = norm(astro)
  const missing = [...selectors(css)]
    .map((s) => s.replace(/ ?:deep\(([^)]+)\)/g, ' $1'))
    .filter((s) => {
      const variants = [s, s.replace(':global(.dark)', '.dark')]
      return !variants.some((x) => astroCss.includes(x) || sharedText.includes(x))
    })
  if (missing.length) {
    console.log(`FAIL ${mapped}: ${missing.length} missing selector(s)`)
    missing.forEach((s) => console.log(`     ${s}`))
    totalMissing += missing.length
  } else {
    console.log(`OK   ${mapped}`)
    pagesOk += 1
  }
}

console.log(`\n${pagesOk}/${pagesChecked} pages at full parity, ${totalMissing} missing selector(s)`)
process.exit(totalMissing === 0 ? 0 : 1)
