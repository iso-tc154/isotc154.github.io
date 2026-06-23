<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStandards } from '../composables/useStandards'
import { useGroups } from '../composables/useGroups'
import { standardStatusLabel, standardUrl } from '../domain/standardPresentation'
import type { Standard } from '../types/standard'
import PageHero from '../components/PageHero.vue'

const { standards, isLoaded, loadData } = useStandards()
const { loadData: loadGroups, get: getGroup } = useGroups()
const route = useRoute()
const router = useRouter()

const searchQuery = ref((route.query.q as string) || '')
const selectedStatus = ref('')
const selectedGroup = ref('')
const selectedType = ref('')

onMounted(async () => {
  await Promise.all([loadData(), loadGroups()])
})

const availableStatuses = computed<string[]>(() => {
  const set = new Set<string>()
  for (const s of standards.value) {
    if (s.tc154?.status) set.add(s.tc154.status)
    else set.add('published')
  }
  return Array.from(set).sort()
})

const availableGroups = computed<string[]>(() => {
  const set = new Set<string>()
  for (const s of standards.value) {
    if (s.tc154?.group) set.add(s.tc154.group)
  }
  return Array.from(set).sort()
})

const availableTypes = computed<string[]>(() => {
  const set = new Set<string>()
  for (const s of standards.value) {
    if (s.iso?.type) set.add(s.iso.type)
  }
  return Array.from(set).sort()
})

