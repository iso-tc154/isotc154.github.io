<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetings } from '../composables/useMeetings'
import { useFilteredCollection } from '../composables/useFilteredCollection'
import { committee } from '../data/committee'
import { useCountUp } from '@edoxen/vue'
import type { Meeting } from '../types/meeting'
import PageHero from '../components/PageHero.vue'
import FilterBar from '../components/FilterBar.vue'
import FilterChip from '../components/FilterChip.vue'
import FilterFacet from '../components/FilterFacet.vue'
import EmptyState from '../components/EmptyState.vue'
import ListCardSkeleton from '../components/ListCardSkeleton.vue'
import { ordinalSuffix } from '../utils/ordinal'
import {
  isUpcoming,
  decadeFacets,
  decadeLabel,
  groupByDecade,
  typeInitials,
  searchHaystack,
} from '../domain/meetingPresentation'

const router = useRouter()
const { meetings, isLoaded, loadData } = useMeetings()

onMounted(async () => { await loadData() })

const loaded = computed(() => isLoaded.value && meetings.value.length > 0)

const {
  searchQuery,
  selection,
  available,
  filtered,
  hasActiveFilters,
  clearAll: clearFilters,
} = useFilteredCollection<Meeting>(meetings, {
  text: { haystack: m => searchHaystack(m) },
  facets: [
    {
      id: 'decade',
      values: computed(() => decadeFacets(meetings.value).map(String)),
      test: (m, v) => Math.floor((m.year ?? 0) / 10) * 10 === parseInt(v, 10),
    },
    {
      id: 'type',
      values: computed(() => ['face-to-face', 'hybrid', 'virtual']),
      test: (m, v) => new Set(m.sessions.map(s => s.type)).has(v),
    },
    {
      id: 'status',
      values: computed(() => ['upcoming', 'concluded', 'cancelled']),
      test: (m, v) => {
        if (v === 'upcoming') return isUpcoming(m)
        if (v === 'concluded') return m.status_label === 'Concluded'
        if (v === 'cancelled') return m.status_label === 'Cancelled'
        return false
      },
    },
  ],
})

const selectedDecade = computed({
  get: () => selection.decade.value === '' ? null : parseInt(selection.decade.value, 10),
  set: (v: number | null) => { selection.decade.value = v === null ? '' : String(v) },
})
const selectedType = selection.type
const selectedStatus = selection.status

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

const showUpcomingSection = computed(() =>
  selectedStatus.value !== 'concluded' &&
  selectedStatus.value !== 'cancelled' &&
  upcomingMeetings.value.length > 0,
)
const showPastSection = computed(() => selectedStatus.value !== 'upcoming')

const upcomingMeetings = computed<Meeting[]>(() =>
  filtered.value
    .filter(m => isUpcoming(m))
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
)

const pastFiltered = computed<Meeting[]>(() =>
  filtered.value.filter(m => !isUpcoming(m)),
)

const grouped = computed(() => groupByDecade(pastFiltered.value))

function clearAll() {
  clearFilters()
}

