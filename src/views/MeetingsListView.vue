<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetings } from '../composables/useMeetings'
import { committee } from '../data/committee'
import { useCountUp } from '../composables/useCountUp'
import type { Meeting } from '../types/meeting'
import PageHero from '../components/PageHero.vue'
import { ordinalSuffix } from '../utils/ordinal'

const router = useRouter()
const { meetings, isLoaded, loadData } = useMeetings()

const searchQuery = ref('')
const selectedDecade = ref<number | null>(null)
const selectedType = ref<'all' | 'face-to-face' | 'hybrid' | 'virtual'>('all')
const selectedStatus = ref<'all' | 'upcoming' | 'concluded' | 'cancelled'>('all')

onMounted(async () => { await loadData() })

const loaded = computed(() => isLoaded.value && meetings.value.length > 0)

const totalMeetings = computed(() => meetings.value.length)
const totalResolutions = computed(() =>
  meetings.value.reduce((acc, m) => acc + (m.resolution_count || 0), 0),
)
const totalCountries = computed(() => {
  const set = new Set<string>()
  for (const m of meetings.value) {
    for (const s of m.sessions) {
      if (s.country) set.add(s.country)
    }
  }
  return set.size
})
const firstYear = computed(() => {
  const years = meetings.value.map(m => m.year).filter((y): y is number => y != null)
  return years.length ? Math.min(...years) : null
})

const animMeetings = useCountUp(totalMeetings, loaded, 1600)
const animResolutions = useCountUp(totalResolutions, loaded, 1600)
const animCountries = useCountUp(totalCountries, loaded, 1600)
const firstYearDisplay = computed(() => firstYear.value ?? 1972)

const availableDecades = computed(() => {
  const set = new Set<number>()
  for (const m of meetings.value) {
    if (m.year) set.add(Math.floor(m.year / 10) * 10)
  }
  return Array.from(set).sort((a, b) => b - a)
})

function decadeLabel(d: number): string {
  return `${d}s`
}

function isUpcoming(m: Meeting): boolean {
  return m.status_label !== 'Concluded' && m.status_label !== 'Cancelled'
}

