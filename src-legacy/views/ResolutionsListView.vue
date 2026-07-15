<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResolutions } from '../composables/useResolutions'
import { useResolutionMeetings } from '../composables/useResolutionMeetings'
import { useFilteredCollection } from '../composables/useFilteredCollection'
import { committee } from '../data/committee'
import { useMeta } from '../composables/useMeta'
import { useCountUp } from '@edoxen/vue'
import { getActionColor } from '../data/actionTypes'
import { formatDate } from '../utils/format'
import { highlightText } from '../utils/highlight'
import { parseMeetingSourceParam, meetingSourceFromParts, meetingSourceShortTitle } from '../domain/meetingSource'
import {
  uniqueActionTypes,
  actionTypeFacets,
  yearFacets,
  yearRange as resolutionYearRange,
  compareResolutions,
  searchResolutions,
  type ResolutionSortOrder,
} from '../domain/resolutionPresentation'
import type { Resolution } from '../types/resolution'
import PageHero from '../components/PageHero.vue'
import FilterBar from '../components/FilterBar.vue'
import FilterChip from '../components/FilterChip.vue'
import FilterFacet from '../components/FilterFacet.vue'
import EmptyState from '../components/EmptyState.vue'
import ListCardSkeleton from '../components/ListCardSkeleton.vue'

const router = useRouter()
const route = useRoute()

const { resolutions, isLoaded, loadData, search } = useResolutions()
const { meetings, loadData: loadMeetingsData } = useResolutionMeetings()
const { meta, load: loadMeta } = useMeta()

const sortOrder = ref<ResolutionSortOrder>(
  ((route.query.sort as string) as ResolutionSortOrder) || 'newest',
)
const limit = ref(50)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isLegendOpen = ref(false)

const availableYears = computed(() => yearFacets(resolutions.value))
const actionFacets = computed(() => actionTypeFacets(resolutions.value))

// Memoized search-result set keyed on the lowercased query. The composable's
// text.match closes over this, and match receives the query as a parameter —
// so this function does not depend on the composable's searchQuery ref,
// breaking what would otherwise be a type-inference cycle.
const matchCache = ref<{ q: string; set: Set<string> | null }>({ q: '', set: null })
function matchedSet(q: string): Set<string> | null {
  const lower = q.trim().toLowerCase()
  if (matchCache.value.q === lower) return matchCache.value.set
  const set = lower === ''
    ? null
    : (() => {
        const indexed = search(lower)
        if (indexed.length > 0) return new Set(indexed.map(r => r.id))
        return new Set(searchResolutions(resolutions.value, lower).map(r => r.id))
      })()
  matchCache.value = { q: lower, set }
  return set
}

const {
  searchQuery,
  selection,
  selectionSets,
  filtered: filteredResolutions,
  hasActiveFilters,
  clearAll: clearAllBase,
} = useFilteredCollection<Resolution>(resolutions, {
  text: {
    initialQuery: (route.query.q as string) || '',
    match: (r, q) => matchedSet(q)?.has(r.id) ?? true,
  },
  facets: [
    {
      id: 'year',
      values: availableYears,
      test: (r, v) => r.year === v,
      initialValue: (route.query.year as string) || '',
    },
    {
      id: 'meeting',
      values: computed(() => []),
      test: (r, v) => {
        const parsed = parseMeetingSourceParam(v)
        if (!parsed) return false
        const rs = meetingSourceFromParts(r.source_type, r.source_file)
        return rs !== null && rs.kind === parsed.kind && rs.raw === parsed.raw
      },
      initialValue: (route.query.meeting as string) || '',
    },
    {
      id: 'actionType',
      values: computed(() => actionFacets.value.all),
      test: (r, v) => uniqueActionTypes(r).includes(v),
      multiple: true,
    },
  ],
  sort: (a, b) => compareResolutions(sortOrder.value)(a, b),
})

const selectedYear = selection.year
const selectedMeeting = selection.meeting
const selectedActionTypes = selectionSets.actionType

function clearAllFilters() {
  clearAllBase()
  sortOrder.value = 'newest'
}

