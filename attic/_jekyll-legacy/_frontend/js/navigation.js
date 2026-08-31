;(() => {
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle')
    const menu = document.getElementById('mobile-menu')
    if (!toggle || !menu) return

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('open')
      menu.classList.toggle('open')
      toggle.setAttribute('aria-expanded', String(!isOpen))
    })

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('open')
        toggle.setAttribute('aria-expanded', 'false')
      }
    })

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open')
        toggle.setAttribute('aria-expanded', 'false')
      }
    })
  }

  function highlightActiveNav() {
    const currentPath = window.location.pathname
    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const href = link.getAttribute('href')
      if (href && currentPath.startsWith(href) && href !== '/') {
        link.classList.add('active')
      } else if (href === '/' && currentPath === '/') {
        link.classList.add('active')
      }
    })
  }

  // Init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMobileMenu()
      highlightActiveNav()
    })
  } else {
    initMobileMenu()
    highlightActiveNav()
  }
})()
