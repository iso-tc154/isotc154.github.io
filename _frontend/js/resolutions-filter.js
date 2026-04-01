import FlexSearch from 'flexsearch'

;(function () {
  'use strict'

  const filterEl   = document.getElementById('std-filter')
  const searchWrap = document.getElementById('std-search')
  const countEl    = document.getElementById('std-count')
  const resultsEl  = document.getElementById('std-results')
  const dataEl     = document.getElementById('std-data-json')
  const sourceChips = document.getElementById('std-source-chips')
  const yearChipsEl = document.getElementById('std-year-chips')

  if (!filterEl || filterEl.dataset.filterPage !== 'resolutions') return
  if (!searchWrap || !countEl || !resultsEl || !dataEl) return

  let data
  try { data = JSON.parse(dataEl.textContent) } catch { return }
  if (!data.length) { resultsEl.innerHTML = '<p class="std-results__meta">No resolutions found.</p>'; return }

  const SOURCE_LABELS = { plenary: 'Plenary', ballot: 'Ballot', '7372ma': '7372 MA' }
  const GROUP_LABELS  = { jwg1: 'JWG 1', wg2: 'WG 2', wg3: 'WG 3', wg4: 'WG 4', wg5: 'WG 5', wg6: 'WG 6', wg7: 'WG 7', jwg8: 'JWG 8', jwg9: 'JWG 9', cag: 'CAG', '7372ma': '7372 MA', sg1: 'SG 1', ag1: 'AG 1' }

  // Build year chips dynamically
  const yearsInData = [...new Set(data.map(d => d.year).filter(Boolean))].sort().reverse()
  let yearChipsHtml = '<button class="std-chip is-active" data-year="">All</button>'
  yearsInData.forEach(y => { yearChipsHtml += `<button class="std-chip" data-year="${y}">${y}</button>` })
  yearChipsEl.innerHTML = yearChipsHtml

  // State
  let query = ''
  let activeSource = ''
  let activeYear = ''

  // FlexSearch
  const index = new FlexSearch.Index({ tokenize: 'forward', resolution: 9 })
  data.forEach((d, i) => {
    index.add(i, [d.id, d.title, d.group, GROUP_LABELS[d.group] || '', d.snippet, SOURCE_LABELS[d.source] || ''].join(' '))
  })

  // URL persistence
  function readParams () {
    const p = new URLSearchParams(window.location.search)
    if (p.get('q')) { query = p.get('q'); searchWrap.value = query }
    if (p.get('source')) activeSource = p.get('source')
    if (p.get('year')) activeYear = p.get('year')
  }

  function writeParams () {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (activeSource) p.set('source', activeSource)
    if (activeYear) p.set('year', activeYear)
    history.replaceState(null, '', p.toString() ? window.location.pathname + '?' + p : window.location.pathname)
  }

  function syncChips () {
    sourceChips.querySelectorAll('.std-chip').forEach(btn => {
      const s = btn.dataset.source
      btn.classList.toggle('is-active', s === activeSource || (!s && !activeSource))
    })
    yearChipsEl.querySelectorAll('.std-chip').forEach(btn => {
      const y = btn.dataset.year
      btn.classList.toggle('is-active', y === activeYear || (!y && !activeYear))
    })
  }

  function escapeHtml (s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function render () {
    const filtering = query || activeSource || activeYear
    writeParams()
    syncChips()

    let matchedIdx = null
    if (query) {
      const raw = index.search(query, { limit: 1000 })
      matchedIdx = new Set(raw)
      if (matchedIdx.size === 0 || query.length < 3) {
        matchedIdx = new Set()
        const q = query.toLowerCase()
        data.forEach((d, i) => {
          if ((d.id + ' ' + d.title + ' ' + d.snippet).toLowerCase().includes(q)) matchedIdx.add(i)
        })
      }
    }

    const visible = []
    data.forEach((d, i) => {
      const sourceMatch = !activeSource || d.source === activeSource
      const yearMatch   = !activeYear || d.year === activeYear
      const queryMatch  = matchedIdx === null || matchedIdx.has(i)
      if (sourceMatch && yearMatch && queryMatch) visible.push(d)
    })

    let html = ''
    html += `<div class="std-results__meta">`
    html += `<span>${visible.length} resolution${visible.length !== 1 ? 's' : ''}${filtering ? ' of ' + data.length : ''}</span>`
    if (query) html += `<span class="std-results__query"> matching <strong>${escapeHtml(query)}</strong></span>`
    html += `</div>`

    visible.forEach(d => {
      const srcBadge = d.source ? `<span class="std-results__type">${SOURCE_LABELS[d.source] || d.source}</span>` : ''
      const groupBadge = d.group ? `<span class="std-results__badge">${GROUP_LABELS[d.group] || d.group}</span>` : ''
      const yearBadge = d.year ? `<span class="std-results__badge">${d.year}</span>` : ''
      const snippet = d.snippet ? `<p class="std-results__title">${escapeHtml(d.snippet)}</p>` : ''

      html += `
        <a href="${d.url}" class="std-results__card">
          <div class="std-results__name">
            <span>${escapeHtml(d.id)}</span>
            ${srcBadge}
          </div>
          ${d.title ? `<p class="std-results__title" style="-webkit-line-clamp:3">${escapeHtml(d.title)}</p>` : ''}
          ${snippet}
          <div style="display:flex;gap:0.375rem;align-items:center;margin-top:auto">
            ${yearBadge}
            ${groupBadge}
          </div>
        </a>
      `
    })

    resultsEl.innerHTML = html
    countEl.textContent = `${visible.length} of ${data.length}`
  }

  // Events
  searchWrap.addEventListener('input', () => { query = searchWrap.value.trim(); render() })

  sourceChips.addEventListener('click', e => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    activeSource = btn.dataset.source || ''
    render()
  })

  yearChipsEl.addEventListener('click', e => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    activeYear = btn.dataset.year || ''
    render()
  })

  readParams()
  syncChips()
  render()
})()
