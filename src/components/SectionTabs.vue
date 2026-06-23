<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { SubnavSection } from '../types/group'

const props = defineProps<{
  sections: SubnavSection[]
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const navRef = ref<HTMLElement | null>(null)

function activate(id: string) {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
  if (typeof window !== 'undefined' && typeof history !== 'undefined') {
    history.replaceState(null, '', `#${id}`)
  }
}

function syncFromHash() {
  if (typeof window === 'undefined') return
  const hash = window.location.hash.replace(/^#/, '')
  if (hash && props.sections.some((s) => s.id === hash) && hash !== props.modelValue) {
    emit('update:modelValue', hash)
  }
}

function scrollToPanel(id: string) {
  if (typeof window === 'undefined') return
  nextTick(() => {
    const panel = document.getElementById(id)
    if (!panel) return
    const siteHeaderHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--site-header-height'),
    ) || 67
    const navHeight = navRef.value?.getBoundingClientRect().height ?? 60
    const targetTop = panel.getBoundingClientRect().top + window.scrollY - siteHeaderHeight - navHeight - 16
    if (Math.abs(window.scrollY - targetTop) < 4) return
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
  })
}

function onKeydown(e: KeyboardEvent) {
  if (!props.sections.length) return
  const idx = props.sections.findIndex((s) => s.id === props.modelValue)
  if (idx === -1) return
  let next = -1
  switch (e.key) {
    case 'ArrowRight': next = (idx + 1) % props.sections.length; break
    case 'ArrowLeft':  next = (idx - 1 + props.sections.length) % props.sections.length; break
    case 'Home':       next = 0; break
    case 'End':        next = props.sections.length - 1; break
    default: return
  }
  e.preventDefault()
  const target = props.sections[next].id
  activate(target)
  document.getElementById(`tab-${target}`)?.focus()
}

onMounted(() => {
  syncFromHash()
  window.addEventListener('hashchange', syncFromHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncFromHash)
})

watch(
  () => props.sections,
  (secs) => {
    if (secs.length && !secs.some((s) => s.id === props.modelValue)) {
      emit('update:modelValue', secs[0].id)
    }
  },
)

watch(
  () => props.modelValue,
  (id) => {
    scrollToPanel(id)
  },
)
</script>

<template>
  <nav ref="navRef" class="tabs" aria-label="Section navigation">
    <div class="tabs__inner" role="tablist" @keydown="onKeydown">
      <button
        v-for="(s, idx) in sections"
        :key="s.id"
        :id="`tab-${s.id}`"
        type="button"
        role="tab"
        :aria-selected="modelValue === s.id"
        :tabindex="modelValue === s.id ? 0 : -1"
        :aria-controls="s.id"
        :class="['tabs__tab', { 'tabs__tab--active': modelValue === s.id }]"
        @click="activate(s.id)"
      >
        <span class="tabs__index" aria-hidden="true">{{ String(idx + 1).padStart(2, '0') }}</span>
        <span class="tabs__label">{{ s.label }}</span>
        <span class="tabs__rule" aria-hidden="true"></span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabs {
  position: sticky;
  top: var(--site-header-height, 4.1875rem);
  z-index: 30;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid var(--color-slate-200);
}
.dark .tabs {
  background: rgba(15, 23, 42, 0.9);
  border-bottom-color: var(--color-slate-700);
}

.tabs__inner {
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
.tabs__inner::-webkit-scrollbar { display: none; }

.tabs__tab {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  padding: 1.125rem 0;
  margin-right: 2.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  font-family: inherit;
  transition: opacity 0.15s;
}
.tabs__tab:last-child { margin-right: 0; }
.tabs__tab:focus-visible {
  outline: 2px solid var(--color-blue-accent, #1e3a8a);
  outline-offset: 4px;
  border-radius: 0.125rem;
}

.tabs__index {
  font-family: var(--font-serif, serif);
  font-size: 0.875rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-slate-400, #a8a29e);
  transition: color 0.2s;
  min-width: 1.25rem;
}
.dark .tabs__index { color: var(--color-slate-500, #78716c); }

.tabs__label {
  font-family: var(--font-sans, system-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-slate-500, #78716c);
  transition: color 0.2s;
}
.dark .tabs__label { color: var(--color-slate-400, #a8a29e); }

.tabs__tab:hover .tabs__label {
  color: var(--color-slate-900, #1c1917);
}
.dark .tabs__tab:hover .tabs__label {
  color: var(--color-slate-50, #f8fafc);
}

.tabs__tab--active .tabs__index,
.tabs__tab--active .tabs__label {
  color: var(--color-blue-accent, #1e3a8a);
}
.dark .tabs__tab--active .tabs__index,
.dark .tabs__tab--active .tabs__label {
  color: var(--color-blue-accent, #94b6e8);
}
.tabs__tab--active .tabs__label { font-weight: 700; }

.tabs__rule {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-blue-accent, #1e3a8a);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.tabs__tab--active .tabs__rule { transform: scaleX(1); }
.dark .tabs__rule { background: var(--color-blue-accent, #94b6e8); }

@media (max-width: 640px) {
  .tabs__tab { margin-right: 1.5rem; padding: 1rem 0; gap: 0.5rem; }
  .tabs__label { font-size: 0.75rem; letter-spacing: 0.12em; }
  .tabs__index { font-size: 0.8125rem; min-width: 1.125rem; }
}
</style>
