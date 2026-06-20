<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { mainNav } from './data/navigation'
import { committee } from './data/committee'
import { useTheme } from './composables/useTheme'
import { useSeo } from './composables/useSeo'

const { isDark, toggle: toggleTheme } = useTheme()
useSeo()
const isMobileMenuOpen = ref(false)
const openSections = ref<Set<string>>(new Set())
const showScrollTop = ref(false)
const scrollPercent = ref(0)
const route = useRoute()

function toggleSection(path: string) {
  const next = new Set(openSections.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  openSections.value = next
}

function sectionContains(item: { to: string; children?: { to: string }[] }, path: string): boolean {
  if (path === item.to) return true
  return item.children?.some((c) => path === c.to || path.startsWith(c.to)) ?? false
}

watch(
  () => route.path,
  (path) => {
    if (!isMobileMenuOpen.value) {
      const next = new Set<string>()
      for (const item of mainNav) {
        if (item.children?.length && sectionContains(item, path)) next.add(item.to)
      }
      openSections.value = next
    }
    isMobileMenuOpen.value = false
  },
  { immediate: true },
)

function handleScroll() {
  showScrollTop.value = window.scrollY > 500
  const docElement = document.documentElement
  const bodyElement = document.body
  const scrollTop = docElement.scrollTop || bodyElement.scrollTop
  const scrollHeight = docElement.scrollHeight || bodyElement.scrollHeight
  const clientHeight = docElement.clientHeight
  const height = scrollHeight - clientHeight
  scrollPercent.value = height > 0 ? (scrollTop / height) * 100 : 0
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="scroll-progress" :style="{ '--progress': scrollPercent + '%' }"></div>
  <div class="site-brand-bar" aria-hidden="true"></div>

  <header id="nav-header" class="site-header">
    <div class="site-header__inner">
      <RouterLink to="/" class="site-header__logo">
        <img src="/assets/iso-red.svg" alt="ISO" />
        <span class="site-header__logo-text">
          {{ committee.name }}
          <span class="site-header__logo-subtitle">{{ committee.tagline }}</span>
        </span>
      </RouterLink>

      <nav class="site-header__nav" aria-label="Primary">
        <template v-for="item in mainNav" :key="item.to">
          <div v-if="item.children?.length" class="site-header__nav-group">
            <RouterLink :to="item.to" class="site-header__nav-link">
              {{ item.label }}
              <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L2 4h8z"/></svg>
            </RouterLink>
            <div class="site-header__dropdown">
              <div class="site-header__dropdown-inner">
                <RouterLink
                  v-for="child in item.children"
                  :key="child.to"
                  :to="child.to"
                  class="site-header__dropdown-item"
                >{{ child.label }}</RouterLink>
              </div>
            </div>
          </div>
          <RouterLink v-else :to="item.to" class="site-header__nav-link">{{ item.label }}</RouterLink>
        </template>
      </nav>

      <div class="site-header__actions">
        <button @click="toggleTheme" type="button" class="site-header__icon-btn" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <svg v-if="!isDark" class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        <button @click="isMobileMenuOpen = !isMobileMenuOpen" type="button" class="site-header__icon-btn site-header__icon-btn--mobile" aria-label="Menu">
          <svg v-if="!isMobileMenuOpen" class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <svg v-else class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <div v-show="isMobileMenuOpen" class="mobile-menu" :class="{ 'mobile-menu--open': isMobileMenuOpen }">
      <template v-for="item in mainNav" :key="item.to">
        <div v-if="item.children?.length" class="mobile-menu__group">
          <button
            type="button"
            class="mobile-menu__toggle"
            :class="{ 'mobile-menu__toggle--open': openSections.has(item.to) }"
            :aria-expanded="openSections.has(item.to)"
            @click="toggleSection(item.to)"
          >
            <span>{{ item.label }}</span>
            <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L2 4h8z"/></svg>
          </button>
          <div v-show="openSections.has(item.to)" class="mobile-menu__sub">
            <RouterLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="mobile-menu__link mobile-menu__link--sub"
              @click="isMobileMenuOpen = false"
            >{{ child.label }}</RouterLink>
          </div>
        </div>
        <RouterLink
          v-else
          :to="item.to"
          class="mobile-menu__link"
          @click="isMobileMenuOpen = false"
        >{{ item.label }}</RouterLink>
      </template>
      <span class="mobile-menu__section-title">External Links</span>
      <a :href="committee.links.isoCommittee" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">ISO Committee</a>
      <a :href="committee.links.linkedin" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">LinkedIn</a>
      <a :href="committee.links.github" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">GitHub</a>
    </div>
  </header>

  <main class="site-main">
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="route.fullPath" />
    </RouterView>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <RouterLink to="/" class="site-footer__logo">
            <img src="/assets/iso-red.svg" alt="ISO" />
            <span class="site-footer__logo-text">{{ committee.name }}</span>
          </RouterLink>
          <p class="site-footer__tagline">{{ committee.tagline }}</p>
          <p class="site-footer__tagline">{{ committee.scope }}</p>
        </div>

        <div>
          <h4 class="site-footer__heading">Committee</h4>
          <ul class="site-footer__facts">
            <li><strong>Secretariat:</strong> {{ committee.secretariat }}</li>
            <li><strong>Chair:</strong> {{ committee.chair }}</li>
            <li><strong>Established:</strong> {{ committee.established }}</li>
            <li><strong>Standards:</strong> {{ committee.publishedStandards }} published</li>
            <li><strong>Members:</strong> {{ committee.participatingMembers }} (P), {{ committee.observingMembers }} (O)</li>
          </ul>
        </div>

        <div>
          <h4 class="site-footer__heading">Explore</h4>
          <ul class="site-footer__links">
            <li><RouterLink to="/standards/" class="site-footer__link">Standards</RouterLink></li>
            <li><RouterLink to="/members/" class="site-footer__link">Members</RouterLink></li>
            <li><RouterLink to="/meetings/" class="site-footer__link">Meetings</RouterLink></li>
            <li><RouterLink to="/resolutions/" class="site-footer__link">Resolutions</RouterLink></li>
            <li><RouterLink to="/posts/" class="site-footer__link">News</RouterLink></li>
          </ul>
        </div>

        <div>
          <h4 class="site-footer__heading">Links</h4>
          <ul class="site-footer__links">
            <li><a :href="committee.links.iso" class="site-footer__link" target="_blank" rel="noopener noreferrer">ISO.org</a></li>
            <li><a :href="committee.links.isoCommittee" class="site-footer__link" target="_blank" rel="noopener noreferrer">ISO.org Committee Page</a></li>
            <li><a :href="committee.links.committeeSite" class="site-footer__link" target="_blank" rel="noopener noreferrer">Committee Site</a></li>
            <li class="site-footer__social">
              <a :href="committee.links.linkedin" target="_blank" rel="noopener noreferrer" class="site-footer__icon-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a :href="committee.links.github" target="_blank" rel="noopener noreferrer" class="site-footer__icon-link" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <p class="site-footer__copy">&copy; {{ new Date().getFullYear() }} {{ committee.name }}</p>
      </div>
    </div>
  </footer>

  <button
    class="scroll-to-top"
    :class="{ 'scroll-to-top--visible': showScrollTop }"
    @click="scrollToTop"
    aria-label="Scroll to top"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  </button>
</template>

<style>
.scroll-progress {
  position: fixed;
  top: 0; left: 0;
  width: var(--progress);
  height: 3px;
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  z-index: 100;
  transition: width 0.1s linear;
}
.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: var(--color-blue-accent);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 97, 173, 0.4), 0 4px 6px -2px rgba(0, 97, 173, 0.2);
  z-index: 50;
}
.scroll-to-top--visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.scroll-to-top:hover {
  background-color: #172554;
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 97, 173, 0.5), 0 10px 10px -5px rgba(0, 97, 173, 0.2);
}
.scroll-to-top svg { width: 1.5rem; height: 1.5rem; }
</style>