function openMeeting(m: Meeting) {
  router.push(m.url)
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
      <FilterBar
        v-model="searchQuery"
        elevated
        search-placeholder="Search by city, country, year, or plenary number…"
        search-label="Search meetings"
        :showing="filtered.length"
        :total="totalMeetings"
        total-label="plenaries"
        :clearable="hasActiveFilters"
        @clear="clearAll"
      >
        <template #facets>
          <FilterFacet label="Decade">
            <FilterChip
              :active="selectedDecade === null"
              @click="selectedDecade = null"
            >All</FilterChip>
            <FilterChip
              v-for="d in available.decade.value.map(Number)" :key="d"
              :active="selectedDecade === d"
              @click="selectedDecade = d"
            >{{ decadeLabel(d) }}</FilterChip>
          </FilterFacet>

          <FilterFacet label="Format">
            <FilterChip
              v-for="opt in [{v:'',l:'All'},{v:'face-to-face',l:'In person'},{v:'hybrid',l:'Hybrid'},{v:'virtual',l:'Virtual'}]"
              :key="opt.v"
              :active="selectedType === opt.v"
              @click="selectedType = opt.v"
            >{{ opt.l }}</FilterChip>
          </FilterFacet>

          <FilterFacet label="Status">
            <FilterChip
              v-for="opt in [{v:'',l:'All'},{v:'upcoming',l:'Upcoming'},{v:'concluded',l:'Concluded'},{v:'cancelled',l:'Cancelled'}]"
              :key="opt.v"
              :active="selectedStatus === opt.v"
              @click="selectedStatus = opt.v"
            >{{ opt.l }}</FilterChip>
          </FilterFacet>
        </template>
      </FilterBar>

      <ListCardSkeleton v-if="!loaded" :count="4" :min-card-width="320" />

      <EmptyState
        v-else-if="grouped.length === 0 && !showUpcomingSection"
        title="No plenaries match"
        message="Try a different decade, format, or search term — or clear the filters and start over."
      >
        <FilterChip @click="clearAll">Clear filters</FilterChip>
      </EmptyState>

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

          <EmptyState
            v-if="grouped.length === 0"
            title="No past plenaries match"
            message="Adjust the filters to widen the search."
          />

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

.meetings-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

/* INDEX */
.index { display: flex; flex-direction: column; gap: 3rem; margin-top: 2.5rem; }
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
  background: rgb(30 58 138 / 0.025);
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.dark .entry { border-bottom-color: #292524; }
.dark .entry:hover, .dark .entry:focus-visible { background: rgb(148 182 232 / 0.05); }
.entry:focus-visible { box-shadow: inset 3px 0 0 var(--color-blue-accent); }
.entry:last-child { border-bottom: 0; }

.entry--cancelled { opacity: 0.65; }

/* UPCOMING section */
.upcoming {
  margin-bottom: 4rem;
  padding: 1.75rem;
  border-radius: 1rem;
  background:
    radial-gradient(ellipse at top right, rgb(30 58 138 / 0.08), transparent 60%),
    linear-gradient(180deg, #fff 0%, rgb(219 234 254 / 0.4) 100%);
  border: 1px solid rgb(30 58 138 / 0.2);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.05), 0 12px 28px -12px rgb(30 58 138 / 0.18);
}
.dark .upcoming {
  background:
    radial-gradient(ellipse at top right, rgb(148 182 232 / 0.16), transparent 60%),
    linear-gradient(180deg, rgb(28 25 23 / 0.6) 0%, rgb(15 23 42 / 0.5) 100%);
  border-color: rgb(148 182 232 / 0.35);
}
.upcoming__header {
  margin-bottom: 1.25rem;
}
.upcoming__eyebrow {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .upcoming__eyebrow { color: #94b6e8; }
.upcoming__pulse {
  width: 0.5rem; height: 0.5rem; border-radius: 50%;
  background: var(--color-blue-accent);
  box-shadow: 0 0 0 0 rgb(30 58 138 / 0.6);
  animation: upcoming-pulse 2s infinite;
}
.dark .upcoming__pulse {
  background: #94b6e8;
  box-shadow: 0 0 0 0 rgb(148 182 232 / 0.6);
}
@keyframes upcoming-pulse {
  0% { box-shadow: 0 0 0 0 rgb(30 58 138 / 0.55); }
  70% { box-shadow: 0 0 0 0.625rem rgb(30 58 138 / 0); }
  100% { box-shadow: 0 0 0 0 rgb(30 58 138 / 0); }
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
  border: 1px solid rgb(30 58 138 / 0.25);
  border-radius: 0.75rem;
  cursor: pointer;
  outline: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.dark .ucard {
  background: rgb(28 25 23 / 0.85);
  border-color: rgb(148 182 232 / 0.4);
}
.ucard:hover, .ucard:focus-visible {
  transform: translateY(-1px);
  border-color: var(--color-blue-accent);
  box-shadow: 0 12px 24px -12px rgb(30 58 138 / 0.3);
}
.dark .ucard:hover, .dark .ucard:focus-visible {
  border-color: #94b6e8;
  box-shadow: 0 12px 24px -12px rgb(148 182 232 / 0.25);
}
.ucard:focus-visible { box-shadow: 0 0 0 3px rgb(30 58 138 / 0.25); }
.ucard--cancelled { opacity: 0.7; }

.ucard__rail {
  width: 4px;
  align-self: stretch;
  background: var(--color-blue-accent);
  border-radius: 2px;
}
.dark .ucard__rail { background: #94b6e8; }

.ucard__main { min-width: 0; }
.ucard__ordinal-row {
  display: flex; align-items: baseline; gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.ucard__ordinal {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-blue-accent);
  line-height: 1;
  letter-spacing: -0.025em;
}
.dark .ucard__ordinal { color: #94b6e8; }
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
  background: var(--color-blue-accent);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.dark .chip-status { background: var(--color-brand-fill); }
.chip-status--open { background: #16a34a; }
.chip-status--confirmed { background: var(--color-blue-accent); }
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
  border: 1px solid rgb(30 58 138 / 0.4);
  color: var(--color-blue-accent);
}
.dark .chip-meta--outline { border-color: rgb(148 182 232 / 0.5); color: #94b6e8; }

.ucard__arrow {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-blue-accent);
  white-space: nowrap;
}
.dark .ucard__arrow { color: #94b6e8; }

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
  color: var(--color-blue-accent);
  line-height: 1;
  letter-spacing: -0.02em;
}
.dark .entry__year-num { color: #94b6e8; }
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
.badge--upcoming { background: var(--color-blue-accent); color: #fff; }
.dark .badge--upcoming { background: var(--color-brand-fill); }
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
  background: #fff; border: 1px solid var(--color-blue-accent);
  color: var(--color-blue-accent);
}
.dark .badge--rich {
  background: rgb(15 23 42 / 0.5);
  border-color: #94b6e8;
  color: #94b6e8;
}

.entry__arrow {
  align-self: center;
  font-size: 1.25rem;
  color: #d6d3d1;
  transition: transform 0.2s, color 0.2s;
}
.entry:hover .entry__arrow {
  color: var(--color-blue-accent);
  transform: translateX(4px);
}
.dark .entry:hover .entry__arrow { color: #94b6e8; }

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
