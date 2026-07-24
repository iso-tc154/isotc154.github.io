<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { useGroupRoster } from '../composables/useGroupRoster'
import { type Group } from '../types/group'
import {
  groupCategoryLabel,
  lifecycleStatus,
  lifecycleStatusLabel,
  establishedYear,
} from '../domain/groupPresentation'
import { useRouter } from 'vue-router'
import PageHero from '../components/PageHero.vue'
import FilterBar from '../components/FilterBar.vue'
import FilterChip from '../components/FilterChip.vue'
import FilterFacet from '../components/FilterFacet.vue'

const { groups, isLoaded, loadData } = useGroups()
const { loadData: loadMembers } = useMembers()
const roster = useGroupRoster()
const router = useRouter()

onMounted(async () => {
  await Promise.all([loadData(), loadMembers()])
})

const searchQuery = ref('')
const selectedCategory = ref('')
const activeOnly = ref(false)

const categories = computed(() => {
  const set = new Set<string>()
  for (const g of groups.value) if (g.category) set.add(g.category)
  return Array.from(set).sort()
})

function statusRank(g: Group): number {
  const s = lifecycleStatus(g)
  return s === 'active' ? 0 : s === 'inactive' ? 1 : 2
}

function lineageHaystack(g: Group): string {
  return [g.predecessor?.name, g.successor?.name].filter(Boolean).join(' ').toLowerCase()
}

const stats = computed(() => {
  const total = groups.value.length
  const active = groups.value.filter(g => lifecycleStatus(g) === 'active').length
  return {
    total,
    active,
    historical: total - active,
    categories: categories.value.length,
    withStandards: groups.value.filter(g => g.standards?.length).length,
  }
})

const filtered = computed<Group[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return groups.value
    .filter(g => !selectedCategory.value || g.category === selectedCategory.value)
    .filter(g => !activeOnly.value || lifecycleStatus(g) === 'active')
    .filter(g => {
      if (!q) return true
      const haystack = [
        g.name,
        g.title,
        g.intro ?? '',
        lineageHaystack(g),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
    .sort((a, b) => statusRank(a) - statusRank(b) || (a.order ?? 0) - (b.order ?? 0))
})

function groupUrl(g: Group) {
  return `/groups/${g.id}/`
}

function convenorNames(g: Group): string {
  return (g.convenors ?? []).map(roster.nameOf).join(', ')
}

function memberCount(g: Group): number {
  return (g.members ?? []).length
}
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
        <div><dt>{{ stats.active }}</dt><dd>active</dd></div>
        <div><dt>{{ stats.historical }}</dt><dd>historical</dd></div>
        <div><dt>{{ stats.categories }}</dt><dd>categories</dd></div>
        <div><dt>{{ stats.withStandards }}</dt><dd>maintain standards</dd></div>
      </dl>
    </PageHero>

    <div class="page page--wide">
    <FilterBar
      v-model="searchQuery"
      search-placeholder="Search by name, title or intro…"
      search-label="Search groups"
      :showing="filtered.length"
      :total="groups.length"
      total-label="groups"
      :clearable="!!searchQuery || !!selectedCategory || activeOnly"
      @clear="searchQuery = ''; selectedCategory = ''; activeOnly = false"
    >
      <template #facets>
        <FilterFacet label="Category">
          <FilterChip :active="selectedCategory === ''" @click="selectedCategory = ''">All</FilterChip>
          <FilterChip
            v-for="cat in categories"
            :key="cat"
            :active="selectedCategory === cat"
            @click="selectedCategory = cat"
          >{{ groupCategoryLabel(cat) }}</FilterChip>
        </FilterFacet>
        <FilterFacet label="Status">
          <FilterChip :active="!activeOnly" @click="activeOnly = false">All</FilterChip>
          <FilterChip :active="activeOnly" @click="activeOnly = true">Active only</FilterChip>
        </FilterFacet>
      </template>
    </FilterBar>

    <div v-if="!isLoaded" class="loading">Loading groups…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No groups match your filters</h3>
      <button class="chip chip--text" @click="searchQuery=''; selectedCategory=''">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="g in filtered" :key="g.id">
        <a :href="groupUrl(g)" :class="['card', `card--${lifecycleStatus(g)}`]" @click.prevent="router.push(groupUrl(g))">
          <div class="card__top">
            <div class="card__top-left">
              <span :class="['card__status', `card__status--${lifecycleStatus(g)}`]">
                <span class="card__status-dot" aria-hidden="true"></span>
                <span class="card__status-text">{{ lifecycleStatusLabel(lifecycleStatus(g)) }}</span>
              </span>
              <span class="card__category">{{ groupCategoryLabel(g.category) }}</span>
            </div>
            <span class="card__count" v-if="memberCount(g)">{{ memberCount(g) }} members</span>
          </div>
          <h3 class="card__name">{{ g.name }}</h3>
          <div class="card__meta">
            <span v-if="establishedYear(g)" class="card__est">Est. {{ establishedYear(g) }}</span>
          </div>
          <p class="card__title">{{ g.title }}</p>
          <p class="card__intro" v-if="g.intro">{{ g.intro }}</p>
          <p class="card__lineage" v-if="g.predecessor">
            <span class="card__lineage-arrow">↳</span>
            Succeeded {{ g.predecessor.name }}
          </p>
          <p class="card__lineage card__lineage--succ" v-else-if="g.successor">
            <span class="card__lineage-arrow">↳</span>
            Succeeded by {{ g.successor.name }}
          </p>
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
.chip--text {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid #d6d3d1;
  background: #fff;
  color: var(--color-blue-accent);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.chip--text:hover { background: var(--color-blue-accent); color: #fff; border-color: var(--color-blue-accent); }

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
.card__top-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.card__status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: currentColor;
  flex-shrink: 0;
}
.card__status--active { color: var(--color-brand); }
.card__status--inactive { color: var(--color-amber-warm); }
.card__status--inactive .card__status-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
}
.card__status--dissolved { color: var(--color-slate-500); }
.card__status--dissolved .card__status-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
}
.dark .card__status--dissolved { color: var(--color-slate-400); }

.card--dissolved .card__name {
  color: var(--color-slate-500);
}
.dark .card--dissolved .card__name {
  color: var(--color-slate-400);
}
.card--dissolved {
  opacity: 0.9;
}
.card--dissolved:hover { opacity: 1; }

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
  margin: 0 0 0.125rem;
}
.dark .card__name { color: #fafaf9; }
.card__meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  color: var(--color-slate-500);
}
.dark .card__meta { color: var(--color-slate-400); }
.card__est {
  font-family: var(--font-sans);
  font-weight: 500;
}
.card__lineage {
  font-size: 0.75rem;
  color: var(--color-slate-600);
  margin: 0 0 0.5rem;
  font-style: italic;
}
.dark .card__lineage { color: var(--color-slate-400); }
.card__lineage-arrow {
  font-family: var(--font-serif);
  font-style: normal;
  margin-right: 0.25rem;
}
.card__lineage--succ { color: var(--color-brand); }
.dark .card__lineage--succ { color: var(--color-blue-accent); }
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