const meetingFilter = computed(() => parseMeetingSourceParam(selectedMeeting.value))

const meetingFilterLabel = computed(() => {
  const s = meetingFilter.value
  return s ? meetingSourceShortTitle(s) : ''
})

const totalResolutions = computed(() => resolutions.value.length)
const totalMeetings = computed(() => meetings.value.length)
const committeeStandards = computed(() => meta.value?.counts.publishedStandards ?? 0)
const committeeEst = computed(() => committee.established)

const animResolutions = useCountUp(totalResolutions, isLoaded, 1500)
const animMeetings = useCountUp(totalMeetings, isLoaded, 1500)
const animStandards = useCountUp(committeeStandards, isLoaded, 1500)
const animEstablished = useCountUp(committeeEst, isLoaded, 1500)

const yearSpan = computed(() => resolutionYearRange(resolutions.value))

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

onMounted(() => {
  loadData()
  loadMeetingsData()
  loadMeta()
  window.addEventListener('keydown', handleGlobalKeydown)

  if (searchQuery.value || selectedYear.value || sortOrder.value !== 'newest') {
    setTimeout(() => scrollToResults(), 100)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
    scrollToResults()
  } else if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    searchQuery.value = ''
    searchInputRef.value?.blur()
  }
}

function scrollToResults() {
  const resultsEl = document.getElementById('results-section')
  if (resultsEl) {
    const y = resultsEl.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function toggleActionType(action: string) {
  const set = new Set(selectedActionTypes.value)
  if (set.has(action)) set.delete(action)
  else set.add(action)
  selectedActionTypes.value = set
}

const paginatedResolutions = computed(() => filteredResolutions.value.slice(0, limit.value))
const hasMore = computed(() => limit.value < filteredResolutions.value.length)

function loadMore() {
  limit.value += 50
}

watch([searchQuery, selectedYear, sortOrder, selectedMeeting], () => {
  limit.value = 50
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedYear.value) query.year = selectedYear.value
  if (sortOrder.value && sortOrder.value !== 'newest') query.sort = sortOrder.value
  if (selectedMeeting.value) query.meeting = selectedMeeting.value
  router.replace({ query })
})
</script>

<template>
  <div class="res-page-wrap">
    <PageHero
      variant="landing"
      bleed
      eyebrow="Resolutions archive"
      title="Every decision the committee"
      accent="has ever made."
      :lead="isLoaded
        ? `${formatNumber(totalResolutions)} resolutions from ${formatNumber(totalMeetings)} plenary meetings and committee ballots, spanning ${yearSpan.earliest} to ${yearSpan.latest}. ${committee.tagline}.`
        : 'Loading the archive…'"
    >
      <template #decoration>
        <div class="hero-pattern hero-pattern--nodes"></div>
      </template>
      <dl class="page__stats" v-if="isLoaded">
        <div><dt>{{ formatNumber(animResolutions) }}</dt><dd>Resolutions</dd></div>
        <div><dt>{{ formatNumber(animMeetings) }}</dt><dd>Meetings &amp; ballots</dd></div>
        <div><dt>{{ formatNumber(animStandards) }}</dt><dd>Published standards</dd></div>
        <div><dt>{{ animEstablished }}</dt><dd>Established</dd></div>
      </dl>
      <template #actions>
        <button @click="scrollToResults" class="hero-btn hero-btn--primary">Browse Resolutions</button>
        <RouterLink to="/resolutions/meetings/" class="hero-btn hero-btn--secondary">Browse Meetings</RouterLink>
      </template>
    </PageHero>

    <div class="res-page" id="results-section">
      <div v-if="meetingFilter" class="meeting-filter-banner">
        <div class="meeting-filter-banner__info">
          <span class="meeting-filter-banner__label">Filtered by</span>
          <span class="meeting-filter-banner__name">{{ meetingFilterLabel }}</span>
        </div>
        <button class="meeting-filter-banner__clear" @click="selectedMeeting = ''">
          View all resolutions
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <FilterBar
        v-model="searchQuery"
        elevated
        search-placeholder="Search by topic, number, or keyword…"
        search-label="Search resolutions"
        :showing="filteredResolutions.length"
        :total="totalResolutions"
        total-label="resolutions"
        :clearable="hasActiveFilters"
        @clear="clearAllFilters"
      >
        <template #facets>
          <FilterFacet label="Year">
            <FilterChip :active="selectedYear === ''" @click="selectedYear = ''">All</FilterChip>
            <FilterChip
              v-for="year in availableYears"
              :key="year"
              :active="selectedYear === year"
              @click="selectedYear = year"
            >{{ year }}</FilterChip>
          </FilterFacet>

          <FilterFacet v-if="actionFacets.top.length" label="Action">
            <FilterChip
              :active="selectedActionTypes.size === 0"
              @click="selectedActionTypes.clear()"
            >All</FilterChip>
            <FilterChip
              v-for="action in actionFacets.top"
              :key="action"
              :active="selectedActionTypes.has(action)"
              :dot-color="getActionColor(action).bg"
              @click="toggleActionType(action)"
            >{{ action }}</FilterChip>
          </FilterFacet>

          <FilterFacet label="Sort">
            <select v-model="sortOrder" class="sort-select" aria-label="Sort resolutions">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most_actions">Most actions</option>
            </select>
          </FilterFacet>
        </template>

        <template #active-filters>
          <FilterChip v-if="searchQuery" :active="true" @click="searchQuery = ''">
            “{{ searchQuery }}”
          </FilterChip>
          <FilterChip v-if="selectedYear" :active="true" @click="selectedYear = ''">
            {{ selectedYear }}
          </FilterChip>
          <FilterChip
            v-for="act in Array.from(selectedActionTypes)"
            :key="act"
            :active="true"
            @click="toggleActionType(act)"
          >{{ act }}</FilterChip>
        </template>

        <template #meta-extra>
          <button class="legend-toggle" @click="isLegendOpen = !isLegendOpen">
            {{ isLegendOpen ? 'Hide legend' : 'Action legend' }}
          </button>
        </template>
      </FilterBar>

      <div v-show="isLegendOpen" class="action-legend">
        <div v-for="action in actionFacets.all" :key="action" class="legend-item">
          <span class="legend-color" :style="{ background: getActionColor(action).bg }"></span>
          <span class="legend-label">{{ action }}</span>
        </div>
      </div>

      <ListCardSkeleton v-if="!isLoaded" :count="6" />

      <div v-else-if="filteredResolutions.length === 0">
        <EmptyState
          title="Nothing in the archive matches"
          message="Try a different keyword, or clear a filter to widen the search."
        >
          <template #suggestions>
            <FilterChip @click="searchQuery = 'resolves'">resolves</FilterChip>
            <FilterChip @click="searchQuery = 'approves'">approves</FilterChip>
            <FilterChip @click="searchQuery = 'ISO 8601'">ISO 8601</FilterChip>
            <FilterChip @click="searchQuery = 'EDIFACT'">EDIFACT</FilterChip>
          </template>
          <FilterChip @click="clearAllFilters">Clear all filters</FilterChip>
        </EmptyState>
      </div>

      <div v-else class="res-results">
        <RouterLink
          v-for="(res, index) in paginatedResolutions"
          :key="res.source_type + '/' + res.source_file + '/' + res.id"
          :to="res.path"
          class="res-card"
          :style="{ '--nth': index % limit }"
        >
          <div class="res-card__top">
            <div class="res-card__id">
              <span v-if="res.is_acclamation" class="res-card__acclamation">Acclamation</span>
              <template v-else>
                <span>{{ res.id }}</span>
                <span class="res-card__source">{{ res.source_type === 'plenary' ? 'Plenary' : res.source_type }}</span>
              </template>
            </div>
            <span class="res-card__year">{{ res.year }}</span>
          </div>

          <h3 class="res-card__title">
            <span v-html="highlightText(res.is_acclamation ? 'Acclamation' : (res.title || 'Resolution ' + res.id), searchQuery)"></span>
          </h3>

          <p v-if="res.snippet" class="res-card__snippet">
            <span v-html="highlightText(res.snippet, searchQuery)"></span>
          </p>

          <div class="res-card__footer">
            <div class="res-card__actions" v-if="uniqueActionTypes(res).length">
              <span
                v-for="actType in uniqueActionTypes(res).slice(0, 3)"
                :key="actType"
                class="res-card__action"
                :style="{
                  '--act-bg': getActionColor(actType).bg,
                  '--act-text': getActionColor(actType).text,
                }"
              >{{ actType }}</span>
              <span
                v-if="uniqueActionTypes(res).length > 3"
                class="res-card__action res-card__action--more"
              >+{{ uniqueActionTypes(res).length - 3 }}</span>
            </div>

            <div class="res-card__meta">
              <span v-if="res.meeting_date" class="res-card__badge">{{ formatDate(res.meeting_date) }}</span>
              <span v-if="res.venue" class="res-card__badge res-card__badge--venue">{{ res.venue }}</span>
            </div>

            <span class="res-card__arrow" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </RouterLink>
      </div>

      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" class="load-more-btn">Load more</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.res-page-wrap { display: flex; flex-direction: column; }
