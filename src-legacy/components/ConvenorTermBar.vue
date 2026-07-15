<script setup lang="ts">
import { computed } from 'vue'
import type { ConvenorTerm } from '../types/group'
import { memberPath, resolutionRefSearchPath } from '../utils/urn'

const props = defineProps<{
  terms: ConvenorTerm[]
  predecessorTerms?: ConvenorTerm[]
  predecessorName?: string
  seats?: { label: string; member_ids: string[] }[]
}>()

const TODAY = new Date().toISOString().slice(0, 10)

const seatByMember = computed<Map<string, string>>(() => {
  const m = new Map<string, string>()
  for (const seat of props.seats ?? []) {
    for (const id of seat.member_ids) {
      m.set(id, seat.label)
    }
  }
  return m
})

function seatLabels(term: ConvenorTerm): string[] {
  if (term.seat?.length) return term.seat
  const fromGroup = seatByMember.value.get(term.member_id)
  return fromGroup ? [fromGroup] : []
}

const allFroms = computed(() =>
  [...(props.terms ?? []), ...(props.predecessorTerms ?? [])]
    .map((t) => t.from)
    .filter(Boolean),
)
const axisStart = computed(() => {
  if (!allFroms.value.length) return TODAY
  return allFroms.value.reduce((min, d) => (d < min ? d : min))
})
const axisEnd = computed(() => {
  const tos = [...(props.terms ?? []), ...(props.predecessorTerms ?? [])]
    .map((t) => t.to)
    .filter(Boolean) as string[]
  const maxTo = tos.length ? tos.reduce((max, d) => (d > max ? d : max)) : ''
  return maxTo > TODAY ? maxTo : TODAY
})

const axisSpanDays = computed(() =>
  Math.max(1, daysBetween(axisStart.value, axisEnd.value)),
)

function daysBetween(a: string, b: string): number {
  const ma = Date.parse(String(a).slice(0, 10) + 'T00:00:00.000Z')
  const mb = Date.parse(String(b).slice(0, 10) + 'T00:00:00.000Z')
  if (Number.isNaN(ma) || Number.isNaN(mb)) return 0
  return Math.round((mb - ma) / 86400000)
}

function barLeft(from: string): number {
  const offset = daysBetween(axisStart.value, from)
  return Math.max(0, Math.min(100, (offset / axisSpanDays.value) * 100))
}
function barWidth(from: string, to: string | null): number {
  const end = to ?? axisEnd.value
  const span = daysBetween(from, end)
  return Math.max(2, Math.min(100 - barLeft(from), (span / axisSpanDays.value) * 100))
}

const ticks = computed(() => {
  const startYear = parseInt(axisStart.value.slice(0, 4), 10)
  const endYear = parseInt(axisEnd.value.slice(0, 4), 10)
  if (Number.isNaN(startYear) || Number.isNaN(endYear)) return []
  const span = endYear - startYear
  let step = 1
  if (span > 20) step = 5
  else if (span > 10) step = 2
  const out: { year: number; left: number }[] = []
  const firstTick = Math.ceil(startYear / step) * step
  for (let y = firstTick; y <= endYear; y += step) {
    const dateStr = `${y}-01-01`
    out.push({ year: y, left: barLeft(dateStr) })
  }
  return out
})

function formatYear(date: string | null): string {
  if (!date) return ''
  return String(date).slice(0, 4)
}

function formatRange(from: string, to: string | null): string {
  const f = formatYear(from)
  if (!to) return `${f} – present`
  return `${f} – ${formatYear(to)}`
}

function memberUrl(id: string): string {
  return memberPath(id)
}

const hasPredecessorTerms = computed(() => (props.predecessorTerms?.length ?? 0) > 0)
</script>

<template>
  <div class="cterms">
    <div class="cterms__axis" aria-hidden="true">
      <span
        v-for="tick in ticks"
        :key="tick.year"
        class="cterms__tick"
        :style="{ left: `${tick.left}%` }"
      >
        <span class="cterms__tick-line"></span>
        <span class="cterms__tick-label">{{ tick.year }}</span>
      </span>
    </div>

    <div v-if="hasPredecessorTerms" class="cterms__predecessor-group">
      <div class="cterms__predecessor-label">
        <span class="cterms__predecessor-prefix">Predecessor</span>
        <span v-if="predecessorName" class="cterms__predecessor-name">{{ predecessorName }}</span>
      </div>
      <div class="cterms__rows">
        <div
          v-for="(term, idx) in predecessorTerms"
          :key="`pred-${idx}`"
          class="cterms__row cterms__row--predecessor"
        >
          <div class="cterms__row-axis" aria-hidden="true"></div>
          <a
            :href="memberUrl(term.member_id)"
            class="cterms__bar cterms__bar--predecessor"
            :style="{
              left: barLeft(term.from) + '%',
              width: barWidth(term.from, term.to) + '%',
            }"
          >
            <span class="cterms__bar-name">{{ term.name }}</span>
            <span class="cterms__bar-years">{{ formatRange(term.from, term.to) }}</span>
          </a>
        </div>
      </div>
      <div class="cterms__divider" role="separator"></div>
    </div>

    <div class="cterms__rows">
      <div
        v-for="(term, idx) in terms"
        :key="`term-${idx}`"
        class="cterms__row"
      >
        <div class="cterms__row-axis" aria-hidden="true"></div>
        <a
          :href="memberUrl(term.member_id)"
          :class="['cterms__bar', { 'cterms__bar--current': term.current }]"
          :style="{
            left: barLeft(term.from) + '%',
            width: barWidth(term.from, term.to) + '%',
          }"
        >
          <span v-if="seatLabels(term).length" class="cterms__bar-seats">
            <span
              v-for="seat in seatLabels(term)"
              :key="seat"
              class="cterms__bar-seat"
              :class="`cterms__bar-seat--${seat.toLowerCase()}`"
            >{{ seat }}</span>
          </span>
          <span class="cterms__bar-name">{{ term.name }}</span>
          <span class="cterms__bar-years">{{ formatRange(term.from, term.to) }}</span>
          <a
            v-if="term.resolution_ref"
            :href="resolutionRefSearchPath(term.resolution_ref)"
            class="cterms__bar-res"
            @click.stop
          >{{ term.resolution_ref }}</a>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cterms {
  position: relative;
  padding: 1rem 0 0.5rem;
}

