<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { SubnavSection } from '../types/group'

const props = defineProps<{
  sections: SubnavSection[]
}>()

const activeId = ref<string>('')
const navRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const navHeight = navRef.value?.offsetHeight ?? 0
  const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16
  window.scrollTo({ top, behavior: 'smooth' })
}

function handleClick(id: string, e: Event) {
  e.preventDefault()
  scrollToSection(id)
}

function setupObserver() {
  if (observer) observer.disconnect()
  if (!props.sections.length) return

  const navHeight = navRef.value?.offsetHeight ?? 60
  const visibleMap = new Map<string, number>()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visibleMap.set(entry.target.id, entry.intersectionRatio)
      }
      let bestId = ''
      let bestRatio = 0
      for (const [id, ratio] of visibleMap) {
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestId = id
        }
      }
      if (bestId) activeId.value = bestId
    },
    {
      rootMargin: `-${navHeight + 16}px 0px -60% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  )

  for (const s of props.sections) {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  }
}

onMounted(() => {
  nextTick(setupObserver)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

watch(
  () => props.sections,
  () => nextTick(setupObserver),
  { deep: true },
)
</script>

<template>
  <nav ref="navRef" class="subnav" aria-label="Section navigation">
    <div class="subnav__inner">
      <a
        v-for="s in sections"
        :key="s.id"
        :href="`#${s.id}`"
        :class="['subnav__link', { 'subnav__link--active': activeId === s.id }]"
        :aria-current="activeId === s.id ? 'true' : undefined"
        @click="handleClick(s.id, $event)"
      >
        <span class="subnav__label">{{ s.label }}</span>
        <span class="subnav__rule" aria-hidden="true"></span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.subnav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .subnav {
  background: rgba(15, 23, 42, 0.88);
  border-bottom-color: var(--color-slate-700, #334155);
}

.subnav__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.subnav__inner::-webkit-scrollbar {
  display: none;
}

.subnav__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0;
  margin-right: 1.75rem;
  text-decoration: none;
  position: relative;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.subnav__link:last-child { margin-right: 0; }

.subnav__label {
  font-family: var(--font-sans, system-ui);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500, #78716c);
  transition: color 0.2s;
}
.dark .subnav__label { color: var(--color-slate-400, #a8a29e); }

.subnav__link:hover .subnav__label {
  color: var(--color-slate-900, #1c1917);
}
.dark .subnav__link:hover .subnav__label {
  color: var(--color-slate-50, #f8fafc);
}

.subnav__link--active .subnav__label {
  color: var(--color-blue-accent, #1e3a8a);
}
.dark .subnav__link--active .subnav__label {
  color: var(--color-blue-accent, #5379bf);
}

.subnav__rule {
  display: block;
  width: 100%;
  height: 2px;
  background: transparent;
  border-radius: 2px;
  transform: scaleX(0.4);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s, background 0.2s;
}
.subnav__link:hover .subnav__rule {
  opacity: 0.3;
  background: var(--color-slate-400, #a8a29e);
  transform: scaleX(0.6);
}
.subnav__link--active .subnav__rule {
  opacity: 1;
  background: var(--color-blue-accent, #1e3a8a);
  transform: scaleX(1);
}
.dark .subnav__link--active .subnav__rule {
  background: var(--color-blue-accent, #5379bf);
}

@media (max-width: 640px) {
  .subnav__link { margin-right: 1.25rem; }
  .subnav__label { font-size: 0.625rem; }
}
</style>
