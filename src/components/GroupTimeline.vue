<script setup lang="ts">
import { computed } from 'vue'
import type { GroupLifecycleEvent } from '../types/group'
import { resolutionRefSearchPath } from '../utils/urn'
import { markerOf } from '../domain/lifecycleEvents'

const props = defineProps<{
  events: GroupLifecycleEvent[]
}>()

const sorted = computed(() =>
  [...props.events].sort((a, b) => String(a.date).localeCompare(String(b.date))),
)

function formatYear(date: string): string {
  return String(date || '').slice(0, 4)
}

function formatFullDate(date: string, precision?: string): string {
  if (!date) return ''
  const d = new Date(String(date).slice(0, 10) + 'T00:00:00.000Z')
  if (Number.isNaN(d.getTime())) return String(date)
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const day = d.getUTCDate()
  const year = d.getUTCFullYear()
  if (precision === 'year') return String(year)
  if (precision === 'month') return `${month} ${year}`
  return `${day} ${month} ${year}`
}

function successorUrl(event: GroupLifecycleEvent): string | null {
  return event.successor ? `/groups/${event.successor}/` : null
}

function predecessorUrl(event: GroupLifecycleEvent): string | null {
  return event.predecessor ? `/groups/${event.predecessor}/` : null
}
</script>

<template>
  <ol class="gtimeline" role="list">
    <li
      v-for="(ev, idx) in sorted"
      :key="`${ev.type}-${ev.date}-${idx}`"
      :class="['gtimeline__item', `gtimeline__item--${ev.type}`]"
    >
      <div class="gtimeline__rail" aria-hidden="true">
        <span class="gtimeline__node">{{ markerOf(ev.type).glyph }}</span>
        <span v-if="idx < sorted.length - 1" class="gtimeline__connector"></span>
      </div>

      <div class="gtimeline__card">
        <div class="gtimeline__meta">
          <span class="gtimeline__type">{{ markerOf(ev.type).label }}</span>
          <span class="gtimeline__date" :datetime="ev.date">
            <span class="gtimeline__year">{{ formatYear(ev.date) }}</span>
            <span class="gtimeline__fulldate">{{ formatFullDate(ev.date, ev.precision) }}</span>
          </span>
        </div>

        <h3 class="gtimeline__title">{{ ev.title }}</h3>

        <p v-if="ev.description" class="gtimeline__desc">{{ ev.description.trim() }}</p>

        <div class="gtimeline__refs">
          <a
            v-if="ev.resolution_ref"
            :href="resolutionRefSearchPath(ev.resolution_ref)"
            class="gtimeline__ref"
          >
            <span class="gtimeline__ref-label">Resolution</span>
            <span class="gtimeline__ref-id">{{ ev.resolution_ref }}</span>
            <span v-if="ev.resolution_meeting" class="gtimeline__ref-meeting">@ {{ ev.resolution_meeting }}</span>
          </a>

          <RouterLink
            v-if="successorUrl(ev)"
            :to="successorUrl(ev)!"
            class="gtimeline__lineage gtimeline__lineage--successor"
          >
            <span class="gtimeline__lineage-arrow">→</span>
            Succeeded by <strong>{{ ev.successor }}</strong>
          </RouterLink>

          <RouterLink
            v-if="predecessorUrl(ev)"
            :to="predecessorUrl(ev)!"
            class="gtimeline__lineage gtimeline__lineage--predecessor"
          >
            <span class="gtimeline__lineage-arrow">←</span>
            Succeeded <strong>{{ ev.predecessor }}</strong>
          </RouterLink>
        </div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.gtimeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.gtimeline__item {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: 0;
  align-items: stretch;
}

.gtimeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.875rem;
}

.gtimeline__node {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-blue-accent);
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 9999px;
  z-index: 1;
}
.dark .gtimeline__node {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-blue-accent);
}