.cterms__axis {
  position: relative;
  height: 1.5rem;
  margin-left: 0;
  border-bottom: 1px solid var(--color-slate-200);
}
.dark .cterms__axis { border-bottom-color: var(--color-slate-700); }

.cterms__tick {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: none;
}
.cterms__tick-line {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 0.375rem;
  background: var(--color-slate-300);
}
.dark .cterms__tick-line { background: var(--color-slate-600); }
.cterms__tick-label {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--color-slate-500);
  letter-spacing: 0.02em;
}
.dark .cterms__tick-label { color: var(--color-slate-400); }

.cterms__predecessor-group {
  margin-bottom: 0.75rem;
}
.cterms__predecessor-label {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  padding-left: 0.125rem;
}
.cterms__predecessor-prefix {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.cterms__predecessor-name {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-style: italic;
  color: var(--color-slate-700);
}
.dark .cterms__predecessor-name { color: var(--color-slate-300); }

.cterms__divider {
  height: 1px;
  margin: 0.5rem 0 0.75rem;
  background: repeating-linear-gradient(
    to right,
    var(--color-slate-300) 0,
    var(--color-slate-300) 4px,
    transparent 4px,
    transparent 8px
  );
}
.dark .cterms__divider { background: repeating-linear-gradient(
    to right,
    var(--color-slate-600) 0,
    var(--color-slate-600) 4px,
    transparent 4px,
    transparent 8px
  );
}

.cterms__rows {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  position: relative;
}

.cterms__row {
  position: relative;
  height: 2.25rem;
}

.cterms__row-axis {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-slate-100);
}
.dark .cterms__row-axis { background: var(--color-slate-800); }

.cterms__bar {
  position: absolute;
  top: 0;
  height: 2.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.0625rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-brand-fill);
  color: #fff;
  border-radius: 0.25rem;
  text-decoration: none;
  overflow: hidden;
  transition: filter 0.15s, transform 0.15s;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.cterms__bar:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
.dark .cterms__bar {
  background: rgba(148, 182, 232, 0.85);
  color: var(--color-slate-950);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.cterms__bar--current {
  background: linear-gradient(
    to right,
    var(--color-brand-fill) 0%,
    var(--color-brand-fill) 70%,
    var(--color-brand-soft) 100%
  );
  position: relative;
}
.cterms__bar--current::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -0.375rem;
  transform: translateY(-50%);
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-brand-soft);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  animation: pulse 2.4s ease-in-out infinite;
}
.dark .cterms__bar--current {
  background: linear-gradient(
    to right,
    rgba(148, 182, 232, 0.85) 0%,
    rgba(148, 182, 232, 0.85) 70%,
    rgba(148, 182, 232, 1) 100%
  );
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.1); }
}

.cterms__bar--predecessor {
  background: repeating-linear-gradient(
    -45deg,
    var(--color-slate-400) 0,
    var(--color-slate-400) 6px,
    var(--color-slate-500) 6px,
    var(--color-slate-500) 12px
  );
  color: #fff;
  opacity: 0.7;
}
.dark .cterms__bar--predecessor {
  background: repeating-linear-gradient(
    -45deg,
    var(--color-slate-600) 0,
    var(--color-slate-600) 6px,
    var(--color-slate-500) 6px,
    var(--color-slate-500) 12px
  );
}

.cterms__bar-name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cterms__bar-seats {
  display: flex;
  gap: 0.1875rem;
  margin-bottom: 0.125rem;
}

.cterms__bar-seat {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.125rem;
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
  line-height: 1.3;
}
.cterms__bar-seat--iso {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.cterms__bar-seat--unece {
  background: rgba(252, 211, 77, 0.35);
  color: #fffbeb;
  border: 1px solid rgba(252, 211, 77, 0.5);
}
.dark .cterms__bar-seat--unece {
  background: rgba(252, 211, 77, 0.25);
  color: #fde68a;
  border-color: rgba(252, 211, 77, 0.4);
}
.cterms__bar-years {
  font-size: 0.6875rem;
  opacity: 0.85;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.01em;
}
.cterms__bar-res {
  position: absolute;
  top: 0.1875rem;
  right: 0.375rem;
  font-size: 0.5625rem;
  padding: 0.0625rem 0.3125rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.125rem;
  color: inherit !important;
  text-decoration: none;
  font-family: ui-monospace, monospace;
}
.cterms__bar-res:hover { background: rgba(255, 255, 255, 0.35); }

@media (max-width: 640px) {
  .cterms__row { height: 1.875rem; }
  .cterms__bar { height: 1.875rem; padding: 0.1875rem 0.5rem; }
  .cterms__bar-name { font-size: 0.75rem; }
  .cterms__bar-years { font-size: 0.625rem; }
  .cterms__bar-res { display: none; }
}
</style>
