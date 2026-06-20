<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHistory } from '../composables/useHistory'
import type { HistoryCategory, HistoryMilestone } from '../types/history'

const { history, isLoaded, loadData } = useHistory()

onMounted(() => { loadData() })

type FilterKey = 'all' | HistoryCategory

const selected = ref<FilterKey>('all')

const CATEGORY_META: Record<HistoryCategory, { label: string; color: string }> = {
  founding:    { label: 'Founding',        color: '#b91c1c' },
  leadership:  { label: 'Leadership',      color: '#1e3a8a' },
  meeting:     { label: 'Plenary meetings', color: '#b45309' },
  standard:    { label: 'Standards',       color: '#047857' },
  structure:   { label: 'Structure',       color: '#6d28d9' },
  liaison:     { label: 'Liaisons',        color: '#0f766e' },
  cooperation: { label: 'Cooperation',     color: '#9a3412' },
  withdrawn:   { label: 'Withdrawn',       color: '#78716c' },
}

const filterChips = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
  const counts = new Map<FilterKey, number>()
  counts.set('all', history.value.length)
  for (const h of history.value) {
    counts.set(h.category, (counts.get(h.category) ?? 0) + 1)
  }
  const out: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All milestones', count: counts.get('all') ?? 0 },
  ]
  for (const [cat, meta] of Object.entries(CATEGORY_META)) {
    const c = counts.get(cat as HistoryCategory) ?? 0
    if (c > 0) out.push({ key: cat as HistoryCategory, label: meta.label, count: c })
  }
  return out
})

const filtered = computed<HistoryMilestone[]>(() => {
  const list = selected.value === 'all'
    ? history.value
    : history.value.filter(h => h.category === selected.value)
  return [...list].sort((a, b) => a.date.localeCompare(b.date))
})

const decades = computed(() => {
  const groups = new Map<string, HistoryMilestone[]>()
  for (const h of filtered.value) {
    const yr = parseInt(h.date.slice(0, 4), 10)
    const decade = Math.floor(yr / 10) * 10
    const key = `${decade}s`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(h)
  }
  return Array.from(groups.entries()).map(([decade, items]) => ({ decade, items }))
})

const stats = computed(() => {
  const all = history.value
  const total = all.length
  const years = new Set(all.map(h => h.date.slice(0, 4))).size
  const meetings = all.filter(h => h.category === 'meeting').length
  const chairs = all.filter(h => h.category === 'leadership' && /becomes|Chair/.test(h.title)).length
  const standards = all.filter(h => h.category === 'standard').length
  const first = all.length ? all.reduce((min, h) => h.date < min ? h.date : min, all[0].date) : ''
  const last = all.length ? all.reduce((max, h) => h.date > max ? h.date : max, all[0].date) : ''
  return { total, years, meetings, chairs, standards, first, last }
})

function formatDate(h: HistoryMilestone): string {
  const d = h.date
  if (!d) return ''
  const [y, m, day] = d.split('-')
  if (h.date_precision === 'year' || !m || m === '00') return y
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mi = parseInt(m, 10) - 1
  if (h.date_precision === 'month' || !day || day === '00') return `${months[mi]} ${y}`
  return `${months[mi]} ${parseInt(day, 10)}, ${y}`
}

function categoryColor(cat: HistoryCategory): string {
  return CATEGORY_META[cat]?.color ?? '#78716c'
}

function resolutionUrl(h: HistoryMilestone): string | null {
  if (!h.resolution) return null
  const rid = h.resolution
  // Try to resolve to a resolution search URL
  return `/resolutions/?q=${encodeURIComponent(rid)}`
}

