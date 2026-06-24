<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import type { AgendaSession, AgendaItem } from '../types/event'

const props = defineProps<{
  session: AgendaSession | null
  label: string
  draftDate?: string | null
  sourceDoc?: string
}>()

const emit = defineEmits<{ close: [] }>()

const isOpen = computed(() => props.session !== null)

interface FlatRow {
  seq: string
  title: string
  responsible: string
  ref: string
  depth: number
}

function parseLeadingSeq(title: string): { seq: string; title: string } {
  const m = title.match(/^(\d+(?:\.\d+)*)\s+(.+)$/)
  if (m) return { seq: m[1], title: m[2] }
  return { seq: '', title }
}

function cleanResponsible(s?: string): string {
  return s ? s.replace(/_/g, ' ') : ''
}

function flatten(items: AgendaItem[] | undefined, depth: number, out: FlatRow[]): void {
  if (!items) return
  for (const item of items) {
    const parsed = parseLeadingSeq(item.title)
    const seq = item.number != null ? String(item.number) : parsed.seq
    const title = item.number != null ? item.title : parsed.title
    out.push({
      seq,
      title,
      responsible: cleanResponsible(item.speaker),
      ref: item.n_doc ?? '',
      depth,
    })
    if (item.subitems?.length) {
      flatten(item.subitems, depth + 1, out)
    }
  }
}

const rows = computed(() => {
  if (!props.session) return []
  const out: FlatRow[] = []
  flatten(props.session.items, 0, out)
  return out
})

function formatDate(value: unknown): string {
  if (!value) return ''
  const iso = typeof value === 'string' ? value : String(value)
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function close() {
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) close()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ad">
      <div v-if="isOpen && session" class="ad">
        <div class="ad__backdrop" @click="close" />
        <aside
          class="ad__panel"
          role="dialog"
          :aria-label="`${label} agenda`"
          aria-modal="true"
        >
          <header class="ad__header">
            <div class="ad__title-block">
              <p class="ad__eyebrow">{{ label }}</p>
              <h3 class="ad__date">{{ formatDate(session.date) }}</h3>
              <p v-if="draftDate" class="ad__draft">Draft of {{ draftDate }}</p>
            </div>
            <button class="ad__close" @click="close" aria-label="Close agenda">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>

          <p v-if="session.note" class="ad__note">{{ session.note }}</p>

          <div class="ad__body">
            <div class="ad__table-wrap">
              <table class="ad__table">
                <thead>
                  <tr>
                    <th scope="col" class="ad__th ad__th--seq">Seq</th>
                    <th scope="col" class="ad__th ad__th--title">Title</th>
                    <th scope="col" class="ad__th ad__th--resp">Responsible</th>
                    <th scope="col" class="ad__th ad__th--ref">Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, i) in rows"
                    :key="i"
                    :class="{ 'ad__tr--sub': row.depth > 0 }"
                  >
                    <td class="ad__td ad__td--seq">{{ row.seq }}</td>
                    <td
                      class="ad__td ad__td--title"
                      :style="{ paddingLeft: `${0.5 + row.depth * 1.125}rem` }"
                    >{{ row.title }}</td>
                    <td class="ad__td ad__td--resp">{{ row.responsible }}</td>
                    <td class="ad__td ad__td--ref">{{ row.ref }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <footer v-if="sourceDoc" class="ad__footer">
            Source: {{ sourceDoc }}
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ad {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.ad__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(2px);
}

.ad__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(34rem, 92vw);
  background: #ffffff;
  box-shadow: -8px 0 32px rgb(0 0 0 / 0.18);
  display: flex;
  flex-direction: column;
}
.dark .ad__panel {
  background: #1c1917;
  box-shadow: -8px 0 32px rgb(0 0 0 / 0.5);
}