.res-page-wrap :deep(.ph) {
  margin-bottom: 0;
  padding-bottom: 2rem;
}
.res-page-wrap :deep(.ph__actions) {
  margin-top: 2rem;
}

.res-page {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

/* Hero buttons (slotted into PageHero #actions) */
.hero-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.75rem;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-btn--primary {
  background-color: var(--color-brand-fill);
  color: #fff;
  border: 1px solid transparent;
  box-shadow: 0 4px 6px -1px rgb(30 58 138 / 0.3), 0 2px 4px -1px rgb(30 58 138 / 0.2);
}
.hero-btn--primary:hover, .hero-btn--primary:focus-visible {
  background-color: var(--color-brand-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(30 58 138 / 0.4), 0 4px 6px -2px rgb(30 58 138 / 0.2);
  outline: none;
}
.hero-btn--primary:active { transform: translateY(0); }
.hero-btn--secondary {
  background-color: transparent;
  color: #57534e;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.dark .hero-btn--secondary {
  color: #d6d3d1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.hero-btn--secondary:hover, .hero-btn--secondary:focus-visible {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1c1917;
  border-color: rgba(0, 0, 0, 0.25);
  outline: none;
}
.dark .hero-btn--secondary:hover, .dark .hero-btn--secondary:focus-visible {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

/* Meeting-filter banner (cross-linked from a meeting detail page) */
.meeting-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.dark .meeting-filter-banner {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-700);
}
.meeting-filter-banner__info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.meeting-filter-banner__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.dark .meeting-filter-banner__label { color: var(--color-slate-400); }
.meeting-filter-banner__name {
  font-weight: 600;
  color: var(--color-brand);
}
.dark .meeting-filter-banner__name { color: #94b6e8; }
.meeting-filter-banner__clear {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  color: var(--color-slate-500);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}
.dark .meeting-filter-banner__clear { color: var(--color-slate-300); }
.meeting-filter-banner__clear:hover {
  color: var(--color-blue-accent);
  background: rgb(30 58 138 / 0.06);
}
.dark .meeting-filter-banner__clear:hover {
  color: #94b6e8;
  background: rgb(148 182 232 / 0.08);
}

/* Sort dropdown — kept small and inline inside the FilterBar sort slot */
.sort-select {
  appearance: none;
  background: #fff;
  border: 1px solid #d6d3d1;
  border-radius: 0.5rem;
  padding: 0.4375rem 2rem 0.4375rem 0.875rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #57534e;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
}
.dark .sort-select {
  background: #292524;
  border-color: #57534e;
  color: #d6d3d1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
}
.sort-select:focus-visible {
  outline: none;
  border-color: var(--color-blue-accent);
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}

/* Legend toggle in FilterBar meta-extra slot */
.legend-toggle {
  background: transparent;
  border: 1px solid #e7e5e4;
  color: #78716c;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3125rem 0.75rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.legend-toggle:hover {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
}
.dark .legend-toggle {
  border-color: #44403c;
  color: #a8a29e;
}
.dark .legend-toggle:hover {
  background: var(--color-brand-fill);
  border-color: var(--color-brand-fill);
}

/* Action legend (expanded panel below the filter bar) */
.action-legend {
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.25rem;
}
.dark .action-legend {
  background: rgb(15 23 42 / 0.4);
  border-color: #44403c;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #57534e;
  font-weight: 500;
}
.dark .legend-item { color: #a8a29e; }
.legend-color {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

/* Resolution card grid */
.res-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 0.75rem;
}

.res-card {
  display: flex;
  flex-direction: column;
  padding: 1.125rem 1.25rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.625rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s;
  opacity: 0;
  transform: translateY(15px);
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.03s);
}
.dark .res-card {
  background: rgb(15 23 42 / 0.4);
  border-color: #44403c;
}
.res-card:hover, .res-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-color: var(--color-blue-accent);
  outline: none;
}
.dark .res-card:hover, .dark .res-card:focus-visible {
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
  border-color: #94b6e8;
}

.res-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.res-card__id {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-blue-accent);
}
.dark .res-card__id { color: #94b6e8; }
.res-card__source {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a8a29e;
  background: #f5f5f4;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}
.dark .res-card__source {
  background: #292524;
  color: #a8a29e;
}
.res-card__acclamation {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 0.1875rem 0.625rem;
  border-radius: 0.25rem;
}
.dark .res-card__acclamation {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}
.res-card__year {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #78716c;
  background: #f5f5f4;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
.dark .res-card__year {
  background: #292524;
  color: #a8a29e;
}

.res-card__title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.0625rem;
  line-height: 1.35;
  color: #1c1917;
  margin: 0 0 0.5rem;
  transition: color 0.3s;
}
.dark .res-card__title { color: #fafaf9; }
.res-card:hover .res-card__title { color: var(--color-blue-accent); }
.dark .res-card:hover .res-card__title { color: #94b6e8; }

.res-card__snippet {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #78716c;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .res-card__snippet { color: #a8a29e; }

.res-card__footer {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: auto;
  padding-top: 0.875rem;
  position: relative;
}
.res-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.res-card__action {
  background: var(--act-bg);
  color: var(--act-text);
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.res-card__action--more {
  background: #f5f5f4;
  color: #78716c;
  border: 1px solid #e7e5e4;
}
.dark .res-card__action--more {
  background: #292524;
  color: #a8a29e;
  border-color: #44403c;
}
.res-card__meta {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
}
.res-card__badge {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: #f5f5f4;
  color: #57534e;
}
.dark .res-card__badge {
  background: #292524;
  color: #d6d3d1;
}
.res-card__badge--venue {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.res-card__arrow {
  position: absolute;
  bottom: 0.5rem;
  right: 0;
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.dark .res-card__arrow { color: #94b6e8; }
.res-card:hover .res-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

:deep(.search-highlight) {
  background-color: rgba(250, 204, 21, 0.4);
  color: inherit;
  border-radius: 0.125rem;
  padding: 0 0.125rem;
}
.dark :deep(.search-highlight) { background-color: rgba(234, 179, 8, 0.3); }

/* Load more */
.load-more-container {
  margin-top: 2.5rem;
  text-align: center;
}
.load-more-btn {
  display: inline-flex;
  padding: 0.625rem 1.75rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 9999px;
  background: #fff;
  border: 1px solid #e7e5e4;
  color: #57534e;
  cursor: pointer;
  transition: all 0.2s;
}
.load-more-btn:hover {
  border-color: var(--color-blue-accent);
  color: var(--color-blue-accent);
}
.dark .load-more-btn {
  background: rgb(15 23 42 / 0.5);
  border-color: #44403c;
  color: #d6d3d1;
}
.dark .load-more-btn:hover {
  border-color: #94b6e8;
  color: #94b6e8;
}

@media (prefers-reduced-motion: reduce) {
  .res-card {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
