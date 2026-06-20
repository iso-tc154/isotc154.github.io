<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjects } from '../composables/useProjects'
import { projectStatusLabel, type Project } from '../types/project'
import PageHero from '../components/PageHero.vue'

const { projects, isLoaded, loadData } = useProjects()
const router = useRouter()

const searchQuery = ref('')
const selectedStatus = ref('')

onMounted(() => { loadData() })

const statuses = computed(() => {
  const set = new Set<string>()
  for (const p of projects.value) if (p.status) set.add(p.status)
  return Array.from(set).sort()
})

const stats = computed(() => ({
  total: projects.value.length,
  active: projects.value.filter(p => p.status === 'current' || p.status === 'under_development' || p.status === 'under-development').length,
  stages: statuses.value.length,
}))

const filtered = computed<Project[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return projects.value
    .filter(p => !selectedStatus.value || p.status === selectedStatus.value)
    .filter(p => {
      if (!q) return true
      return `${p.name} ${p.title ?? ''}`.toLowerCase().includes(q)
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
})

function projectUrl(p: Project): string {
  return `/projects/${p.id}/`
}
</script>

<template>
  <div class="page">
    <PageHero
      variant="index"
      eyebrow="Work in progress"
      title="Projects"
      lead="New standards under development by ISO/TC 154 — at AWI, NP, WD, CD, DIS, FDIS, and other ISO stages."
    >
      <dl class="page__stats" v-if="isLoaded">
        <div><dt>{{ stats.total }}</dt><dd>projects</dd></div>
        <div><dt>{{ stats.active }}</dt><dd>active</dd></div>
        <div><dt>{{ stats.stages }}</dt><dd>distinct stages</dd></div>
      </dl>
    </PageHero>

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
          placeholder="Search by project name or title…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search projects"
        />
      </div>
      <div class="filter__controls" v-if="statuses.length">
        <div class="filter__field">
          <span class="filter__label">Status</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedStatus === '' }" @click="selectedStatus = ''">All</button>
            <button v-for="s in statuses" :key="s"
              class="chip" :class="{ 'chip--active': selectedStatus === s }"
              @click="selectedStatus = s">{{ projectStatusLabel(s) }}</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filtered.length }} of {{ projects.length }} projects</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading projects…</div>
    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No projects match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedStatus=''">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="p in filtered" :key="p.id">
        <a :href="projectUrl(p)" class="card"
          :class="`card--${p.status ?? 'unknown'}`"
          @click.prevent="router.push(projectUrl(p))">
          <div class="card__top">
            <span class="card__name">{{ p.name }}</span>
            <span v-if="p.stage" class="card__stage">{{ p.stage }}</span>
          </div>
          <p class="card__title" v-if="p.title">{{ p.title }}</p>
          <div class="card__bottom">
            <span class="card__status">{{ projectStatusLabel(p.status) }}</span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page { max-width: 80rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

.filter { background: #fff; border: 1px solid #e7e5e4; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 2rem; }
.dark .filter { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.filter__search-wrap { position: relative; margin-bottom: 1rem; }
.filter__search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #a8a29e; pointer-events: none; }
.filter__search { width: 100%; padding: 0.625rem 0.875rem 0.625rem 2.25rem; border-radius: 0.5rem; border: 1px solid #d6d3d1; background: #fafaf9; color: #1c1917; font-size: 0.9375rem; font-family: inherit; }
.filter__search:focus { outline: none; border-color: var(--color-blue-accent); background: #fff; box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15); }
.dark .filter__search { background: #292524; border-color: #57534e; color: #fafaf9; }
.dark .filter__search:focus { border-color: #5379bf; background: #1c1917; }
.filter__controls { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-end; }
.filter__field { display: flex; flex-direction: column; gap: 0.5rem; }
.filter__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; }
.dark .filter__label { color: #a8a29e; }
.filter__chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip { display: inline-flex; align-items: center; padding: 0.375rem 0.75rem; border-radius: 9999px; border: 1px solid #d6d3d1; background: #fff; color: #57534e; font-size: 0.8125rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.chip:hover { border-color: var(--color-blue-accent); color: var(--color-blue-accent); }
.chip--active { background: var(--color-blue-accent); border-color: var(--color-blue-accent); color: #fff; }
.dark .chip { background: #292524; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: #5379bf; color: #94b6e8; }
.dark .chip--active { background: #5379bf; border-color: #5379bf; color: #fff; }
.filter__meta { margin-top: 1rem; font-size: 0.875rem; color: #78716c; }
.dark .filter__meta { color: #a8a29e; }

.loading, .empty { padding: 3rem 1rem; text-align: center; color: #78716c; }
.empty h3 { color: #1c1917; margin: 0 0 0.75rem; }
.dark .empty h3 { color: #fafaf9; }
.dark .loading, .dark .empty { color: #a8a29e; }

.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.75rem; }
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.card { display: block; height: 100%; padding: 1rem; border-radius: 0.625rem; border: 1px solid #e7e5e4; background: #fff; text-decoration: none; color: inherit; transition: all 0.2s; border-left-width: 3px; }
.dark .card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.card--current { border-left-color: var(--color-blue-accent); }
.card--deleted { border-left-color: var(--color-iso-red); }
.card--withdrawn { border-left-color: #a8a29e; }
.card--under-development { border-left-color: #f59e0b; }
.card:hover { border-color: var(--color-blue-accent); box-shadow: 0 4px 12px rgb(30 58 138 / 0.08); transform: translateY(-2px); }
.dark .card:hover { border-color: #5379bf; box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }
.card__top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.25rem; }
.card__name { font-family: ui-monospace, monospace; font-size: 0.875rem; font-weight: 700; color: #1c1917; }
.dark .card__name { color: #fafaf9; }
.card__stage { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: #f5f5f4; color: #57534e; flex-shrink: 0; }
.dark .card__stage { background: #292524; color: #d6d3d1; }
.card__title { font-size: 0.875rem; line-height: 1.5; color: #57534e; margin: 0 0 0.75rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.dark .card__title { color: #d6d3d1; }
.card__bottom { display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center; }
.card__status { font-size: 0.6875rem; font-weight: 600; text-transform: capitalize; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: #f5f5f4; color: #57534e; }
.dark .card__status { background: #292524; color: #d6d3d1; }
</style>
