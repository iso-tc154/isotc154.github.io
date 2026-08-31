<template>
  <div>
    <button
      id="mobile-menu-toggle"
      class="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-expanded="false"
      aria-controls="mobile-menu"
      aria-label="Toggle navigation menu"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path v-if="!isOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <div
      id="mobile-menu"
      :class="['md:hidden', isOpen ? 'open' : '']"
      class="overflow-hidden transition-all duration-300 max-h-0 data-[open]:max-h-96"
      :data-open="isOpen ? '' : undefined"
    >
      <nav class="py-4 space-y-1 border-t border-slate-200 dark:border-slate-700">
        <a
          v-for="item in navItems"
          :key="item.url"
          :href="item.url"
          data-nav-link
          class="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {{ item.title }}
        </a>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    navItems: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      isOpen: false,
    }
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    close() {
      this.isOpen = false
    },
  },
  mounted() {
    const toggleBtn = document.getElementById('mobile-menu-toggle')
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.toggle)
    }
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('mobile-menu')
      if (menu && !menu.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
        this.close()
      }
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close()
    })
  },
}
</script>
