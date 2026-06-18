import FlexSearch from 'flexsearch'

;(function () {
  'use strict'

  // ── Elements ────────────────────────────────────────────────
  const filterEl     = document.getElementById('std-filter')
  const searchInput = document.getElementById('std-search')
  const wgChipsEl   = document.getElementById('std-wg-chips')
  const statusChips = document.getElementById('std-status-chips')
  const countEl     = document.getElementById('std-count')
  const resultsEl   = document.getElementById('std-results')
  const dataEl      = document.getElementById('std-data-json')
  const wgLabel     = document.querySelector('#std-wg-field .std-filter__label')
  const stLabel     = statusChips ? statusChips.closest('.std-filter__field').querySelector('.std-filter__label') : null

  if (!filterEl || filterEl.dataset.filterPage !== 'standards') return
  if (!searchInput || !wgChipsEl || !statusChips || !countEl || !resultsEl || !dataEl) return

  // ── Data ───────────────────────────────────────────────────
  let data
  try {
    data = JSON.parse(dataEl.textContent)
  } catch (e) {
    resultsEl.innerHTML = '<p class="std-results__meta">Failed to load standards data.</p>'
    return
  }

  // ── Config ─────────────────────────────────────────────────
  const WG_LABELS = {
    jwg1: 'JWG 1', wg2: 'WG 2', wg4: 'WG 4', wg5: 'WG 5',
    wg6: 'WG 6',   wg7: 'WG 7', jwg8: 'JWG 8', jwg9: 'JWG 9',
    iso7372ma: 'ISO 7372/MA'
  }

  // WG sort order
  const WG_ORDER = ['jwg1', 'wg2', 'wg4', 'wg5', 'wg6', 'wg7', 'jwg8', 'jwg9', 'iso7372ma']

  // ── State ──────────────────────────────────────────────────
  let activeWgs      = new Set()
  let activeStatuses = new Set()
  let query          = ''

  // ── Build WG chips dynamically ─────────────────────────────
  const wgsInData = new Set(data.map(d => d.wg).filter(Boolean))
  // Build "All" button first
  let chipsHtml = '<button class="std-chip is-active" data-wg="">All</button>'
  WG_ORDER.forEach(wg => {
    if (wgsInData.has(wg)) {
      chipsHtml += `<button class="std-chip" data-wg="${wg}">${WG_LABELS[wg] || wg}</button>`
    }
  })
  wgChipsEl.innerHTML = chipsHtml

  // ── FlexSearch index ───────────────────────────────────────
  const index = new FlexSearch.Index({ tokenize: 'forward', resolution: 9 })
  data.forEach((d, i) => {
    index.add(i, [d.name, d.title, d.wg, WG_LABELS[d.wg] || d.wg, d.type].join(' '))
  })

  // ── URL persistence ────────────────────────────────────────
  function readParams() {
    const p = new URLSearchParams(window.location.search)
    if (p.get('q'))  { query = p.get('q'); searchInput.value = query }
    if (p.get('wg')) {
      p.get('wg').split(',').forEach(w => activeWgs.add(w))
    }
    if (p.get('s')) {
      p.get('s').split(',').forEach(s => activeStatuses.add(s))
    }
  }

  function writeParams() {
    const p = new URLSearchParams()
    if (query)                    p.set('q',  query)
    if (activeWgs.size)           p.set('wg', [...activeWgs].join(','))
    if (activeStatuses.size)      p.set('s',  [...activeStatuses].join(','))
    history.replaceState(null, '', p.toString()
      ? window.location.pathname + '?' + p
      : window.location.pathname)
  }

  // ── Chip sync ──────────────────────────────────────────────
  function syncChips() {
    wgChipsEl.querySelectorAll('.std-chip').forEach(btn => {
      const wg = btn.dataset.wg
      if (!wg) {
        btn.classList.toggle('is-active', activeWgs.size === 0)
      } else {
        btn.classList.toggle('is-active', activeWgs.has(wg))
      }
    })
    statusChips.querySelectorAll('.std-chip').forEach(btn => {
      const s = btn.dataset.status
      if (!s) {
        btn.classList.toggle('is-active', activeStatuses.size === 0)
      } else {
        btn.classList.toggle('is-active', activeStatuses.has(s))
      }
    })
    if (wgLabel) wgLabel.classList.toggle('is-active', activeWgs.size > 0)
    if (stLabel) stLabel.classList.toggle('is-active', activeStatuses.size > 0)
  }

  // ── Render ─────────────────────────────────────────────────
  function render() {
    const filtering = query || activeWgs.size > 0 || activeStatuses.size > 0
    writeParams()
    syncChips()

    // Derive matched indices from search query
    let matchedIdx = null // null = no query filter
    if (query) {
      const raw = index.search(query, { limit: 500 })
      matchedIdx = new Set(raw)
      // Fallback substring for short queries
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
      const wgMatch     = activeWgs.size === 0 || activeWgs.has(d.wg)
      const statusMatch = activeStatuses.size === 0 || activeStatuses.has(d.status)
      const queryMatch  = matchedIdx === null || matchedIdx.has(i)
      if (wgMatch && statusMatch && queryMatch) visible.push(d)
    })

    // Build HTML
    let html = ''

    // Meta bar
    html += `<div class="std-results__meta">`
    html += `<span>${visible.length} ${visible.length === 1 ? 'standard' : 'standards'}${filtering ? ' of ' + data.length : ''}</span>`
    if (query) html += `<span class="std-results__query"> matching <strong>${escapeHtml(query)}</strong></span>`
    html += `</div>`

    // Cards
    visible.forEach(d => {
      const wgBadge = d.wg
        ? `<span class="std-results__badge">${WG_LABELS[d.wg] || d.wg}</span>`
        : ''
      const typeBadge = d.type
        ? `<span class="std-results__type">${escapeHtml(d.type)}</span>`
        : ''
      const withdrawnBadge = d.status === 'withdrawn'
        ? '<span class="std-badge--withdrawn">Withdrawn</span>'
        : ''
      const title = d.title
        ? `<p class="std-results__title">${escapeHtml(d.title)}</p>`
        : ''

      html += `
        <article class="std-results__card">
          <div class="std-results__name">
            <a href="/standards/${d.sid}/">${escapeHtml(d.name)}</a>
            ${typeBadge}
          </div>
          ${title}
          <div style="display:flex;gap:0.375rem;align-items:center;margin-top:auto">
            ${wgBadge}
            ${withdrawnBadge}
          </div>
        </article>
      `
    })

    resultsEl.innerHTML = html
    countEl.textContent = `${visible.length} of ${data.length}`
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  // ── Event listeners ────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim()
    render()
  })

  wgChipsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    const wg = btn.dataset.wg
    if (!wg) {
      activeWgs.clear()
    } else {
      if (activeWgs.has(wg)) activeWgs.delete(wg)
      else activeWgs.add(wg)
    }
    render()
  })

  statusChips.addEventListener('click', (e) => {
    const btn = e.target.closest('.std-chip')
    if (!btn) return
    const s = btn.dataset.status
    if (!s || activeStatuses.has(s)) {
      activeStatuses.clear()
    } else {
      activeStatuses.clear()
      activeStatuses.add(s)
    }
    render()
  })

  // ── Init ──────────────────────────────────────────────────
  readParams()
  syncChips()
  render()
})()
