<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResolutions } from '../composables/useResolutions'
import { useResolutionMeetings } from "../composables/useResolutionMeetings"
import { committee } from '../data/committee'
import { useSiteStats } from '../composables/useSiteStats'
import { useCountUp } from '../composables/useCountUp'
import { getActionColor } from '../data/actionTypes'
import { formatDate } from '../utils/format'
import { highlightText } from '../utils/highlight'
import { parseMeetingSourceParam, meetingSourceShortTitle } from '../domain/meetingSource'
import {
  allActionTypes as listAllActionTypes,
  filterResolutions,
  resolutionYearRange,
  resolutionYears,
  topActionTypes as listTopActionTypes,
  uniqueActionTypes,
  type ResolutionsFilter,
} from '../domain/resolutions'
import PageHero from '../components/PageHero.vue'

const router = useRouter()
const route = useRoute()

const { resolutions, isLoaded, loadData, search } = useResolutions()
const { meetings, loadData: loadMeetingsData } = useResolutionMeetings()
const { siteStats, load: loadSiteStats } = useSiteStats()

const searchQuery = ref((route.query.q as string) || '')
const selectedYear = ref((route.query.year as string) || '')
const sortOrder = ref((route.query.sort as string) || 'newest')
const selectedActionTypes = ref<Set<string>>(new Set())
const selectedMeeting = ref((route.query.meeting as string) || '')
const limit = ref(50)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isLegendOpen = ref(false)

const meetingFilter = computed(() => parseMeetingSourceParam(selectedMeeting.value))

const meetingFilterLabel = computed(() => {
  const s = meetingFilter.value
  return s ? meetingSourceShortTitle(s) : ''
})

const totalResolutions = computed(() => resolutions.value.length)
const totalMeetings = computed(() => meetings.value.length)
const committeeStandards = computed(() => siteStats.value?.counts.publishedStandards ?? 0)
const committeeEst = computed(() => committee.established)

const animResolutions = useCountUp(totalResolutions, isLoaded, 1500)
const animMeetings = useCountUp(totalMeetings, isLoaded, 1500)
const animStandards = useCountUp(committeeStandards, isLoaded, 1500)
const animEstablished = useCountUp(committeeEst, isLoaded, 1500)

const yearRange = computed(() => resolutionYearRange(resolutions.value))

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

