;(() => {
  function initResolutionsFilter() {
    const cards = document.querySelectorAll('.resolution-card')
    if (!cards.length) return

    const searchInput = document.getElementById('resolution-search')
    const yearSelect = document.getElementById('resolution-year-filter')
    const groupSelect = document.getElementById('resolution-group-filter')
    const typeSelect = document.getElementById('resolution-type-filter')
    const countEl = document.getElementById('resolution-count')

    if (!searchInput || !yearSelect || !groupSelect || !typeSelect || !countEl) return

    function filterCards() {
      const query = searchInput.value.toLowerCase().trim()
      const year = yearSelect.value
      const group = groupSelect.value
      const sourceType = typeSelect.value

      let visible = 0

      cards.forEach((card) => {
        const searchable = card.dataset.searchable || ''
        const cardYear = card.dataset.year || ''
        const cardGroup = card.dataset.group || ''
        const cardType = card.dataset.sourceType || ''

        let show = true

        if (show && query && !searchable.includes(query)) {
          show = false
        }

        if (show && year && cardYear !== year) {
          show = false
        }

        if (show && group && cardGroup !== group) {
          show = false
        }

        if (show && sourceType && cardType !== sourceType) {
          show = false
        }

        card.style.display = show ? '' : 'none'
        if (show) visible++
      })

      countEl.textContent = visible + ' resolution' + (visible !== 1 ? 's' : '')
    }

    searchInput.addEventListener('input', filterCards)
    yearSelect.addEventListener('change', filterCards)
    groupSelect.addEventListener('change', filterCards)
    typeSelect.addEventListener('change', filterCards)

    filterCards()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResolutionsFilter)
  } else {
    initResolutionsFilter()
  }
})()
