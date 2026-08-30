// Deep list-filter module: one controller behind every filterable list page
// (standards, members, groups, liaisons, national bodies, projects, history,
// meetings). The interface is config-driven selectors; the per-page contract:
//
//   items       — any element; hidden/shown by the controller
//   data-haystack on items — lowercase search text
//   data-{facet} on items  — '|'- or space-separated facet values
//   chips in [data-facet] wrappers — one active chip per group (data-value)
//
// Facet matching is list-contains: an item passes a facet when its
// data-{facet} attribute contains the chip's value (empty value = all).
// Sections (decades, current/former groups) auto-hide when none of their
// items are visible.

export interface ListFilterConfig {
  searchInput: string
  items: string
  /** Chip groups: elements with [data-facet] containing .chip[data-value] children */
  facetWrappers?: string
  count?: string
  countLabel?: string
  empty?: string
  clear?: string
  /** Wrappers hidden when all their items are hidden */
  sections?: string
  initialFromUrl?: boolean
}

export function mountListFilter(cfg: ListFilterConfig): void {
  const search = document.querySelector<HTMLInputElement>(cfg.searchInput)
  const items = Array.from(document.querySelectorAll<HTMLElement>(cfg.items))
  const count = cfg.count ? document.querySelector<HTMLElement>(cfg.count) : null
  const empty = cfg.empty ? document.querySelector<HTMLElement>(cfg.empty) : null
  const clear = cfg.clear ? document.querySelector<HTMLElement>(cfg.clear) : null
  const sections = cfg.sections
    ? Array.from(document.querySelectorAll<HTMLElement>(cfg.sections))
    : []
  const wrappers = cfg.facetWrappers
    ? Array.from(document.querySelectorAll<HTMLElement>(cfg.facetWrappers))
    : []

  const total = items.length
  const active: Record<string, string> = {}

  function facetPasses(item: HTMLElement): boolean {
    for (const [facet, value] of Object.entries(active)) {
      if (!value) continue
      const attr = item.dataset[facet] ?? ''
      const values = attr.split(/[| ]+/).filter(Boolean)
      if (!values.includes(value)) return false
    }
    return true
  }

  function apply(): void {
    const q = (search?.value ?? '').trim().toLowerCase()
    let visible = 0
    for (const item of items) {
      const ok = (!q || (item.dataset.haystack ?? '').includes(q)) && facetPasses(item)
      item.style.display = ok ? '' : 'none'
      if (ok) visible++
    }
    for (const section of sections) {
      const anyVisible = items.some(
        (item) => item.style.display !== 'none' && section.contains(item),
      )
      section.style.display = anyVisible ? '' : 'none'
    }
    if (count) count.textContent = `${visible} of ${total}${cfg.countLabel ? ` ${cfg.countLabel}` : ''}`
    if (empty) empty.hidden = visible !== 0
  }

  function resetChips(): void {
    for (const wrap of wrappers) {
      const facet = wrap.dataset.facet ?? ''
      active[facet] = ''
      wrap.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
        chip.classList.toggle('chip--active', (chip.dataset.value ?? '') === '')
      })
    }
  }

  for (const wrap of wrappers) {
    const facet = wrap.dataset.facet ?? ''
    active[facet] = ''
    wrap.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
      if ((chip.dataset.value ?? '') === '') chip.classList.add('chip--active')
      chip.addEventListener('click', () => {
        wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'))
        chip.classList.add('chip--active')
        active[facet] = chip.dataset.value ?? ''
        apply()
      })
    })
  }

  search?.addEventListener('input', apply)
  clear?.addEventListener('click', () => {
    if (search) search.value = ''
    resetChips()
    apply()
  })

  if (cfg.initialFromUrl) {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q && search) {
      search.value = q
    }
  }
  apply()
}