onMounted(() => {
  loadData()
  loadMeetingsData()
  loadSiteStats()
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

const availableYears = computed(() => resolutionYears(resolutions.value))

const topActionTypes = computed(() => listTopActionTypes(resolutions.value))

const allActionTypes = computed(() => listAllActionTypes(resolutions.value))

function toggleActionType(action: string) {
  const newSet = new Set(selectedActionTypes.value)
  if (newSet.has(action)) newSet.delete(action)
  else newSet.add(action)
  selectedActionTypes.value = newSet
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedYear.value = ''
  selectedActionTypes.value = new Set()
  sortOrder.value = 'newest'
  selectedMeeting.value = ''
}

function getUniqueActions(res: any): string[] {
  return uniqueActionTypes(res)
}

const filterModel = computed<ResolutionsFilter>(() => ({
  searchQuery: searchQuery.value,
  selectedYear: selectedYear.value,
  selectedActionTypes: selectedActionTypes.value,
  sortOrder: (sortOrder.value as ResolutionsFilter['sortOrder']) ?? 'newest',
  meeting: meetingFilter.value,
}))

const filteredResolutions = computed(() =>
  filterResolutions(resolutions.value, filterModel.value, search),
)

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
        ? `${formatNumber(totalResolutions)} resolutions from ${formatNumber(totalMeetings)} plenary meetings and committee ballots, spanning ${yearRange.earliest} to ${yearRange.latest}. ${committee.tagline}.`
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

      <div class="std-filter std-filter--elevated">
        <div class="std-filter__search">
          <svg class="std-filter__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref="searchInputRef"
            type="search"
            v-model="searchQuery"
            class="std-filter__search-input"
            placeholder="Search by topic, number, or keyword…"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search resolutions"
          />
        </div>
        <div class="std-filter__controls">
          <div class="std-filter__field">
            <span class="std-filter__label">Filter by Year</span>
            <div class="std-filter__chips">
              <button class="std-chip" :class="{ 'is-active': selectedYear === '' }" @click="selectedYear = ''">All Years</button>
              <button
                v-for="year in availableYears"
                :key="year"
                class="std-chip"
                :class="{ 'is-active': selectedYear === year }"
                @click="selectedYear = year"
              >{{ year }}</button>
            </div>
          </div>

          <div class="std-filter__field" v-if="topActionTypes.length">
            <span class="std-filter__label">Filter by Action</span>
            <div class="std-filter__chips">
              <button class="std-chip" :class="{ 'is-active': selectedActionTypes.size === 0 }" @click="selectedActionTypes.clear()">All Actions</button>
              <button
                v-for="action in topActionTypes"
                :key="action"
                class="std-chip"
                :class="{ 'is-active': selectedActionTypes.has(action) }"
                @click="toggleActionType(action)"
              >
                <span class="chip-color-dot" :style="{ '--dot-bg': getActionColor(action).bg }"></span>
                {{ action }}
              </button>
            </div>
          </div>

          <div class="std-filter__field std-filter__field--flex-end">
            <div class="sort-dropdown-container">
              <label for="sort-dropdown" class="sr-only">Sort By</label>
              <select id="sort-dropdown" v-model="sortOrder" class="sort-dropdown">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_actions">Most Actions</option>
              </select>
              <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div class="active-filters-bar" v-if="searchQuery || selectedYear || selectedActionTypes.size > 0">
          <span class="active-filters-label">Active Filters:</span>
          <div class="active-filter-chips">
            <button v-if="searchQuery" class="active-filter-chip" @click="searchQuery = ''">
              "{{ searchQuery }}" <span class="filter-remove">&times;</span>
            </button>
            <button v-if="selectedYear" class="active-filter-chip" @click="selectedYear = ''">
              {{ selectedYear }} <span class="filter-remove">&times;</span>
            </button>
            <button v-for="act in Array.from(selectedActionTypes)" :key="act" class="active-filter-chip" @click="toggleActionType(act)">
              {{ act }} <span class="filter-remove">&times;</span>
            </button>
            <button class="active-filter-clear" @click="clearAllFilters">Clear All</button>
          </div>
        </div>

        <div class="std-filter__meta">
          <span>Showing {{ filteredResolutions.length }} of {{ totalResolutions }} resolutions</span>
          <button class="legend-toggle" @click="isLegendOpen = !isLegendOpen">
            {{ isLegendOpen ? 'Hide Legend' : 'View Action Legend' }}
          </button>
        </div>

        <div v-show="isLegendOpen" class="action-legend">
          <div v-for="action in allActionTypes" :key="action" class="legend-item">
            <span class="legend-color" :style="{ '--legend-bg': getActionColor(action).bg }"></span>
            <span class="legend-label">{{ action }}</span>
          </div>
        </div>
      </div>

      <div class="std-results" v-if="isLoaded">
        <RouterLink
          v-for="(res, index) in paginatedResolutions"
          :key="res.source_type + '/' + res.source_file + '/' + res.id"
          :to="res.path"
          class="std-results__card meeting-card animate-card"
          :style="`--nth: ${index % limit}`"
        >
          <div class="card-header-row">
            <div class="std-results__name">
              <span v-if="res.is_acclamation" class="std-results__type type-acclamation">Acclamation</span>
              <template v-else>
                <span>{{ res.id }}</span>
                <span class="std-results__type">{{ res.source_type === 'plenary' ? 'Plenary' : res.source_type }}</span>
              </template>
            </div>
            <span class="badge-year">{{ res.year }}</span>
          </div>

          <div class="std-results__title meeting-card__title">
            <span v-html="highlightText(res.is_acclamation ? 'Acclamation' : (res.title || 'Resolution ' + res.id), searchQuery)"></span>
          </div>

          <div v-if="res.snippet" class="std-results__snippet snippet-text">
            <span v-html="highlightText(res.snippet, searchQuery)"></span>
          </div>

          <div class="card-footer">
            <div class="card-actions-chips" v-if="getUniqueActions(res).length">
              <span
                v-for="actType in getUniqueActions(res).slice(0, 3)"
                :key="actType"
                class="action-chip"
                :style="{ '--chip-bg': getActionColor(actType).bg, '--chip-text': getActionColor(actType).text }"
              >{{ actType }}</span>
              <span v-if="getUniqueActions(res).length > 3" class="action-chip action-chip--more">+{{ getUniqueActions(res).length - 3 }} more</span>
            </div>

            <div class="card-meta-bottom">
              <span v-if="res.meeting_date" class="std-results__badge badge-date">{{ formatDate(res.meeting_date) }}</span>
              <span v-if="res.venue" class="std-results__badge badge-venue truncate-text">{{ res.venue }}</span>
            </div>
            <div class="card-hover-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </div>
        </RouterLink>

        <div v-if="filteredResolutions.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3>No results found</h3>
          <p>Try adjusting your search or filtering by a different criteria.</p>
          <div class="empty-state__suggestions">
            <p class="suggestions-label">Try searching for:</p>
            <div class="suggestions-chips">
              <button class="std-chip" @click="searchQuery = 'resolves'">resolves</button>
              <button class="std-chip" @click="searchQuery = 'approves'">approves</button>
              <button class="std-chip" @click="searchQuery = 'ISO 8601'">ISO 8601</button>
              <button class="std-chip" @click="searchQuery = 'EDIFACT'">EDIFACT</button>
            </div>
          </div>
          <button class="std-chip btn-mt" @click="clearAllFilters">Clear all filters</button>
        </div>
      </div>

      <div v-else class="loading-container">
        <div class="skeleton-grid">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skeleton-badge"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-title w-3-4"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-footer">
              <div class="skeleton-badge"></div>
              <div class="skeleton-badge"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" class="std-chip load-more-btn">Load More</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.res-page-wrap { display: flex; flex-direction: column; }

/* Pull the results section up into the hero's shadow so the elevated
   filter card overlaps the hero bottom, eliminating the dead strip
   that the default .ph margin + res-page padding was creating. */
.res-page-wrap :deep(.ph) {
  margin-bottom: 0;
  padding-bottom: 2rem;
}
.res-page-wrap :deep(.ph__actions) {
  margin-top: 2rem;
}

/* HERO buttons (slotted into PageHero #actions) */
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
  box-shadow: 0 4px 6px -1px rgb(185 28 28 / 0.3), 0 2px 4px -1px rgb(185 28 28 / 0.2);
}
.hero-btn--primary:hover, .hero-btn--primary:focus-visible {
  background-color: #7f1313;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(185 28 28 / 0.4), 0 4px 6px -2px rgb(185 28 28 / 0.2);
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

.animate-card {
  opacity: 0;
  transform: translateY(15px);
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.03s);
}

.std-filter--elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin-top: -2rem;
  position: relative;
  z-index: 20;
}
.dark .std-filter--elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  border-color: rgba(51, 65, 85, 0.8);
}

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
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500);
}
.dark .meeting-filter-banner__label { color: var(--color-slate-400); }
.meeting-filter-banner__name {
  font-weight: 600;
  color: var(--color-brand);
}
.dark .meeting-filter-banner__name { color: #ff7d82; }
.meeting-filter-banner__clear {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  color: var(--color-slate-500);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}
.dark .meeting-filter-banner__clear { color: var(--color-slate-300); }
.meeting-filter-banner__clear:hover {
  color: var(--color-brand);
  background: rgba(227, 0, 15, 0.06);
}
.dark .meeting-filter-banner__clear:hover {
  color: #ff7d82;
  background: rgba(255, 94, 99, 0.08);
}

.std-filter__search {
  position: relative;
  margin-bottom: 1.25rem;
}
.std-filter__search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a8a29e;
  pointer-events: none;
}
.std-filter__search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 1px solid #d6d3d1;
  border-radius: 0.5rem;
  background: #fafaf9;
  color: #1c1917;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  -webkit-appearance: none;
  appearance: textfield;
}
.std-filter__search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
.std-filter__search-input:focus {
  outline: none;
  border-color: var(--color-blue-accent);
  background: #fff;
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}
.dark .std-filter__search-input {
  background: #292524;
  border-color: #57534e;
  color: #fafaf9;
}
.dark .std-filter__search-input:focus {
  border-color: #5379bf;
  background: #1c1917;
}
.dark .std-filter__search-icon { color: #a8a29e; }

.std-filter__controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .std-filter__controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
}
.std-filter__field--flex-end {
  margin-left: auto;
  align-self: flex-start;
}