.gtimeline__connector {
  flex: 1;
  width: 2px;
  margin-top: 0.25rem;
  background: var(--color-slate-200);
  min-height: 1.5rem;
}
.dark .gtimeline__connector { background: var(--color-slate-700); }

.gtimeline__card {
  padding: 0.75rem 0 1.75rem 1.25rem;
  border-left: 0;
}

.gtimeline__meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}
.gtimeline__type {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.dark .gtimeline__type { color: var(--color-slate-400); }

.gtimeline__date {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-slate-500);
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}
.gtimeline__year {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: 0.02em;
}
.dark .gtimeline__year { color: var(--color-slate-50); }
.gtimeline__fulldate {
  font-size: 0.75rem;
  color: var(--color-slate-500);
}

.gtimeline__title {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.4;
  margin: 0 0 0.375rem;
  color: var(--color-slate-900);
  letter-spacing: -0.005em;
}
.dark .gtimeline__title { color: var(--color-slate-50); }

.gtimeline__desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-slate-700);
  margin: 0 0 0.625rem;
}
.dark .gtimeline__desc { color: var(--color-slate-300); }

.gtimeline__refs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.gtimeline__ref {
  display: inline-flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.25rem;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}
.gtimeline__ref:hover {
  background: var(--color-slate-100);
  border-color: var(--color-blue-accent);
}
.dark .gtimeline__ref {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
}
.dark .gtimeline__ref:hover {
  background: var(--color-slate-700);
  border-color: var(--color-blue-accent);
}
.gtimeline__ref-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate-500);
  font-weight: 600;
}
.dark .gtimeline__ref-label { color: var(--color-slate-400); }
.gtimeline__ref-id {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--color-blue-accent);
  font-weight: 600;
}
.gtimeline__ref-meeting {
  font-size: 0.6875rem;
  color: var(--color-slate-500);
}
.dark .gtimeline__ref-meeting { color: var(--color-slate-400); }

.gtimeline__lineage {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  text-decoration: none;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.gtimeline__lineage--successor {
  background: rgba(30, 58, 138, 0.06);
  color: var(--color-blue-accent);
}
.gtimeline__lineage--successor:hover {
  background: rgba(30, 58, 138, 0.12);
  text-decoration: underline;
}
.gtimeline__lineage--predecessor {
  background: rgba(120, 113, 108, 0.08);
  color: var(--color-slate-700);
}
.gtimeline__lineage--predecessor:hover {
  background: rgba(120, 113, 108, 0.16);
  text-decoration: underline;
}
.dark .gtimeline__lineage--predecessor { color: var(--color-slate-300); }

.gtimeline__lineage-arrow {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  line-height: 1;
}

.gtimeline__item--dissolved .gtimeline__node {
  color: var(--color-slate-500);
  background: var(--color-slate-100);
}
.dark .gtimeline__item--dissolved .gtimeline__node {
  color: var(--color-slate-400);
  background: var(--color-slate-900);
}
.gtimeline__item--dissolved .gtimeline__title {
  color: var(--color-slate-600);
}
.dark .gtimeline__item--dissolved .gtimeline__title {
  color: var(--color-slate-400);
}

.gtimeline__item--convenor_appointed .gtimeline__node,
.gtimeline__item--convenor_extended .gtimeline__node {
  color: var(--color-amber-warm);
  border-color: rgba(180, 83, 9, 0.3);
  background: rgba(180, 83, 9, 0.05);
}
.dark .gtimeline__item--convenor_appointed .gtimeline__node,
.dark .gtimeline__item--convenor_extended .gtimeline__node {
  color: #d4a574;
  background: rgba(180, 83, 9, 0.15);
}

@media (max-width: 480px) {
  .gtimeline__item { grid-template-columns: 2rem 1fr; }
  .gtimeline__node { width: 2rem; height: 2rem; font-size: 1.25rem; }
  .gtimeline__card { padding-left: 0.875rem; }
}
</style>