.ad__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #e7e5e4;
  flex-shrink: 0;
}
.dark .ad__header { border-bottom-color: #292524; }

.ad__title-block { min-width: 0; }

.ad__eyebrow {
  margin: 0 0 0.25rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-iso-red, #b91c1c);
}
.ad__date {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: #1c1917;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.dark .ad__date { color: #fafaf9; }
.ad__draft {
  margin: 0.25rem 0 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #78716c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dark .ad__draft { color: #a8a29e; }

.ad__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: #78716c;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.ad__close:hover {
  background: #f5f5f4;
  color: #1c1917;
}
.dark .ad__close { color: #a8a29e; }
.dark .ad__close:hover {
  background: #292524;
  color: #fafaf9;
}

.ad__note {
  margin: 0;
  padding: 0.625rem 1.5rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: #57534e;
  background: #fafaf9;
  border-bottom: 1px solid #e7e5e4;
  flex-shrink: 0;
}
.dark .ad__note {
  color: #d6d3d1;
  background: #292524;
  border-bottom-color: #44403c;
}

.ad__body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.ad__table-wrap {
  border-top: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
}
.dark .ad__table-wrap {
  border-top-color: #44403c;
  border-bottom-color: #44403c;
}

.ad__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.ad__th {
  padding: 0.5rem 0.625rem;
  text-align: left;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #78716c;
  border-bottom: 1px solid #d6d3d1;
  vertical-align: bottom;
  white-space: nowrap;
}
.dark .ad__th {
  color: #a8a29e;
  border-bottom-color: #57534e;
}
.ad__th--seq { width: 3rem; text-align: right; padding-right: 0.75rem; }
.ad__th--title { width: auto; }
.ad__th--resp { width: 7.5rem; }
.ad__th--ref { width: 5.5rem; }

.ad__td {
  padding: 0.5625rem 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  vertical-align: top;
  border-bottom: 1px solid #e7e5e4;
}
.dark .ad__td { border-bottom-color: #292524; }
tr:last-child .ad__td { border-bottom: 0; }

.ad__td--seq {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-iso-red, #b91c1c);
  text-align: right;
  padding-right: 0.75rem;
  white-space: nowrap;
  font-feature-settings: 'lnum', 'tnum';
}
.ad__td--title {
  color: #1c1917;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.dark .ad__td--title { color: #fafaf9; }
.ad__td--resp {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: #57534e;
}
.dark .ad__td--resp { color: #d6d3d1; }
.ad__td--ref {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-blue-accent, #1e3a8a);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.dark .ad__td--ref { color: var(--color-brand-soft, #94b6e8); }

.ad__tr--sub .ad__td--seq {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #78716c;
}
.dark .ad__tr--sub .ad__td--seq { color: #a8a29e; }
.ad__tr--sub .ad__td--title {
  color: #44403c;
  font-weight: 400;
}
.dark .ad__tr--sub .ad__td--title { color: #d6d3d1; }

.ad__footer {
  flex-shrink: 0;
  padding: 0.625rem 1.5rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-top: 1px solid #e7e5e4;
}
.dark .ad__footer {
  color: #78716c;
  border-top-color: #292524;
}

.ad-enter-active,
.ad-leave-active {
  transition: opacity 200ms ease;
}
.ad-enter-active .ad__panel,
.ad-leave-active .ad__panel {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ad-enter-from,
.ad-leave-to {
  opacity: 0;
}
.ad-enter-from .ad__panel,
.ad-leave-to .ad__panel {
  transform: translateX(100%);
}

@media (max-width: 720px) {
  .ad__th, .ad__td { padding-left: 0.375rem; padding-right: 0.375rem; }
  .ad__th--seq, .ad__td--seq { width: 2.5rem; padding-right: 0.5rem; }
  .ad__th--resp, .ad__td--resp { width: 5.5rem; }
  .ad__th--ref, .ad__td--ref { width: 4rem; }
  .ad__td { font-size: 0.75rem; }
  .ad__td--resp { font-size: 0.6875rem; }
  .ad__td--ref { font-size: 0.625rem; }
  .ad__td--seq { font-size: 0.8125rem; }
  .ad__header { padding: 1rem 1.125rem 0.875rem; }
  .ad__date { font-size: 1.0625rem; }
}

@media (prefers-reduced-motion: reduce) {
  .ad-enter-active,
  .ad-leave-active,
  .ad-enter-active .ad__panel,
  .ad-leave-active .ad__panel {
    transition: none;
  }
}
</style>