.chip-color-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--dot-bg);
  margin-right: 0.375rem;
}

.sort-dropdown-container {
  position: relative;
  display: flex;
  align-items: center;
}
.sort-dropdown {
  appearance: none;
  background: white;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-700);
  cursor: pointer;
  transition: all 0.2s;
}
.dark .sort-dropdown {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-200);
}
.sort-dropdown:focus-visible {
  outline: none;
  border-color: var(--color-blue-accent);
  box-shadow: 0 0 0 2px rgba(0, 97, 173, 0.2);
}
.sort-icon {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  color: var(--color-slate-500);
}

.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px dashed var(--color-slate-200);
  flex-wrap: wrap;
}
.dark .active-filters-bar { border-top-color: var(--color-slate-700); }
.active-filters-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  text-transform: uppercase;
}
.active-filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background-color: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-700);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.dark .active-filter-chip {
  background-color: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-200);
}
.active-filter-chip:hover { background-color: var(--color-slate-200); }
.dark .active-filter-chip:hover { background-color: var(--color-slate-700); }
.filter-remove { font-size: 1rem; line-height: 1; }
.active-filter-clear {
  background: none;
  border: none;
  color: var(--color-blue-accent);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}
.active-filter-clear:hover { text-decoration: underline; }

.std-filter__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-slate-100);
  flex-wrap: wrap;
}
.dark .std-filter__meta { border-top-color: var(--color-slate-800); }
.std-filter__meta > span:first-child {
  font-size: 0.8125rem;
  color: var(--color-slate-600);
  font-weight: 500;
}
.dark .std-filter__meta > span:first-child { color: var(--color-slate-400); }
.legend-toggle {
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-600);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
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
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-300);
}
.dark .legend-toggle:hover {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
}

