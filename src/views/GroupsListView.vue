<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { groupCategoryLabel, type Group } from '../types/group'
import { useRouter } from 'vue-router'
import PageHero from '../components/PageHero.vue'

const { groups, isLoaded, loadData } = useGroups()
const { loadData: loadMembers, get: getMember } = useMembers()
const router = useRouter()

onMounted(async () => {
  await Promise.all([loadData(), loadMembers()])
})

const searchQuery = ref('')
const selectedCategory = ref('')

const categories = computed(() => {
  const set = new Set<string>()
  for (const g of groups.value) if (g.category) set.add(g.category)
  return Array.from(set).sort()
})

const stats = computed(() => ({
  total: groups.value.length,
  categories: categories.value.length,
  withStandards: groups.value.filter(g => g.standards?.length).length,
}))

const filtered = computed<Group[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return groups.value
    .filter(g => !selectedCategory.value || g.category === selectedCategory.value)
    .filter(g => {
      if (!q) return true
      return (
        g.name.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        (g.intro ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

function groupUrl(g: Group) {
  return `/groups/${g.id}/`
}

function convenorNames(g: Group): string {
  const ids = g.convenors ?? []
  const names = ids.map(id => getMember(id)?.name).filter(Boolean) as string[]
  if (names.length) return names.join(', ')
  return ids.join(', ')
}

function memberCount(g: Group): number {
  return (g.members ?? []).length
}
</script>

<script lang="ts">
import { ref } from 'vue'
</script>

<template>
  <div>
    <PageHero
      variant="index"
      bleed
      eyebrow="Working groups & structure"
      title="Groups"
      lead="Working Groups, Advisory Groups, Maintenance Agencies and the Co-ordination Advisory Group that carry out the technical work of ISO/TC 154."
    >
      <template #decoration>
        <div class="hero-pattern hero-pattern--rings"></div>
      </template>
      <dl class="page__stats" v-if="isLoaded">
        <div><dt>{{ stats.total }}</dt><dd>groups</dd></div>
        <div><dt>{{ stats.categories }}</dt><dd>categories</dd></div>
        <div><dt>{{ stats.withStandards }}</dt><dd>maintain standards</dd></div>
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
          placeholder="Search by name, title or intro…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search groups"
        />
      </div>
      <div class="filter__controls">
        <div class="filter__field">
          <span class="filter__label">Category</span>
          <div class="filter__chips">
            <button
              class="chip"
              :class="{ 'chip--active': selectedCategory === '' }"
              @click="selectedCategory = ''"
            >All</button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="chip"
              :class="{ 'chip--active': selectedCategory === cat }"
              @click="selectedCategory = cat"
            >{{ groupCategoryLabel(cat) }}</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filtered.length }} of {{ groups.length }} groups</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading groups…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No groups match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedCategory=''">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="g in filtered" :key="g.id">
        <a :href="groupUrl(g)" class="card" @click.prevent="router.push(groupUrl(g))">
          <div class="card__top">
            <span class="card__category">{{ groupCategoryLabel(g.category) }}</span>
            <span class="card__count" v-if="memberCount(g)">{{ memberCount(g) }} members</span>
          </div>
          <h3 class="card__name" v-html="g.name"></h3>
          <p class="card__title">{{ g.title }}</p>
          <p class="card__intro" v-if="g.intro">{{ g.intro }}</p>
          <p class="card__convenor" v-if="convenorNames(g)">
            <span class="card__convenor-label">Convenor:</span> {{ convenorNames(g) }}
          </p>
          <div class="card__standards" v-if="g.standards?.length">
            <span class="card__pill" v-for="s in g.standards.slice(0, 4)" :key="s">{{ s }}</span>
            <span class="card__pill card__pill--more" v-if="g.standards.length > 4">+{{ g.standards.length - 4 }}</span>
          </div>
          <span class="card__arrow">→</span>
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
.dark .filter {
  background: rgb(15 23 42 / 0.5);
  border-color: #44403c;
}
.filter__search-wrap { position: relative; margin-bottom: 1rem; }
.filter__search-icon {
  position: absolute;
  left: 0.75rem; top: 50%;
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
.dark .filter__search {
  background: #292524;
  border-color: #57534e;
  color: #fafaf9;
}
.dark .filter__search:focus {
  border-color: #5379bf;
  background: #1c1917;
}
.filter__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  align-items: flex-end;
}
.filter__field { display: flex; flex-direction: column; gap: 0.5rem; }
.filter__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #78716c;
}
.dark .filter__label { color: #a8a29e; }
.filter__chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #d6d3d1;
  background: #fff;
  color: #57534e;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--color-blue-accent); color: var(--color-blue-accent); }
.chip--active {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: #fff;
}
.dark .chip {
  background: #292524;
  border-color: #57534e;
  color: #d6d3d1;
}
.dark .chip:hover { border-color: #5379bf; }
.dark .chip--active { background: #5379bf; border-color: #5379bf; color: #fff; }
.filter__meta {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #78716c;
}
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
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.card {
  position: relative;
  display: block;
  height: 100%;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.dark .card {
  background: rgb(15 23 42 / 0.5);
  border-color: #44403c;
}
.card:hover {
  border-color: var(--color-blue-accent);
  box-shadow: 0 4px 12px rgb(30 58 138 / 0.08);
  transform: translateY(-2px);
}
.dark .card:hover {
  border-color: #5379bf;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
}
.card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.card__category {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-blue-accent);
}
.card__count {
  font-size: 0.75rem;
  color: #78716c;
}
.dark .card__count { color: #a8a29e; }
.card__name {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.25rem;
}
.dark .card__name { color: #fafaf9; }
.card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #44403c;
  margin: 0 0 0.5rem;
}
.dark .card__title { color: #d6d3d1; }
.card__intro {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #78716c;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .card__intro { color: #a8a29e; }
.card__convenor {
  font-size: 0.8125rem;
  color: #57534e;
  margin: 0 0 0.75rem;
}
.dark .card__convenor { color: #d6d3d1; }
.card__convenor-label { font-weight: 600; }
.card__standards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.card__pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: #f5f5f4;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #57534e;
  font-family: ui-monospace, monospace;
}
.dark .card__pill { background: #292524; color: #d6d3d1; }
.card__pill--more { background: #e0e7ff; color: var(--color-blue-accent); }
.dark .card__pill--more { background: rgb(51 133 214 / 0.2); }
.card__arrow {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1.125rem;
  color: var(--color-blue-accent);
}
.card:hover .card__arrow { transform: translateX(4px); }
.card__arrow { transition: transform 0.2s; }
</style>
