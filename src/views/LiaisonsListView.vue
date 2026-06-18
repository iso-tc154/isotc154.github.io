<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLiaisons } from '../composables/useLiaisons'
import { useTheme } from '../composables/useTheme'
import type { Liaison } from '../types/organization'

const { liaisons, isLoaded, loadData } = useLiaisons()
const router = useRouter()
const { isDark } = useTheme()

const searchQuery = ref('')
const selectedCategory = ref('')

onMounted(() => { loadData() })

const categories = computed(() => {
  const set = new Set<string>()
  for (const l of liaisons.value) if (l.category) set.add(l.category)
  return Array.from(set).sort()
})

const filtered = computed<Liaison[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return liaisons.value
    .filter(l => !selectedCategory.value || l.category === selectedCategory.value)
    .filter(l => {
      if (!q) return true
      return `${l.name} ${l.short_name ?? ''} ${l.description ?? ''}`.toLowerCase().includes(q)
    })
    .sort((a, b) => (a.short_name ?? a.name).localeCompare(b.short_name ?? b.name))
})

function liaisonUrl(l: Liaison): string {
  return `/liaisons/${l.id}/`
}

function logoUrl(l: Liaison): string | null {
  const explicit = isDark.value ? (l.logo_dark ?? l.logo_light) : (l.logo_light ?? l.logo_dark)
  const candidate = explicit ?? l.logo
  if (!candidate) return null
  if (candidate.startsWith('http') || candidate.startsWith('/')) return candidate
  return `/assets/images/liaisons/${candidate}`
}

function categoryLabel(cat: string): string {
  if (cat === 'A') return 'Category A'
  if (cat === 'B') return 'Category B'
  if (cat === 'C') return 'Category C'
  if (cat === 'D') return 'Category D'
  return cat
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="page__eyebrow">External organizations</p>
      <h1>Liaisons</h1>
      <p class="page__lead">
        Organizations in liaison with ISO/TC 154 — Category A (active cooperation),
        Category B (kept informed), and other external partners.
      </p>
    </header>

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
          placeholder="Search by name…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search liaisons"
        />
      </div>
      <div class="filter__controls">
        <div class="filter__field">
          <span class="filter__label">Category</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedCategory === '' }" @click="selectedCategory = ''">All</button>
            <button v-for="c in categories" :key="c"
              class="chip" :class="{ 'chip--active': selectedCategory === c }"
              @click="selectedCategory = c">{{ categoryLabel(c) }}</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filtered.length }} of {{ liaisons.length }} liaisons</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading liaisons…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No liaisons match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedCategory=''">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="l in filtered" :key="l.id">
        <a :href="liaisonUrl(l)" class="card" @click.prevent="router.push(liaisonUrl(l))">
          <div class="card__logo">
            <img v-if="logoUrl(l)" :src="logoUrl(l) ?? undefined" :alt="l.short_name ?? l.name" loading="lazy" />
            <span v-else class="card__logo-fallback">{{ (l.short_name ?? l.name).charAt(0) }}</span>
          </div>
          <div class="card__body">
            <h3 class="card__name">{{ l.short_name ?? l.name }}</h3>
            <p class="card__full-name" v-if="l.short_name">{{ l.name }}</p>
            <span class="card__category">{{ categoryLabel(l.category ?? '?') }}</span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page { max-width: 80rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.page__header { margin-bottom: 2rem; }
.page__eyebrow { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-blue-accent); margin: 0 0 0.5rem; }
.dark .page__eyebrow { color: #94b6e8; }
.page__header h1 { font-family: var(--font-serif); font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; color: #1c1917; margin: 0 0 0.75rem; }
.dark .page__header h1 { color: #fafaf9; }
.page__lead { font-size: 1rem; line-height: 1.6; color: #57534e; max-width: 48rem; margin: 0; }
.dark .page__lead { color: #d6d3d1; }

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

.card { display: flex; gap: 1rem; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e7e5e4; background: #fff; text-decoration: none; color: inherit; transition: all 0.2s; height: 100%; }
.dark .card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.card:hover { border-color: var(--color-blue-accent); box-shadow: 0 4px 12px rgb(30 58 138 / 0.08); transform: translateY(-2px); }
.dark .card:hover { border-color: #5379bf; box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }

.card__logo { width: 4rem; height: 4rem; border-radius: 0.5rem; background: #fafaf9; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 0.5rem; }
.dark .card__logo { background: #292524; }
.card__logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.card__logo-fallback { font-size: 1.5rem; font-weight: 700; color: var(--color-blue-accent); }
.dark .card__logo-fallback { color: #94b6e8; }
.card__body { flex: 1; min-width: 0; }
.card__name { font-size: 1rem; font-weight: 600; color: #1c1917; margin: 0 0 0.125rem; }
.dark .card__name { color: #fafaf9; }
.card__full-name { font-size: 0.8125rem; color: #78716c; margin: 0 0 0.5rem; line-height: 1.4; }
.dark .card__full-name { color: #a8a29e; }
.card__category { display: inline-block; padding: 0.125rem 0.5rem; background: #e0e7ff; color: var(--color-blue-accent); border-radius: 0.25rem; font-size: 0.6875rem; font-weight: 600; }
.dark .card__category { background: rgb(51 133 214 / 0.2); color: #94b6e8; }
</style>