.action-legend {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-slate-50);
  border-radius: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.dark .action-legend { background: var(--color-slate-800); }
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-slate-700);
}
.dark .legend-item { color: var(--color-slate-300); }
.legend-color {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.25rem;
  background-color: var(--legend-bg);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.badge-year {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  background: var(--color-slate-100);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
.dark .badge-year {
  background: var(--color-slate-800);
  color: var(--color-slate-400);
}
.type-acclamation {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
  font-size: 0.75rem !important;
}
.dark .type-acclamation {
  background: rgba(99, 102, 241, 0.2) !important;
  color: #818cf8 !important;
}
:deep(.search-highlight) {
  background-color: rgba(250, 204, 21, 0.4);
  color: inherit;
  border-radius: 0.125rem;
  padding: 0 0.125rem;
}
.dark :deep(.search-highlight) { background-color: rgba(234, 179, 8, 0.3); }

.snippet-text {
  font-size: 0.875rem;
  color: var(--color-slate-500);
  margin-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  position: relative;
}
.card-actions-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.action-chip {
  background-color: var(--chip-bg);
  color: var(--chip-text);
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.action-chip--more {
  background-color: var(--color-slate-100);
  color: var(--color-slate-600);
  border: 1px solid var(--color-slate-200);
}
.dark .action-chip--more {
  background-color: var(--color-slate-800);
  color: var(--color-slate-300);
  border-color: var(--color-slate-700);
}
.card-meta-bottom {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
}
.badge-venue { max-width: 150px; }
.card-hover-arrow {
  position: absolute;
  bottom: 0;
  right: 0;
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.meeting-card:hover .card-hover-arrow {
  opacity: 1;
  transform: translateX(0);
}
.meeting-card {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
}
.meeting-card:hover, .meeting-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-color: var(--color-blue-accent);
  outline: none;
}
.dark .meeting-card:hover, .dark .meeting-card:focus-visible {
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
}
.meeting-card__title {
  transition: color 0.3s;
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.125rem !important;
  color: var(--color-slate-900) !important;
  line-height: 1.3;
}
.dark .meeting-card__title { color: white !important; }
.meeting-card:hover .meeting-card__title { color: var(--color-blue-accent) !important; }
.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 1rem;
  border: 1px dashed var(--color-slate-300);
}
.dark .empty-state {
  background: var(--color-slate-900);
  border-color: var(--color-slate-700);
}
.empty-state__icon {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1.5rem;
  color: var(--color-slate-400);
}
.dark .empty-state__icon { color: var(--color-slate-600); }
.empty-state h3 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-slate-900);
  margin-bottom: 0.75rem;
}
.dark .empty-state h3 { color: white; }
.empty-state p { color: var(--color-slate-500); }
.empty-state__suggestions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-100);
}
.dark .empty-state__suggestions { border-top-color: var(--color-slate-800); }
.suggestions-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-slate-600) !important;
}
.suggestions-chips {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-mt { margin-top: 2rem; }

.load-more-container {
  margin-top: 3rem;
  text-align: center;
}
.load-more-btn {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem 2rem;
  background-color: white;
  border: 1px solid var(--color-slate-200);
}
.load-more-btn:hover {
  background-color: var(--color-slate-50);
  color: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
}
.dark .load-more-btn {
  background-color: var(--color-slate-800);
  border-color: var(--color-slate-700);
}
.dark .load-more-btn:hover { background-color: var(--color-slate-700); }

.loading-container { padding: 2.5rem 0; width: 100%; }
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 0.75rem;
}
.skeleton-card {
  padding: 1.25rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-slate-200);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.dark .skeleton-card {
  background: rgb(15 23 42 / 0.4);
  border-color: var(--color-slate-800);
}
.skeleton-badge {
  height: 1rem;
  width: 4rem;
  border-radius: 9999px;
}
.skeleton-title {
  height: 1.5rem;
  width: 100%;
}
.w-3-4 { width: 75%; }
.skeleton-text {
  height: 1rem;
  width: 100%;
}
.skeleton-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
}
</style>
