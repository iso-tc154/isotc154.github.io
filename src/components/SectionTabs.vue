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
    const navHeight = navRef.value?.getBoundingClientRect().height ?? 60
    const top = panel.getBoundingClientRect().top + window.scrollY - navHeight - 8
    if (Math.abs(window.scrollY - top) < 4) return
    window.scrollTo({ top, behavior: 'smooth' })
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
        v-for="s in sections"
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
        <span class="tabs__label">{{ s.label }}</span>
        <span class="tabs__rule" aria-hidden="true"></span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabs {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .tabs {
  background: rgba(15, 23, 42, 0.88);
  border-bottom-color: var(--color-slate-700, #334155);
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
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0;
  margin-right: 1.75rem;
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
  outline-offset: 2px;
  border-radius: 0.125rem;
}

.tabs__label {
  font-family: var(--font-sans, system-ui);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500, #78716c);
  transition: color 0.2s;
}
.dark .tabs__label { color: var(--color-slate-400, #a8a29e); }

.tabs__tab:hover .tabs__label { color: var(--color-slate-900, #1c1917); }
.dark .tabs__tab:hover .tabs__label { color: var(--color-slate-50, #f8fafc); }

.tabs__tab--active .tabs__label { color: var(--color-blue-accent, #1e3a8a); }
.dark .tabs__tab--active .tabs__label { color: var(--color-blue-accent, #5379bf); }

.tabs__rule {
  display: block;
  width: 100%;
  height: 2px;
  background: transparent;
  border-radius: 2px;
  transform: scaleX(0.4);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s, background 0.2s;
}
.tabs__tab:hover .tabs__rule {
  opacity: 0.3;
  background: var(--color-slate-400, #a8a29e);
  transform: scaleX(0.6);
}
.tabs__tab--active .tabs__rule {
  opacity: 1;
  background: var(--color-blue-accent, #1e3a8a);
  transform: scaleX(1);
}
.dark .tabs__tab--active .tabs__rule {
  background: var(--color-blue-accent, #5379bf);
}

@media (max-width: 640px) {
  .tabs__tab { margin-right: 1.25rem; }
  .tabs__label { font-size: 0.625rem; }
}
</style>
