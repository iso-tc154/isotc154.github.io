import FlexSearch from 'flexsearch'

;(function () {
  'use strict'

  // ── Elements ────────────────────────────────────────────────
  const filterEl    = document.getElementById('std-filter')
  const searchInput = document.getElementById('std-search')
  const stageChips = document.getElementById('std-stage-chips')
  const statusChips = document.getElementById('std-status-chips')
  const countEl     = document.getElementById('std-count')
  const resultsEl   = document.getElementById('std-results')
  const dataEl      = document.getElementById('std-data-json')
  const stageLabel  = stageChips ? stageChips.closest('.std-filter__field').querySelector('.std-filter__label') : null
  const stLabel     = statusChips ? statusChips.closest('.std-filter__field').querySelector('.std-filter__label') : null

  if (!filterEl || filterEl.dataset.filterPage !== 'projects') return
  if (!searchInput || !stageChips || !statusChips || !countEl || !resultsEl || !dataEl) return

  // ── Stage label map ────────────────────────────────────────
  const STAGE_LABELS = {
    PWI: 'PWI', NP: 'NP', WD: 'WD', WDS: 'WDS',
    CD: 'CD', CDTS: 'CDTS', DIS: 'DIS', IS: 'IS',
    DTS: 'DTS', DTR: 'DTR', DAM: 'DAM', FDIS: 'FDIS', AWI: 'AWI'
  }

  // ── Data ─────────────────────────────────────────────────
  let data
  try {
    data = JSON.parse(dataEl.textContent)
  } catch (e) {
    resultsEl.innerHTML = '<p class="std-results__meta">Failed to load projects data.</p>'
    return
  }

  // ── State ─────────────────────────────────────────────────
  let activeStages   = new Set()
  let activeStatuses = new Set()
  let query          = ''

  // ── FlexSearch index ───────────────────────────────────────
  const index = new FlexSearch.Index({ tokenize: 'forward', resolution: 9 })
  data.forEach((d, i) => {
    index.add(i, [d.name, d.title, d.stage, STAGE_LABELS[d.stage] || d.stage, d.status].join(' '))
  })

  // ── URL persistence ────────────────────────────────────────
  function readParams() {
    const p = new URLSearchParams(window.location.search)
    if (p.get('q')) { query = p.get('q'); searchInput.value = query }
    if (p.get('stage')) { p.get('stage').split(',').forEach(s => activeStages.add(s)) }
    if (p.get('s')) { p.get('s').split(',').forEach(s => activeStatuses.add(s)) }
  }

  function writeParams() {
    const p = new URLSearchParams()
    if (query)           p.set('q', query)
    if (activeStages.size)  p.set('stage', [...activeStages].join(','))
    if (activeStatuses.size) p.set('s', [...activeStatuses].join(','))
    history.replaceState(null, '', p.toString()
      ? window.location.pathname + '?' + p
      : window.location.pathname)
  }

  // ── Chip sync ──────────────────────────────────────────────
  function syncChips() {
    stageChips.querySelectorAll('.std-chip').forEach(btn => {
      const s = btn.dataset.stage
      if (s === undefined) return
      if (!s) {
        btn.classList.toggle('is-active', activeStages.size === 0)
      } else {
        btn.classList.toggle('is-active', activeStages.has(s))
      }
    })
    statusChips.querySelectorAll('.std-chip').forEach(btn => {
      const s = btn.dataset.status
      if (s === undefined) return
      if (!s) {
        btn.classList.toggle('is-active', activeStatuses.size === 0)
      } else {
        btn.classList.toggle('is-active', activeStatuses.has(s))
      }
    })
    if (stageLabel) stageLabel.classList.toggle('is-active', activeStages.size > 0)
    if (stLabel) stLabel.classList.toggle('is-active', activeStatuses.size > 0)
  }

  // ── Render ─────────────────────────────────────────────────
  function render() {
    const filtering = query || activeStages.size > 0 || activeStatuses.size > 0
    writeParams()
    syncChips()

    // Derive matched indices from search query
    let matchedIdx = null
    if (query) {
      const raw = index.search(query, { limit: 500 })
      matchedIdx = new Set(raw)
      if (matchedIdx.size === 0 || query.length < 3) {
        matchedIdx = new Set()
        const q = query.toLowerCase()
        data.forEach((d, i) => {
          if ((d.name + ' ' + d.title).toLowerCase().includes(q)) {
            matchedIdx.add(i)
          }
        })
      }
    }

    // Filter data
    const visible = []
    data.forEach((d, i) => {
      const stageMatch   = activeStages.size === 0 || activeStages.has(d.stage)
      const statusMatch  = activeStatuses.size === 0 || activeStatuses.has(d.status)
      const queryMatch   = matchedIdx === null || matchedIdx.has(i)
      if (stageMatch && statusMatch && queryMatch) visible.push(d)
    })

    // Build HTML
    let html = ''

    // Meta bar
    html += `<div class="std-results__meta">`
    html += `<span>${visible.length} ${visible.length === 1 ? 'project' : 'projects'}${filtering ? ' of ' + data.length : ''}</span>`
    if (query) html += `<span class="std-results__query"> matching <strong>${escapeHtml(query)}</strong></span>`
    html += `</div>`

    // Cards
    visible.forEach(d => {
      const stageBadge = d.stage
        ? `<span class="std-results__badge">${STAGE_LABELS[d.stage] || d.stage}</span>`
        : ''
      const statusBadge = d.status === 'new'
        ? '<span class="std-badge--new">New Work</span>'
        : '<span class="std-badge--current">Current</span>'

      html += `
        <article class="std-results__card">
          <div class="std-results__name">
            <a href="/projects/${d.sid}/">${escapeHtml(d.name)}</a>
          </div>
          <p class="std-results__title">${escapeHtml(d.title)}</p>
          <div style="display:flex;gap:0.375rem;align-items:center;margin-top:auto">
            ${stageBadge}
            ${statusBadge}
          </div>
        </article>
      `
    })

    resultsEl.innerHTML = html
    countEl.textContent = `${visible.length} of ${data.length}`
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  // ── Event listeners ────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim()
    render()
  })

  stageChips.addEventListener('click', e => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    const s = btn.dataset.stage
    if (s === undefined) return
    if (!s || activeStages.has(s)) {
      activeStages.clear()
    } else {
      activeStages.clear()
      activeStages.add(s)
    }
    render()
  })

  statusChips.addEventListener('click', e => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    const s = btn.dataset.status
    if (s === undefined) return
    if (!s || activeStatuses.has(s)) {
      activeStatuses.clear()
    } else {
      activeStatuses.clear()
      activeStatuses.add(s)
    }
    render()
  })

  // ── Init ─────────────────────────────────────────────────
  readParams()
  syncChips()
  render()
})()
