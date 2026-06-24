<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlenaryAgenda } from '../types/event'
import { flattenSession } from '../domain/agenda'

const props = defineProps<{ agenda: PlenaryAgenda }>()
const openOpening = ref(false)
const openClosing = ref(false)

const draftDate = computed(() => {
  const src = props.agenda.source_doc ?? ''
  const m = src.match(/\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : null
})

const openingRows = computed(() => flattenSession(props.agenda.opening_session))
const closingRows = computed(() => flattenSession(props.agenda.closing_session))

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

function formatRange(isos?: string[]): string {
  if (!isos || isos.length === 0) return ''
  if (isos.length === 1) return formatDate(isos[0])
  return `${formatDate(isos[0])} – ${formatDate(isos[isos.length - 1])}`
}
</script>

<template>
  <div class="pa">
    <p v-if="agenda.structure" class="pa__structure">{{ agenda.structure }}</p>

    <p v-if="draftDate" class="pa__draft">Draft of {{ draftDate }}</p>

    <section class="pa__session-block">
      <button
        class="pa__toggle"
        :class="{ 'pa__toggle--open': openOpening }"
        :aria-expanded="openOpening"
        @click="openOpening = !openOpening"
      >
        <span class="pa__chev" aria-hidden="true">▸</span>
        <span class="pa__toggle-text">
          <span class="pa__toggle-label">
            {{ openOpening ? 'Hide opening session' : 'Show opening session' }}
          </span>
          <span class="pa__toggle-meta">
            {{ formatDate(agenda.opening_session?.date) }}<template v-if="openingRows.length"> · {{ openingRows.length }} items</template>
          </span>
        </span>
      </button>

      <div v-if="openOpening" class="pa__panel">
        <div class="pa__table-wrap">
          <table class="pa__table">
            <thead>
              <tr>
                <th scope="col" class="pa__th pa__th--seq">Seq</th>
                <th scope="col" class="pa__th pa__th--title">Title</th>
                <th scope="col" class="pa__th pa__th--resp">Responsible</th>
                <th scope="col" class="pa__th pa__th--ref">Ref.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in openingRows"
                :key="'o' + i"
                :class="{ 'pa__tr--sub': row.depth > 0 }"
              >
                <td class="pa__td pa__td--seq">{{ row.seq }}</td>
                <td
                  class="pa__td pa__td--title"
                  :style="{ paddingLeft: `${0.5 + row.depth * 1.125}rem` }"
                >{{ row.title }}</td>
                <td class="pa__td pa__td--resp">{{ row.responsible }}</td>
                <td class="pa__td pa__td--ref">{{ row.ref }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="agenda.wg_meetings" class="pa__wg">
      <h3 class="pa__session-title">
        (J)WG meetings
        <span class="pa__session-date">{{ formatRange(agenda.wg_meetings.dates) }}</span>
      </h3>
      <p v-if="agenda.wg_meetings.note" class="pa__wg-note">{{ agenda.wg_meetings.note }}</p>
    </section>

    <section class="pa__session-block">
      <button
        class="pa__toggle"
        :class="{ 'pa__toggle--open': openClosing }"
        :aria-expanded="openClosing"
        @click="openClosing = !openClosing"
      >
        <span class="pa__chev" aria-hidden="true">▸</span>
        <span class="pa__toggle-text">
          <span class="pa__toggle-label">
            {{ openClosing ? 'Hide closing session' : 'Show closing session' }}
          </span>
          <span class="pa__toggle-meta">
            {{ formatDate(agenda.closing_session?.date) }}<template v-if="closingRows.length"> · {{ closingRows.length }} items</template>
          </span>
        </span>
      </button>

      <div v-if="openClosing" class="pa__panel">
        <div class="pa__table-wrap">
          <table class="pa__table">
            <thead>
              <tr>
                <th scope="col" class="pa__th pa__th--seq">Seq</th>
                <th scope="col" class="pa__th pa__th--title">Title</th>
                <th scope="col" class="pa__th pa__th--resp">Responsible</th>
                <th scope="col" class="pa__th pa__th--ref">Ref.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in closingRows"
                :key="'c' + i"
                :class="{ 'pa__tr--sub': row.depth > 0 }"
              >
                <td class="pa__td pa__td--seq">{{ row.seq }}</td>
                <td
                  class="pa__td pa__td--title"
                  :style="{ paddingLeft: `${0.5 + row.depth * 1.125}rem` }"
                >{{ row.title }}</td>
                <td class="pa__td pa__td--resp">{{ row.responsible }}</td>
                <td class="pa__td pa__td--ref">{{ row.ref }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <p v-if="agenda.source_doc" class="pa__source">
      Source: {{ agenda.source_doc }}
    </p>
  </div>
</template>

<style scoped>
.pa {
  font-family: var(--font-sans);
  color: var(--color-slate-900, #1c1917);
}

/* ---- Collapsible trigger ---- */
.pa__toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin: 0;
  padding: 0.875rem 1rem;
  background: var(--color-slate-50, #f8f7f4);
  border: 1px solid var(--color-slate-200, #e7e5e4);
  border-radius: 0.25rem;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: background 120ms ease, border-color 120ms ease;
}
.pa__toggle:hover {
  background: var(--color-slate-100, #f4f4f3);
  border-color: var(--color-slate-300, #d6d3d1);
}
.dark .pa__toggle {
  background: var(--color-slate-800, #292524);
  border-color: var(--color-slate-700, #44403c);
}
.dark .pa__toggle:hover {
  background: var(--color-slate-700, #44403c);
  border-color: var(--color-slate-600, #57534e);
}
.pa__chev {
  font-size: 0.6875rem;
  color: var(--color-slate-500, #78716c);
  transition: transform 150ms ease;
  flex-shrink: 0;
}
.dark .pa__chev { color: var(--color-slate-400, #a8a29e); }
.pa__toggle--open .pa__chev { transform: rotate(90deg); }
.pa__toggle-text {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.625rem;
  min-width: 0;
  flex: 1;
}
.pa__toggle-label {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900, #1c1917);
  letter-spacing: -0.005em;
}
.dark .pa__toggle-label { color: var(--color-slate-100, #f4f4f3); }
.pa__toggle-meta {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-slate-500, #78716c);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dark .pa__toggle-meta { color: var(--color-slate-400, #a8a29e); }

/* ---- Hint shown when collapsed ---- */
.pa__hint {
  margin: 0.625rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-slate-500, #78716c);
  font-style: italic;
}
.dark .pa__hint { color: var(--color-slate-400, #a8a29e); }

/* ---- Expanded panel ---- */
.pa__panel {
  margin-top: 1rem;
}
.pa__structure {
  margin: 0 0 1.25rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-slate-600, #57534e);
  background: var(--color-slate-50, #f8f7f4);
  border-left: 2px solid var(--color-slate-300, #d6d3d1);
}
.dark .pa__structure {
  color: var(--color-slate-300, #d6d3d1);
  background: var(--color-slate-800, #292524);
  border-left-color: var(--color-slate-600, #57534e);
}

/* ---- Session sections ---- */
.pa__session + .pa__session { margin-top: 2rem; }
.pa__session-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  margin: 0 0 0.75rem;
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-slate-900, #1c1917);
  letter-spacing: -0.01em;
}
.dark .pa__session-title { color: var(--color-slate-100, #f4f4f3); }
.pa__session-date {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-slate-500, #78716c);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dark .pa__session-date { color: var(--color-slate-400, #a8a29e); }

/* ---- WG meetings note (between sessions) ---- */
.pa__wg {
  margin: 2rem 0;
  padding: 0.875rem 1rem;
  background: var(--color-slate-50, #f8f7f4);
  border-left: 2px solid var(--color-slate-300, #d6d3d1);
}
.dark .pa__wg {
  background: var(--color-slate-800, #292524);
  border-left-color: var(--color-slate-600, #57534e);
}
.pa__wg .pa__session-title { margin-bottom: 0.5rem; font-size: 0.9375rem; }
.pa__wg-note {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-slate-600, #57534e);
}
.dark .pa__wg-note { color: var(--color-slate-300, #d6d3d1); }

/* ---- Agenda table ---- */
.pa__table-wrap {
  overflow-x: auto;
  border-top: 1px solid var(--color-slate-200, #e7e5e4);
  border-bottom: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .pa__table-wrap {
  border-top-color: var(--color-slate-700, #44403c);
  border-bottom-color: var(--color-slate-700, #44403c);
}
.pa__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.pa__th {
  padding: 0.5rem;
  text-align: left;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500, #78716c);
  border-bottom: 1px solid var(--color-slate-300, #d6d3d1);
  vertical-align: bottom;
  white-space: nowrap;
}
.dark .pa__th {
  color: var(--color-slate-400, #a8a29e);
  border-bottom-color: var(--color-slate-600, #57534e);
}
.pa__th--seq { width: 3rem; text-align: right; padding-right: 0.75rem; }
.pa__th--title { width: auto; }
.pa__th--resp { width: 7.5rem; }
.pa__th--ref { width: 5.5rem; }

.pa__td {
  padding: 0.5625rem 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  vertical-align: top;
  border-bottom: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .pa__td { border-bottom-color: var(--color-slate-800, #292524); }
tr:last-child .pa__td { border-bottom: 0; }

.pa__td--seq {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-iso-red, #b91c1c);
  text-align: right;
  padding-right: 0.75rem;
  white-space: nowrap;
  font-feature-settings: 'lnum', 'tnum';
}
.pa__td--title {
  color: var(--color-slate-900, #1c1917);
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.dark .pa__td--title { color: var(--color-slate-100, #f4f4f3); }
.pa__td--resp {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-slate-600, #57534e);
}
.dark .pa__td--resp { color: var(--color-slate-300, #d6d3d1); }
.pa__td--ref {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-blue-accent, #1e3a8a);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.dark .pa__td--ref { color: var(--color-brand-soft, #94b6e8); }

.pa__tr--sub .pa__td--seq {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-slate-500, #78716c);
}
.dark .pa__tr--sub .pa__td--seq { color: var(--color-slate-400, #a8a29e); }
.pa__tr--sub .pa__td--title {
  color: var(--color-slate-700, #44403c);
  font-weight: 400;
}
.dark .pa__tr--sub .pa__td--title { color: var(--color-slate-300, #d6d3d1); }

.pa__source {
  margin: 1.25rem 0 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  color: var(--color-slate-400, #a8a29e);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dark .pa__source { color: var(--color-slate-500, #78716c); }

@media (max-width: 720px) {
  .pa__th, .pa__td { padding-left: 0.25rem; padding-right: 0.25rem; }
  .pa__th--seq, .pa__td--seq { width: 2.25rem; padding-right: 0.5rem; }
  .pa__th--resp, .pa__td--resp { width: 5.5rem; }
  .pa__th--ref, .pa__td--ref { width: 4rem; }
  .pa__td { font-size: 0.75rem; }
  .pa__td--resp { font-size: 0.6875rem; }
  .pa__td--ref { font-size: 0.625rem; }
  .pa__td--seq { font-size: 0.8125rem; }
}
</style>
