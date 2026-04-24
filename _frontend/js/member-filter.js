;(() => {
  function initMemberFilter() {
    const cards = document.querySelectorAll('.member-card')
    if (!cards.length) return

    const searchInput = document.getElementById('member-search')
    const groupChips = document.getElementById('member-group-chips')
    const roleChips = document.getElementById('member-role-chips')
    const pastToggle = document.getElementById('member-past-toggle')
    const countEl = document.getElementById('member-count')
    const groupLabel = document.querySelector('#member-group-field .std-filter__label')
    const roleLabel = document.querySelector('#member-role-chips')?.closest('.std-filter__field')?.querySelector('.std-filter__label')

    if (!searchInput || !groupChips || !roleChips || !pastToggle || !countEl) return

    // ── State ──────────────────────────────────────────────
    let activeGroup = ''
    let activeRole = ''
    let query = ''

    // ── URL persistence ────────────────────────────────────
    function readParams() {
      const p = new URLSearchParams(window.location.search)
      if (p.get('q')) { query = p.get('q'); searchInput.value = query }
      if (p.get('group')) { activeGroup = p.get('group') }
      if (p.get('role')) { activeRole = p.get('role') }
      if (p.get('past') === '1') { pastToggle.checked = true }
    }

    function writeParams() {
      const p = new URLSearchParams()
      if (query) p.set('q', query)
      if (activeGroup) p.set('group', activeGroup)
      if (activeRole) p.set('role', activeRole)
      if (pastToggle.checked) p.set('past', '1')
      history.replaceState(null, '', p.toString()
        ? window.location.pathname + '?' + p
        : window.location.pathname)
    }

    // ── Chip sync ──────────────────────────────────────────
    function syncChips() {
      groupChips.querySelectorAll('.std-chip').forEach(btn => {
        const g = btn.dataset.group
        if (g === undefined) return
        if (!g) {
          btn.classList.toggle('is-active', !activeGroup)
        } else {
          btn.classList.toggle('is-active', activeGroup === g)
        }
      })
      roleChips.querySelectorAll('.std-chip').forEach(btn => {
        const r = btn.dataset.role
        if (r === undefined) return
        if (!r) {
          btn.classList.toggle('is-active', !activeRole)
        } else {
          btn.classList.toggle('is-active', activeRole === r)
        }
      })
      if (groupLabel) groupLabel.classList.toggle('is-active', !!activeGroup)
      if (roleLabel) roleLabel.classList.toggle('is-active', !!activeRole)
    }

    // ── Filter ─────────────────────────────────────────────
    function filterCards() {
      const q = query.toLowerCase()
      const showPast = pastToggle.checked
      let visible = 0

      cards.forEach(card => {
        const name = card.dataset.name || ''
        const affiliation = card.dataset.affiliation || ''
        const groups = card.dataset.groups || ''
        const roles = card.dataset.roles || ''
        const status = card.dataset.status || ''
        const isPast = status === 'past'

        let show = true

        if (isPast && !showPast && !activeGroup) show = false

        // When a group is selected, show past members of that group too
        if (isPast && !showPast && activeGroup) {
          if (!groups.split(',').includes(activeGroup)) show = false
        }

        if (show && q) {
          if (!(name + ' ' + affiliation).includes(q)) show = false
        }

        if (show && activeGroup) {
          if (!groups.split(',').includes(activeGroup)) show = false
        }

        if (show && activeRole) {
          if (!roles.split(',').includes(activeRole)) show = false
        }

        card.style.display = show ? '' : 'none'
        if (show) visible++
      })

      countEl.textContent = visible + ' of ' + cards.length
    }

    function render() {
      writeParams()
      syncChips()
      filterCards()
    }

    // ── Event listeners ────────────────────────────────────
    searchInput.addEventListener('input', () => {
      query = searchInput.value.trim()
      render()
    })

    groupChips.addEventListener('click', e => {
      const btn = e.target.closest('.std-chip')
      if (!btn) return
      const g = btn.dataset.group
      if (g === undefined) return
      activeGroup = g || ''
      render()
    })

    roleChips.addEventListener('click', e => {
      const btn = e.target.closest('.std-chip')
      if (!btn) return
      const r = btn.dataset.role
      if (r === undefined) return
      activeRole = r || ''
      render()
    })

    pastToggle.addEventListener('change', () => {
      render()
    })

    // ── Init ───────────────────────────────────────────────
    readParams()
    syncChips()
    filterCards()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMemberFilter)
  } else {
    initMemberFilter()
  }
})()