const progress = ref(0)
function onScroll() {
  const el = document.scrollingElement ?? document.documentElement
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(1, el.scrollTop / max) : 0
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
</script>

<template>
  <div class="page">
    <div class="progress" :style="{ '--p': (progress * 100).toFixed(1) + '%' }">
      <div class="progress__bar"></div>
    </div>

    <header class="hero">
      <div class="hero__bg" aria-hidden="true">
        <div class="hero__orbit"></div>
        <div class="hero__orbit hero__orbit--2"></div>
      </div>
      <p class="hero__eyebrow">ISO/TC 154 — since 1972</p>
      <h1 class="hero__title">
        Five decades of
        <span class="hero__title-accent">standardising trade data</span>
      </h1>
      <p class="hero__lead">
        A curated record of the committee's milestones — from its 1972 founding,
        through the EDIFACT era and the ISO 8601 split, to the present day.
      </p>
      <dl class="hero__stats">
        <div><dt>{{ stats.years }}</dt><dd>distinct years</dd></div>
        <div><dt>{{ stats.total }}</dt><dd>curated milestones</dd></div>
        <div><dt>{{ stats.meetings }}</dt><dd>plenary meetings</dd></div>
        <div><dt>{{ stats.standards }}</dt><dd>standards milestones</dd></div>
      </dl>
    </header>

    <nav class="chips" aria-label="Filter history by category">
      <button
        v-for="chip in filterChips"
        :key="chip.key"
        class="chip"
        :class="{ 'chip--active': selected === chip.key,
                  'chip--cat': chip.key !== 'all' }"
        :style="chip.key !== 'all' ? { '--cat-color': categoryColor(chip.key) } : {}"
        @click="selected = chip.key"
      >
        <span class="chip__dot" v-if="chip.key !== 'all'"></span>
        {{ chip.label }}
        <span class="chip__count">{{ chip.count }}</span>
      </button>
    </nav>

    <div v-if="!isLoaded" class="loading">Loading milestones…</div>

    <ol v-else class="timeline" role="list">
      <li v-for="group in decades" :key="group.decade" class="decade">
        <div class="decade__marker" :id="`decade-${group.decade}`">
          <span class="decade__numeral">{{ group.decade.slice(0, -1) }}</span>
          <span class="decade__suffix">s</span>
        </div>
        <ol class="decade__events" role="list">
          <li
            v-for="h in group.items"
            :key="`${h.date}-${h.title}`"
            class="event"
            :style="{ '--cat-color': categoryColor(h.category) }"
          >
            <div class="event__rail" aria-hidden="true">
              <span class="event__node"></span>
              <span class="event__stem"></span>
            </div>
            <article class="event__card">
              <header class="event__head">
                <time :datetime="h.date" class="event__date">{{ formatDate(h) }}</time>
                <span class="event__cat">{{ CATEGORY_META[h.category]?.label ?? h.category }}</span>
              </header>
              <a v-if="h.link" :href="h.link" class="event__title-link">
                <h3 class="event__title">{{ h.title }}</h3>
              </a>
              <h3 v-else class="event__title">{{ h.title }}</h3>
              <p v-if="h.description" class="event__desc">{{ h.description }}</p>
              <footer class="event__foot" v-if="h.link || h.resolution">
                <a v-if="h.link" :href="h.link" class="event__more">Explore →</a>
                <a v-if="resolutionUrl(h)" :href="resolutionUrl(h)!" class="event__res">
                  Resolution {{ h.resolution }}
                </a>
              </footer>
            </article>
          </li>
        </ol>
      </li>
    </ol>

    <aside v-if="isLoaded && decades.length" class="eras" aria-label="Jump to decade">
      <h4 class="eras__title">Eras</h4>
      <ul>
        <li v-for="group in decades" :key="group.decade">
          <a :href="`#decade-${group.decade}`" class="eras__link">
            <span class="eras__year">{{ group.decade }}</span>
            <span class="eras__count">{{ group.items.length }}</span>
          </a>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.page {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
  position: relative;
}

.progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 60;
  background: transparent;
  pointer-events: none;
}
.progress__bar {
  height: 100%;
  width: var(--p, 0%);
  background: linear-gradient(90deg, var(--color-iso-red), #fbbf24);
  transition: width 0.1s linear;
}

/* HERO */
.hero {
  position: relative;
  padding: 2rem 0 3rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .hero { border-bottom-color: #44403c; }
.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.hero__orbit, .hero__orbit--2 {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgb(185 28 28 / 0.12);
  filter: blur(0.5px);
}
.hero__orbit {
  width: 30rem;
  height: 30rem;
  right: -8rem;
  top: -10rem;
  border-color: rgb(185 28 28 / 0.18);
}
.hero__orbit--2 {
  width: 22rem;
  height: 22rem;
  right: -4rem;
  top: -6rem;
  border-color: rgb(30 58 138 / 0.15);
  border-style: dashed;
}
.dark .hero__orbit { border-color: rgb(252 165 165 / 0.15); }
.dark .hero__orbit--2 { border-color: rgb(148 182 232 / 0.15); }

.hero > *:not(.hero__bg) { position: relative; z-index: 1; }

.hero__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-iso-red);
  margin: 0 0 1rem;
  font-family: var(--font-sans);
}
.dark .hero__eyebrow { color: #f87171; }

.hero__title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: #1c1917;
  margin: 0 0 1.25rem;
  max-width: 32em;
}
.dark .hero__title { color: #fafaf9; }
.hero__title-accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-iso-red);
}
.dark .hero__title-accent { color: #f87171; }

.hero__lead {
  font-size: 1.0625rem;
  line-height: 1.65;
  color: #57534e;
  max-width: 42rem;
  margin: 0 0 2rem;
}
.dark .hero__lead { color: #d6d3d1; }

.hero__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 2rem;
  margin: 0;
  max-width: 42rem;
}
@media (min-width: 768px) { .hero__stats { grid-template-columns: repeat(4, 1fr); } }
.hero__stats > div { display: flex; flex-direction: column; gap: 0.125rem; }
.hero__stats dt {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: var(--color-iso-red);
  letter-spacing: -0.02em;
  line-height: 1;
}
.dark .hero__stats dt { color: #f87171; }
.hero__stats dd {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #78716c;
  font-weight: 600;
}
.dark .hero__stats dd { color: #a8a29e; }

/* CHIPS */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed #e7e5e4;
}
.dark .chips { border-bottom-color: #44403c; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #d6d3d1;
  background: #fff;
  color: #44403c;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--color-iso-red); color: var(--color-iso-red); }
.dark .chip { background: #1c1917; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: #f87171; color: #f87171; }
.chip--active { background: var(--color-iso-red); border-color: var(--color-iso-red); color: #fff; }
.chip--active:hover { color: #fff; }
.dark .chip--active { background: #b91c1c; border-color: #b91c1c; color: #fff; }

.chip--cat.chip--active {
  background: var(--cat-color, #b91c1c);
  border-color: var(--cat-color, #b91c1c);
}
.chip__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--cat-color, currentColor);
  display: inline-block;
}
.chip--active .chip__dot { background: #fff; }
.chip__count {
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgb(0 0 0 / 0.06);
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
}
.dark .chip__count { background: rgb(255 255 255 / 0.1); }
.chip--active .chip__count { background: rgb(255 255 255 / 0.2); color: #fff; }

/* TIMELINE */
.loading { padding: 4rem 0; text-align: center; color: #78716c; }
.dark .loading { color: #a8a29e; }

.timeline { list-style: none; margin: 0; padding: 0; }

.decade {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 3rem;
}
@media (min-width: 640px) {
  .decade { grid-template-columns: 6rem 1fr; gap: 1rem 2rem; }
}
@media (min-width: 768px) {
  .decade { grid-template-columns: 9rem 1fr; gap: 1rem 3rem; }
}

.decade__marker {
  align-self: start;
  font-family: var(--font-serif);
  font-weight: 700;
  color: #d6d3d1;
  line-height: 1;
  letter-spacing: -0.04em;
  display: flex;
  align-items: flex-start;
  user-select: none;
  padding: 0.5rem 0 0.25rem;
  border-bottom: 1px solid #e7e5e4;
  margin-bottom: 0.25rem;
}
.dark .decade__marker { color: #44403c; border-bottom-color: #292524; }
@media (min-width: 640px) {
  .decade__marker {
    position: sticky;
    top: 6rem;
    padding-top: 0.5rem;
    border-bottom: none;
    margin-bottom: 0;
  }
}
.decade__numeral {
  font-size: clamp(2.25rem, 12vw, 3rem);
  display: inline-block;
}
@media (min-width: 640px) {
  .decade__numeral { font-size: clamp(3rem, 6vw, 5rem); }
}
.decade__suffix {
  font-size: clamp(1rem, 4vw, 1.25rem);
  font-style: italic;
  color: var(--color-iso-red);
  margin-top: 0.375rem;
}
@media (min-width: 640px) {
  .decade__suffix { font-size: clamp(1.25rem, 2.4vw, 2rem); margin-top: 0.5rem; }
}
.dark .decade__suffix { color: #f87171; }

.decade__events {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid #e7e5e4;
  position: relative;
}
.dark .decade__events { border-left-color: #44403c; }

.event {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0 0 1.75rem 1.5rem;
}
@media (min-width: 640px) { .event { grid-template-columns: 1fr; } }

.event__rail {
  position: absolute;
  left: -1px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: none;
}
.event__node {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--cat-color, #b91c1c);
  border: 3px solid #fafaf9;
  margin-left: -0.5rem;
  margin-top: 0.375rem;
  box-shadow: 0 0 0 2px var(--cat-color, #b91c1c);
  z-index: 2;
  position: relative;
}
.dark .event__node { border-color: #1c1917; }
.event__stem {
  position: absolute;
  left: -0.5rem;
  top: 1.25rem;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, var(--cat-color, #b91c1c), transparent);
  opacity: 0.3;
}

.event__card {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-left: 3px solid var(--cat-color, #b91c1c);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.dark .event__card {
  background: rgb(15 23 42 / 0.45);
  border-color: #44403c;
  border-left-color: var(--cat-color, #b91c1c);
}
.event__card:hover {
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.07);
  transform: translateX(2px);
}

.event__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.event__date {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cat-color, #b91c1c);
}
.event__cat {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #78716c;
  background: #f5f5f4;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.1875rem;
}
.dark .event__cat { color: #a8a29e; background: #292524; }

.event__title-link { text-decoration: none; color: inherit; }
.event__title {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.5rem;
  line-height: 1.3;
  letter-spacing: -0.012em;
}
.dark .event__title { color: #fafaf9; }
.event__title-link:hover .event__title { color: var(--cat-color, #b91c1c); }

.event__desc {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #44403c;
  margin: 0;
  white-space: pre-wrap;
}
.dark .event__desc { color: #d6d3d1; }

.event__foot {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}
.event__more, .event__res {
  text-decoration: none;
  font-weight: 600;
  color: var(--cat-color, #b91c1c);
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
.event__more:hover, .event__res:hover { border-bottom-color: currentColor; }
.event__res {
  color: #57534e;
}
.dark .event__res { color: #a8a29e; }

/* ERAS (right-rail nav) */
.eras {
  position: fixed;
  right: 1.5rem;
  bottom: 6rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  padding: 0.75rem 0.875rem;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.06);
  font-size: 0.75rem;
  z-index: 50;
  display: none;
}
.dark .eras { background: #1c1917; border-color: #44403c; }
@media (min-width: 1024px) { .eras { display: block; } }
.eras__title {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #78716c;
  margin: 0 0 0.5rem;
}
.dark .eras__title { color: #a8a29e; }
.eras ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.eras__link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0;
  text-decoration: none;
  color: #1c1917;
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
.eras__link:hover { border-bottom-color: var(--color-iso-red); color: var(--color-iso-red); }
.dark .eras__link { color: #fafaf9; }
.dark .eras__link:hover { color: #f87171; border-bottom-color: #f87171; }
.eras__count {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  color: #a8a29e;
  font-weight: 700;
  background: #f5f5f4;
  padding: 0.0625rem 0.3125rem;
  border-radius: 9999px;
}
.dark .eras__count { background: #292524; }
</style>