const filtered = computed<Meeting[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return meetings.value.filter(m => {
    if (selectedDecade.value !== null && m.year) {
      const d = Math.floor(m.year / 10) * 10
      if (d !== selectedDecade.value) return false
    }
    if (selectedType.value !== 'all') {
      const types = new Set(m.sessions.map(s => s.type))
      // a meeting "matches" if any session is the selected type
      if (!types.has(selectedType.value)) return false
    }
    if (selectedStatus.value !== 'all') {
      if (selectedStatus.value === 'upcoming' && !isUpcoming(m)) return false
      if (selectedStatus.value === 'concluded' && m.status_label !== 'Concluded') return false
      if (selectedStatus.value === 'cancelled' && m.status_label !== 'Cancelled') return false
    }
    if (q) {
      const hay = [
        String(m.ordinal),
        m.year ? String(m.year) : '',
        m.location_label,
        ...m.sessions.map(s => [s.country, s.city, s.virtual_address].filter(Boolean).join(' ')),
      ].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

interface DecadeGroup {
  decade: number
  label: string
  meetings: Meeting[]
  resolutionCount: number
}

const upcomingMeetings = computed<Meeting[]>(() =>
  filtered.value
    .filter(m => isUpcoming(m))
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
)

const pastFiltered = computed<Meeting[]>(() =>
  filtered.value.filter(m => !isUpcoming(m)),
)

const grouped = computed<DecadeGroup[]>(() => {
  const map = new Map<number, Meeting[]>()
  for (const m of pastFiltered.value) {
    if (!m.year) continue
    const d = Math.floor(m.year / 10) * 10
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(m)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([decade, ms]) => ({
      decade,
      label: decadeLabel(decade),
      meetings: ms.sort((a, b) => b.ordinal - a.ordinal),
      resolutionCount: ms.reduce((acc, m) => acc + (m.resolution_count || 0), 0),
    }))
})

const showUpcomingSection = computed(() =>
  selectedStatus.value !== 'concluded' && selectedStatus.value !== 'cancelled' && upcomingMeetings.value.length > 0,
)
const showPastSection = computed(() =>
  selectedStatus.value !== 'upcoming',
)

function clearAll() {
  searchQuery.value = ''
  selectedDecade.value = null
  selectedType.value = 'all'
  selectedStatus.value = 'all'
}

function openMeeting(m: Meeting) {
  router.push(m.url)
}

function typeInitials(m: Meeting): string {
  if (m.type_label === 'Hybrid') return 'HYB'
  if (m.type_label === 'Virtual') return 'VRT'
  if (m.type_label === 'In person') return 'F2F'
  return m.type_label.slice(0, 3).toUpperCase()
}
</script>

<template>
  <div class="meetings-page">
    <PageHero
      variant="landing"
      bleed
      :eyebrow="`Annual plenaries since ${committee.established}`"
      title="Plenary Meetings"
      lead="Every plenary of ISO/TC 154 since the committee's founding — the annual focal point where technical decisions are made, resolutions adopted, and the work programme shaped."
    >
      <template #decoration>
        <div class="hero-pattern hero-pattern--flow"></div>
      </template>
      <dl class="page__stats" v-if="loaded">
        <div><dt>{{ animMeetings }}</dt><dd>Total plenaries</dd></div>
        <div><dt>{{ animResolutions }}</dt><dd>Resolutions adopted</dd></div>
        <div><dt>{{ animCountries }}</dt><dd>Countries hosted</dd></div>
        <div><dt>{{ firstYearDisplay }}</dt><dd>First plenary</dd></div>
      </dl>
      <dl class="page__stats" v-else>
        <div v-for="i in 4" :key="i">
          <dt class="stat-skeleton"></dt>
          <dd>&nbsp;</dd>
        </div>
      </dl>
    </PageHero>

    <div class="meetings-content">
    <section class="filters" aria-label="Filter meetings">
      <div class="filters__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          v-model="searchQuery"
          placeholder="Search by city, country, year, or plenary number…"
          aria-label="Search meetings"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <div class="filters__chips">
        <span class="filters__label">Decade</span>
        <button
          class="chip"
          :class="{ 'chip--active': selectedDecade === null }"
          @click="selectedDecade = null"
        >All</button>
        <button
          v-for="d in availableDecades"
          :key="d"
          class="chip"
          :class="{ 'chip--active': selectedDecade === d }"
          @click="selectedDecade = d"
        >{{ decadeLabel(d) }}</button>
      </div>

      <div class="filters__chips">
        <span class="filters__label">Format</span>
        <button
          v-for="opt in [{v:'all',l:'All'},{v:'face-to-face',l:'In person'},{v:'hybrid',l:'Hybrid'},{v:'virtual',l:'Virtual'}]"
          :key="opt.v"
          class="chip"
          :class="{ 'chip--active': selectedType === opt.v }"
          @click="selectedType = opt.v as typeof selectedType"
        >{{ opt.l }}</button>
      </div>

      <div class="filters__chips">
        <span class="filters__label">Status</span>
        <button
          v-for="opt in [{v:'all',l:'All'},{v:'upcoming',l:'Upcoming'},{v:'concluded',l:'Concluded'},{v:'cancelled',l:'Cancelled'}]"
          :key="opt.v"
          class="chip"
          :class="{ 'chip--active': selectedStatus === opt.v }"
          @click="selectedStatus = opt.v as typeof selectedStatus"
        >{{ opt.l }}</button>
      </div>

      <div class="filters__meta">
        <span>{{ filtered.length }} of {{ meetings.length }} plenaries</span>
        <button
          v-if="searchQuery || selectedDecade !== null || selectedType !== 'all' || selectedStatus !== 'all'"
          class="filters__clear"
          @click="clearAll"
        >Clear filters</button>
      </div>
    </section>

    <section v-if="!loaded" class="state state--loading">
      Loading plenary meetings…
    </section>

    <section v-else-if="grouped.length === 0 && !showUpcomingSection" class="state state--empty">
      <h3>No matches</h3>
      <p>Try a different decade, format, or search.</p>
      <button class="cta" @click="clearAll">Clear filters</button>
    </section>

    <section v-else class="index">
      <!-- UPCOMING: prominent card layout -->
      <div v-if="showUpcomingSection" class="upcoming">
        <header class="upcoming__header">
          <div class="upcoming__header-text">
            <p class="upcoming__eyebrow">
              <span class="upcoming__pulse" aria-hidden="true"></span>
              <span>Upcoming</span>
              <span class="upcoming__eyebrow-meta" v-if="upcomingMeetings.length === 1">Next plenary</span>
              <span class="upcoming__eyebrow-meta" v-else>{{ upcomingMeetings.length }} plenaries scheduled</span>
            </p>
            <h2 class="upcoming__title">In the calendar</h2>
            <p class="upcoming__lead">
              Plenary weeks still to come — book travel, register, and prepare contributions.
            </p>
          </div>
        </header>

        <ol class="upcoming__list">
          <li
            v-for="m in upcomingMeetings"
            :key="m.ordinal"
            class="ucard"
            :class="{
              'ucard--rich': !!m.rich,
              'ucard--cancelled': m.status_label === 'Cancelled',
            }"
            tabindex="0"
            @click="openMeeting(m)"
            @keydown.enter="openMeeting(m)"
          >
            <div class="ucard__rail" aria-hidden="true"></div>
            <div class="ucard__main">
              <div class="ucard__ordinal-row">
                <span class="ucard__ordinal">
                  {{ m.ordinal }}<sup>{{ ordinalSuffix(m.ordinal) }}</sup>
                </span>
                <span class="ucard__ordinal-label">Plenary</span>
                <span class="ucard__year">{{ m.year ?? '—' }}</span>
              </div>

              <h3 class="ucard__date" v-if="m.date_label">{{ m.date_label }}</h3>
              <h3 class="ucard__date ucard__date--empty" v-else>Date to be confirmed</h3>

              <p class="ucard__location" v-if="m.location_label">{{ m.location_label }}</p>
              <p class="ucard__location ucard__location--empty" v-else>Location to be confirmed</p>

              <div class="ucard__chips">
                <span v-if="m.status_label === 'Cancelled'" class="chip-status chip-status--cancelled">Cancelled</span>
                <span v-else-if="m.status_label === 'Registration open'" class="chip-status chip-status--open">Registration open</span>
                <span v-else-if="m.status_label === 'Confirmed'" class="chip-status chip-status--confirmed">Confirmed</span>
                <span v-else-if="m.status_label === 'Scheduled'" class="chip-status chip-status--scheduled">Scheduled</span>
                <span v-else-if="m.status_label === 'Tentative'" class="chip-status chip-status--tentative">Tentative</span>
                <span v-else class="chip-status">{{ m.status_label }}</span>
                <span v-if="m.type_label" class="chip-meta">{{ m.type_label }}</span>
                <span v-if="m.rich" class="chip-meta chip-meta--outline">Briefing available</span>
              </div>
            </div>

            <div class="ucard__arrow" aria-hidden="true">
              <span>Open</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </li>
        </ol>
      </div>

      <!-- PAST: decade grouping -->
      <div v-if="showPastSection">
        <h2 v-if="showUpcomingSection" class="past-section-label">
          <span>Past plenaries</span>
          <span class="past-section-rule" aria-hidden="true"></span>
        </h2>

        <div v-if="grouped.length === 0" class="state state--empty state--inline">
          <p>No past plenaries match the current filters.</p>
        </div>

        <div v-for="group in grouped" :key="group.decade" class="decade">
          <header class="decade__header">
            <h3 class="decade__label">{{ group.label }}</h3>
            <p class="decade__meta">
              {{ group.meetings.length }} plenar{{ group.meetings.length === 1 ? 'y' : 'ies' }}
              <span v-if="group.resolutionCount > 0"> · {{ group.resolutionCount }} resolutions</span>
            </p>
            <span class="decade__rule" aria-hidden="true"></span>
          </header>

          <ol class="decade__list">
            <li
              v-for="m in group.meetings"
              :key="m.ordinal"
              class="entry"
              :class="{
                'entry--cancelled': m.status_label === 'Cancelled',
                'entry--rich': !!m.rich,
              }"
              tabindex="0"
              @click="openMeeting(m)"
              @keydown.enter="openMeeting(m)"
            >
              <div class="entry__year">
                <span class="entry__year-num">{{ m.year ?? '—' }}</span>
                <span class="entry__year-tag">{{ typeInitials(m) }}</span>
              </div>

              <div class="entry__ordinal">
                <span class="entry__ordinal-num">{{ m.ordinal }}<sup>{{ ordinalSuffix(m.ordinal) }}</sup></span>
                <span class="entry__ordinal-label">Plenary</span>
              </div>

              <div class="entry__body">
                <p class="entry__date">{{ m.date_label || 'Date TBC' }}</p>
                <p class="entry__location" v-if="m.location_label">{{ m.location_label }}</p>
                <p class="entry__location entry__location--empty" v-else>Location TBC</p>

                <div class="entry__chips">
                  <span v-if="m.status_label === 'Cancelled'" class="badge badge--cancelled">Cancelled</span>
                  <span v-else class="badge badge--concluded">Concluded</span>
                  <span v-if="m.type_label" class="badge badge--type">{{ m.type_label }}</span>
                  <span v-if="m.participant_total" class="badge badge--meta">{{ m.participant_total }} attended</span>
                  <span v-if="m.resolution_count > 0" class="badge badge--res">
                    {{ m.resolution_count }} resolution{{ m.resolution_count === 1 ? '' : 's' }}
                  </span>
                  <span v-if="m.rich" class="badge badge--rich">Briefing available</span>
                </div>
              </div>

              <div class="entry__arrow" aria-hidden="true">→</div>
            </li>
          </ol>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
/* Hero stat skeleton (loaded state) */
.stat-skeleton {
  height: 2rem;
  width: 3.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #f5f5f4 0%, #e7e5e4 50%, #f5f5f4 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.dark .stat-skeleton {
  background: linear-gradient(90deg, #292524 0%, #44403c 50%, #292524 100%);
  background-size: 200% 100%;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* FILTERS */
.meetings-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}
.filters {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  padding: 1.25rem 1.25rem 1rem;
  margin-bottom: 3rem;
  display: flex; flex-direction: column;
  gap: 0.75rem;
}
.dark .filters { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.filters__search {
  position: relative;
  display: flex; align-items: center;
}
.filters__search svg {
  position: absolute;
  left: 0.875rem;
  width: 1.125rem; height: 1.125rem;
  color: #a8a29e;
}
.filters__search input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.5rem;
  background: #fafaf9;
  font-family: inherit;
  font-size: 0.9375rem;
  color: #1c1917;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.filters__search input:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #fff;
  box-shadow: 0 0 0 3px rgb(185 28 28 / 0.12);
}
.dark .filters__search input {
  background: #1c1917; border-color: #57534e; color: #fafaf9;
}
.dark .filters__search input:focus {
  border-color: var(--color-brand);
  background: #1c1917;
}
.filters__chips {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 0.375rem;
}
.filters__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a8a29e;
  margin-right: 0.5rem;
}
.chip {
  display: inline-flex; align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid #d6d3d1;
  background: #fff;
  color: #57534e;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
.chip--active {
  background: var(--color-brand-fill);
  border-color: var(--color-brand-fill);
  color: #fff;
}
.dark .chip { background: #292524; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: var(--color-brand); color: var(--color-brand); }
.dark .chip--active { background: var(--color-brand-fill); border-color: var(--color-brand-fill); color: #fff; }

.filters__meta {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.8125rem; color: #78716c;
  padding-top: 0.5rem;
  border-top: 1px dashed #e7e5e4;
}
.dark .filters__meta { color: #a8a29e; border-top-color: #292524; }
.filters__clear {
  background: none; border: 0; padding: 0;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brand);
  cursor: pointer;
}
.filters__clear:hover { text-decoration: underline; }

/* STATE */
.state {
  padding: 4rem 1rem;
  text-align: center;
  color: #78716c;
}
.state--empty h3 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: #1c1917;
  margin: 0 0 0.5rem;
}
.dark .state--empty h3 { color: #fafaf9; }
.cta {
  margin-top: 1rem;
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--color-brand-fill);
  color: #fff;
  border: 0;
  border-radius: 0.375rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}
.cta:hover { background: #b0000b; }

/* INDEX */
.index { display: flex; flex-direction: column; gap: 3rem; }
.decade__header {
  position: relative;
  display: flex; align-items: baseline; gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #1c1917;
}
.dark .decade__header { border-bottom-color: #fafaf9; }
.decade__label {
  font-family: var(--font-serif);
  font-size: clamp(1.875rem, 3vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1917;
  margin: 0;
  line-height: 1;
}
.dark .decade__label { color: #fafaf9; }
.decade__meta {
  font-size: 0.8125rem;
  color: #78716c;
  margin: 0;
}
.dark .decade__meta { color: #a8a29e; }

.decade__list {
  list-style: none;
  margin: 0; padding: 0;
}

.entry {
  display: grid;
  grid-template-columns: 5rem 5rem 1fr 1.5rem;
  align-items: start;
  gap: 1.25rem;
  padding: 1.125rem 0.5rem 1.125rem 0;
  border-bottom: 1px solid #e7e5e4;
  cursor: pointer;
  transition: background 0.15s, padding 0.15s;
  outline: none;
}
.entry:hover, .entry:focus-visible {
  background: rgb(185 28 28 / 0.025);
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.dark .entry { border-bottom-color: #292524; }
.dark .entry:hover, .dark .entry:focus-visible { background: rgb(185 28 28 / 0.07); }
.entry:focus-visible { box-shadow: inset 3px 0 0 var(--color-brand); }
.entry:last-child { border-bottom: 0; }

.entry--cancelled { opacity: 0.65; }

/* UPCOMING section */
.upcoming {
  margin-bottom: 4rem;
  padding: 1.75rem;
  border-radius: 1rem;
  background:
    radial-gradient(ellipse at top right, rgb(185 28 28 / 0.08), transparent 60%),
    linear-gradient(180deg, #fff 0%, rgb(254 242 242 / 0.4) 100%);
  border: 1px solid rgb(185 28 28 / 0.2);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.05), 0 12px 28px -12px rgb(185 28 28 / 0.18);
}
.dark .upcoming {
  background:
    radial-gradient(ellipse at top right, rgb(185 28 28 / 0.16), transparent 60%),
    linear-gradient(180deg, rgb(28 25 23 / 0.6) 0%, rgb(15 23 42 / 0.5) 100%);
  border-color: rgb(185 28 28 / 0.35);
}
.upcoming__header {
  margin-bottom: 1.25rem;
}
.upcoming__eyebrow {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-brand);
  margin: 0 0 0.5rem;
}
.upcoming__pulse {
  width: 0.5rem; height: 0.5rem; border-radius: 50%;
  background: var(--color-brand);
  box-shadow: 0 0 0 0 rgb(185 28 28 / 0.6);
  animation: upcoming-pulse 2s infinite;
}
@keyframes upcoming-pulse {
  0% { box-shadow: 0 0 0 0 rgb(185 28 28 / 0.55); }
  70% { box-shadow: 0 0 0 0.625rem rgb(185 28 28 / 0); }
  100% { box-shadow: 0 0 0 0 rgb(185 28 28 / 0); }
}
.upcoming__eyebrow-meta {
  color: #a8a29e;
  font-weight: 500;
  letter-spacing: 0.05em;
}
.dark .upcoming__eyebrow-meta { color: #d6d3d1; }
.upcoming__title {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1917;
  margin: 0 0 0.5rem;
  line-height: 1.05;
}
.dark .upcoming__title { color: #fafaf9; }
.upcoming__lead {
  font-size: 0.9375rem;
  color: #57534e;
  margin: 0;
  max-width: 38rem;
}
.dark .upcoming__lead { color: #d6d3d1; }

.upcoming__list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column;
  gap: 0.75rem;
}
.ucard {
  display: grid;
  grid-template-columns: 4px 1fr auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid rgb(185 28 28 / 0.25);
  border-radius: 0.75rem;
  cursor: pointer;
  outline: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.dark .ucard {
  background: rgb(28 25 23 / 0.85);
  border-color: rgb(185 28 28 / 0.4);
}
.ucard:hover, .ucard:focus-visible {
  transform: translateY(-1px);
  border-color: var(--color-brand);
  box-shadow: 0 12px 24px -12px rgb(185 28 28 / 0.3);
}
.ucard:focus-visible { box-shadow: 0 0 0 3px rgb(185 28 28 / 0.25); }
.ucard--cancelled { opacity: 0.7; }

.ucard__rail {
  width: 4px;
  align-self: stretch;
  background: var(--color-brand);
  border-radius: 2px;
}

.ucard__main { min-width: 0; }
.ucard__ordinal-row {
  display: flex; align-items: baseline; gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.ucard__ordinal {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-brand);
  line-height: 1;
  letter-spacing: -0.025em;
}
.ucard__ordinal sup {
  font-size: 0.5em;
  vertical-align: super;
}
.ucard__ordinal-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #78716c;
}
.dark .ucard__ordinal-label { color: #a8a29e; }
.ucard__year {
  margin-left: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #78716c;
}
.dark .ucard__year { color: #d6d3d1; }

.ucard__date {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.25rem;
  line-height: 1.25;
}
.dark .ucard__date { color: #fafaf9; }
.ucard__date--empty { color: #a8a29e; font-style: italic; font-weight: 600; }

.ucard__location {
  font-size: 0.9375rem;
  color: #57534e;
  margin: 0 0 0.625rem;
}
.dark .ucard__location { color: #d6d3d1; }
.ucard__location--empty { color: #a8a29e; font-style: italic; }

.ucard__chips {
  display: flex; flex-wrap: wrap; gap: 0.375rem;
}
.chip-status {
  display: inline-flex; align-items: center;
  padding: 0.1875rem 0.625rem;
  font-size: 0.75rem; font-weight: 700;
  border-radius: 9999px;
  background: var(--color-brand-fill);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.chip-status--open { background: #16a34a; }
.chip-status--confirmed { background: var(--color-brand-fill); }
.chip-status--scheduled { background: #0369a1; }
.chip-status--tentative { background: #b45309; }
.chip-status--cancelled { background: #57534e; }
.chip-meta {
  display: inline-flex; align-items: center;
  padding: 0.1875rem 0.625rem;
  font-size: 0.75rem; font-weight: 600;
  border-radius: 9999px;
  background: #f5f5f4;
  color: #57534e;
}
.dark .chip-meta { background: #292524; color: #d6d3d1; }
.chip-meta--outline {
  background: transparent;
  border: 1px solid rgb(185 28 28 / 0.4);
  color: var(--color-brand);
}
.dark .chip-meta--outline { border-color: rgb(185 28 28 / 0.5); }

.ucard__arrow {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-brand);
  white-space: nowrap;
}

/* PAST section header (after upcoming) */
.past-section-label {
  display: flex; align-items: center; gap: 1rem;
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #78716c;
  margin: 0 0 1.5rem;
}
.dark .past-section-label { color: #a8a29e; }
.past-section-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #d6d3d1, transparent);
}
.dark .past-section-rule { background: linear-gradient(90deg, #44403c, transparent); }

.state--inline {
  padding: 2rem 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .ucard {
    grid-template-columns: 4px 1fr;
    grid-template-rows: auto auto;
    padding: 1rem;
    gap: 0.875rem;
  }
  .ucard__arrow {
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
  }
  .ucard__ordinal { font-size: 1.5rem; }
  .ucard__date { font-size: 1.0625rem; }
  .upcoming { padding: 1.25rem; }
}

.entry__year {
  display: flex; flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}
.entry__year-num {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-brand);
  line-height: 1;
  letter-spacing: -0.02em;
}
.entry__year-tag {
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #a8a29e;
  letter-spacing: 0.05em;
}

.entry__ordinal {
  display: flex; flex-direction: column;
  align-items: flex-start;
  border-left: 1px solid #e7e5e4;
  padding-left: 1rem;
}
.dark .entry__ordinal { border-left-color: #44403c; }
.entry__ordinal-num {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #1c1917;
  line-height: 1;
}
.dark .entry__ordinal-num { color: #fafaf9; }
.entry__ordinal-num sup {
  font-size: 0.625em;
  font-weight: 600;
  vertical-align: super;
  margin-left: 0.0625em;
}
.entry__ordinal-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a8a29e;
  margin-top: 0.25rem;
}

.entry__body { min-width: 0; }
.entry__date {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1c1917;
  margin: 0 0 0.25rem;
}
.dark .entry__date { color: #fafaf9; }
.entry__location {
  font-size: 0.875rem;
  color: #57534e;
  margin: 0 0 0.5rem;
}
.dark .entry__location { color: #d6d3d1; }
.entry__location--empty { color: #a8a29e; font-style: italic; }

.entry__chips {
  display: flex; flex-wrap: wrap; gap: 0.25rem;
}
.badge {
  display: inline-block;
  padding: 0.0625rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 0.25rem;
  background: #f5f5f4;
  color: #57534e;
  line-height: 1.4;
}
.dark .badge { background: #292524; color: #d6d3d1; }
.badge--concluded { background: #f5f5f4; color: #78716c; }
.badge--upcoming { background: var(--color-brand-fill); color: #fff; }
.badge--cancelled { background: #fee2e2; color: #991b1b; }
.dark .badge--cancelled { background: rgb(185 28 28 / 0.2); color: #fca5a5; }
.badge--type {
  background: #e0e7ff; color: #3730a3;
}
.dark .badge--type { background: rgb(99 102 241 / 0.2); color: #c7d2fe; }
.badge--meta { background: #fef3c7; color: #92400e; }
.dark .badge--meta { background: rgb(245 158 11 / 0.2); color: #fcd34d; }
.badge--res {
  background: #dcfce7; color: #166534;
}
.dark .badge--res { background: rgb(34 197 94 / 0.2); color: #86efac; }
.badge--rich {
  background: #fff; border: 1px solid var(--color-brand);
  color: var(--color-brand);
}
.dark .badge--rich { background: rgb(15 23 42 / 0.5); }

.entry__arrow {
  align-self: center;
  font-size: 1.25rem;
  color: #d6d3d1;
  transition: transform 0.2s, color 0.2s;
}
.entry:hover .entry__arrow {
  color: var(--color-brand);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .entry {
    grid-template-columns: 4rem 1fr;
    grid-template-rows: auto auto;
    gap: 0.5rem 1rem;
  }
  .entry__ordinal {
    grid-column: 1;
    grid-row: 2;
    border-left: 0;
    padding-left: 0;
    flex-direction: row;
    align-items: baseline;
    gap: 0.5rem;
  }
  .entry__ordinal-label { margin-top: 0; }
  .entry__year {
    grid-column: 2;
    grid-row: 1;
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .entry__body {
    grid-column: 1 / -1;
    grid-row: 3;
  }
  .entry__arrow { display: none; }
}
</style>