const filtered = computed<Standard[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return standards.value.filter(s => {
    const status = s.tc154?.status ?? 'published'
    if (selectedStatus.value && status !== selectedStatus.value) return false
    if (selectedGroup.value && s.tc154?.group !== selectedGroup.value) return false
    if (selectedType.value && s.iso?.type !== selectedType.value) return false
    if (q) {
      const hay = `${s.iso?.name ?? ''} ${s.iso?.title ?? ''} ${s.iso?.ics ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    const validDate = (s: Standard) => {
      const d = s.iso?.publication_date
      if (!d) return ''
      const year = parseInt(d.substring(0, 4), 10)
      if (year > 2026 || year < 1900) return ''
      return d
    }
    const ad = validDate(a)
    const bd = validDate(b)
    if (ad && bd) return bd.localeCompare(ad)
    if (ad) return -1
    if (bd) return 1
    return (a.iso?.name ?? '').localeCompare(b.iso?.name ?? '', undefined, { numeric: true })
  })
})

function statusLabel(s: Standard): string {
  return standardStatusLabel(s.tc154?.status ?? 'published')
}

function groupLabel(g?: string): string {
  if (!g) return ''
  return getGroup(g)?.title ?? g
}

function publicationYear(s: Standard): string {
  const d = s.iso?.publication_date
  if (!d) return ''
  const year = parseInt(d.substring(0, 4), 10)
  if (year > 2026 || year < 1900) return ''
  return String(year)
}
</script>

<template>
  <div>
    <PageHero
      variant="index"
      bleed
      eyebrow="Published deliverables"
      title="Standards"
      lead="Published International Standards, Technical Specifications, Technical Reports, and standards under development by ISO/TC 154."
    >
      <template #decoration>
        <div class="hero-pattern hero-pattern--dots"></div>
      </template>
      <dl class="page__stats" v-if="isLoaded">
        <div><dt>{{ standards.length }}</dt><dd>total</dd></div>
        <div><dt>{{ availableStatuses.length }}</dt><dd>statuses</dd></div>
        <div><dt>{{ availableTypes.length }}</dt><dd>deliverable types</dd></div>
      </dl>
    </PageHero>

    <div class="page page--wide">
    <div class="filter">
      <div class="filter__search-wrap">
        <svg class="filter__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          v-model="searchQuery"
          class="filter__search"
          placeholder="Search by ISO number, title or ICS code…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search standards"
        />
      </div>
      <div class="filter__controls">
        <div class="filter__field">
          <span class="filter__label">Status</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedStatus === '' }" @click="selectedStatus = ''">All</button>
            <button v-for="s in availableStatuses" :key="s"
              class="chip" :class="{ 'chip--active': selectedStatus === s }"
              @click="selectedStatus = s">{{ standardStatusLabel(s) }}</button>
          </div>
        </div>
        <div class="filter__field" v-if="availableGroups.length">
          <span class="filter__label">Group</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedGroup === '' }" @click="selectedGroup = ''">Any</button>
            <button v-for="g in availableGroups" :key="g"
              class="chip" :class="{ 'chip--active': selectedGroup === g }"
              @click="selectedGroup = g">{{ g }}</button>
          </div>
        </div>
        <div class="filter__field" v-if="availableTypes.length">
          <span class="filter__label">Type</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedType === '' }" @click="selectedType = ''">Any</button>
            <button v-for="t in availableTypes" :key="t"
              class="chip" :class="{ 'chip--active': selectedType === t }"
              @click="selectedType = t">{{ t === 'international' ? 'IS' : t }}</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filtered.length }} of {{ standards.length }} standards</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading standards…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No standards match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedStatus=''; selectedGroup=''; selectedType=''">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="s in filtered" :key="s.id">
        <a :href="standardUrl(s)" class="card"
          :class="`card--${s.tc154?.status ?? 'published'}`"
          @click.prevent="router.push(standardUrl(s))">
          <div class="card__top">
            <span class="card__name">{{ s.iso?.name }}</span>
            <span class="card__year" v-if="publicationYear(s)">{{ publicationYear(s) }}</span>
          </div>
          <p class="card__title">{{ s.iso?.title }}</p>
          <div class="card__bottom">
            <span class="card__status">{{ statusLabel(s) }}</span>
            <span v-if="s.tc154?.group" class="card__group">{{ groupLabel(s.tc154.group) }}</span>
            <span v-if="s.iso?.type && s.iso.type !== 'international'" class="card__type">{{ s.iso.type }}</span>
          </div>
        </a>
      </li>
    </ul>
    </div>
  </div>
</template>

<style scoped>

.filter {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 2rem;
}
.dark .filter { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.filter__search-wrap { position: relative; margin-bottom: 1rem; }
.filter__search-icon {
  position: absolute; left: 0.75rem; top: 50%;
  transform: translateY(-50%);
  color: #a8a29e;
  pointer-events: none;
}
.filter__search {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid #d6d3d1;
  background: #fafaf9;
  color: #1c1917;
  font-size: 0.9375rem;
  font-family: inherit;
}
.filter__search:focus {
  outline: none;
  border-color: var(--color-blue-accent);
  background: #fff;
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}
.dark .filter__search { background: #292524; border-color: #57534e; color: #fafaf9; }
.dark .filter__search:focus { border-color: #5379bf; background: #1c1917; }
.filter__controls { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-end; }
.filter__field { display: flex; flex-direction: column; gap: 0.5rem; }
.filter__label {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #78716c;
}
.dark .filter__label { color: #a8a29e; }
.filter__chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip {
  display: inline-flex; align-items: center;
  padding: 0.375rem 0.75rem; border-radius: 9999px;
  border: 1px solid #d6d3d1; background: #fff; color: #57534e;
  font-size: 0.8125rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: all 0.15s;
}
.chip:hover { border-color: var(--color-blue-accent); color: var(--color-blue-accent); }
.chip--active { background: var(--color-blue-accent); border-color: var(--color-blue-accent); color: #fff; }
.dark .chip { background: #292524; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: #5379bf; }
.dark .chip--active { background: #5379bf; border-color: #5379bf; color: #fff; }
.filter__meta { margin-top: 1rem; font-size: 0.875rem; color: #78716c; }
.dark .filter__meta { color: #a8a29e; }

.loading, .empty {
  padding: 3rem 1rem;
  text-align: center;
  color: #78716c;
}
.empty h3 { color: #1c1917; margin: 0 0 0.75rem; }
.dark .empty h3 { color: #fafaf9; }
.dark .loading, .dark .empty { color: #a8a29e; }

.grid {
  list-style: none; margin: 0; padding: 0;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
}
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.card {
  display: block;
  height: 100%;
  padding: 1rem;
  border-radius: 0.625rem;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border-left-width: 3px;
}
.dark .card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.card--published { border-left-color: #10b981; }
.card--withdrawn { border-left-color: #a8a29e; }
.card--deleted { border-left-color: var(--color-iso-red); }
.card--under_development { border-left-color: var(--color-blue-accent); }
.card:hover {
  border-color: var(--color-blue-accent);
  box-shadow: 0 4px 12px rgb(30 58 138 / 0.08);
  transform: translateY(-2px);
}
.dark .card:hover { border-color: #5379bf; box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }
.card__top {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 0.5rem; margin-bottom: 0.25rem;
}
.card__name {
  font-family: ui-monospace, monospace;
  font-size: 0.9375rem; font-weight: 700;
  color: #1c1917;
}
.dark .card__name { color: #fafaf9; }
.card__year {
  font-size: 0.75rem;
  color: #78716c;
  flex-shrink: 0;
}
.dark .card__year { color: #a8a29e; }
.card__title {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #57534e;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .card__title { color: #d6d3d1; }
.card__bottom {
  display: flex; flex-wrap: wrap; gap: 0.375rem;
  align-items: center;
}
.card__status {
  font-size: 0.6875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: #f5f5f4;
  color: #57534e;
}
.dark .card__status { background: #292524; color: #d6d3d1; }
.card__group, .card__type {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: #e0e7ff;
  color: var(--color-blue-accent);
  font-weight: 600;
}
.dark .card__group, .dark .card__type { background: rgb(51 133 214 / 0.2); }
</style>
