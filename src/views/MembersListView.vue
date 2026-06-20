<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMembers } from '../composables/useMembers'
import { useGroups } from '../composables/useGroups'
import type { Member } from '../types/member'
import { roleLabel } from '../utils/roles'

const { index, isLoaded, loadData } = useMembers()
const { groups, loadData: loadGroups } = useGroups()
const router = useRouter()

function groupLabel(gid: string): string {
  const g = groups.value.find(x => x.id === gid)
  return g?.name ?? gid
}

const searchQuery = ref('')
const selectedGroup = ref('')
const selectedRole = ref('')
const selectedStatus = ref<'all' | 'current' | 'past' | 'leadership'>('current')

onMounted(async () => {
  await Promise.all([loadData(), loadGroups()])
})

const allMembers = computed<Member[]>(() => Object.values(index.value?.all ?? {}))

const availableGroups = computed<string[]>(() => {
  const set = new Set<string>()
  for (const m of allMembers.value) {
    for (const gid of Object.keys(m.roles?._all?.in ?? {})) {
      if (gid !== '_all') set.add(gid)
    }
  }
  return Array.from(set).sort()
})

const availableRoles = computed<string[]>(() => {
  const set = new Set<string>()
  for (const m of allMembers.value) {
    for (const key of Object.keys(m.roles ?? {})) {
      if (key !== '_all') set.add(key)
    }
  }
  return Array.from(set).sort()
})

const filtered = computed<Member[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return allMembers.value.filter(m => {
    if (selectedStatus.value === 'current' && !m.is_current) return false
    if (selectedStatus.value === 'past' && m.is_current) return false
    if (selectedStatus.value === 'leadership' && !m.is_in_leadership) return false

    if (selectedRole.value) {
      const records = m.roles[selectedRole.value]?.in?._all ?? []
      const matches = selectedStatus.value === 'past'
        ? records.some(r => r?.to != null)
        : records.some(r => r?.to == null)
      if (!matches) return false
    }

    if (selectedGroup.value) {
      const records = m.roles?._all?.in?.[selectedGroup.value] ?? []
      const matches = selectedStatus.value === 'past'
        ? records.some(r => r?.to != null)
        : records.some(r => r?.to == null)
      if (!matches) return false
    }

    if (q) {
      const hay = `${m.name} ${m.affiliation ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }).sort((a, b) => a.name.localeCompare(b.name))
})

function memberUrl(m: Member): string {
  return `/members/${m['member-id']}/`
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function pictureUrl(m: Member): string | null {
  if (!m.picture) return null
  return `/assets/images/members/${m.picture}`
}

function primaryRoleLabel(m: Member): string {
  if (m.is_the_chair) return 'Chair'
  const ids = Object.keys(m.roles ?? {}).filter(k => k !== '_all')
  if (ids.includes('convenor')) return 'Convenor'
  if (ids.includes('manager')) return 'Manager'
  if (ids.includes('chair')) return 'Chair'
  if (ids.includes('member')) return 'Member'
  return ids[0] ? roleLabel(ids[0]) : ''
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="page__eyebrow">ISO/TC 154 People</p>
      <h1>Members</h1>
      <p class="page__lead">
        Experts from national bodies, liaisons, and the Committee Advisory Group who carry out
        TC 154's technical work — current and past.
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
          placeholder="Search by name or affiliation…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search members"
        />
      </div>
      <div class="filter__controls">
        <div class="filter__field">
          <span class="filter__label">Status</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'current' }" @click="selectedStatus = 'current'">Current</button>
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'past' }" @click="selectedStatus = 'past'">Past</button>
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'leadership' }" @click="selectedStatus = 'leadership'">Leadership</button>
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'all' }" @click="selectedStatus = 'all'">All</button>
          </div>
        </div>
        <div class="filter__field" v-if="availableRoles.length">
          <span class="filter__label">Role</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedRole === '' }" @click="selectedRole = ''">Any</button>
            <button v-for="r in availableRoles" :key="r"
              class="chip" :class="{ 'chip--active': selectedRole === r }"
              @click="selectedRole = r">{{ roleLabel(r) }}</button>
          </div>
        </div>
        <div class="filter__field" v-if="availableGroups.length">
          <span class="filter__label">Group</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedGroup === '' }" @click="selectedGroup = ''">Any</button>
            <button v-for="g in availableGroups" :key="g"
              class="chip" :class="{ 'chip--active': selectedGroup === g }"
              @click="selectedGroup = g">{{ groupLabel(g) }}</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filtered.length }} of {{ allMembers.length }} members</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading members…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      <h3>No members match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedGroup=''; selectedRole=''; selectedStatus='current'">Clear filters</button>
    </div>

    <ul v-else class="grid">
      <li v-for="m in filtered" :key="m['member-id']">
        <a :href="memberUrl(m)" class="card"
          :class="{ 'card--deceased': m.deceased, 'card--chair': m.is_the_chair }"
          @click.prevent="router.push(memberUrl(m))">
          <div class="card__avatar">
            <img v-if="pictureUrl(m)" :src="pictureUrl(m) ?? undefined" :alt="m.name" loading="lazy" />
            <span v-else>{{ memberInitials(m.name) }}</span>
          </div>
          <div class="card__body">
            <h3 class="card__name">{{ m.name }}</h3>
            <p v-if="m.affiliation" class="card__affiliation">{{ m.affiliation }}</p>
            <div class="card__tags">
              <span v-if="m.is_the_chair" class="tag tag--chair">Chair</span>
              <span v-else-if="m.is_in_leadership" class="tag tag--leadership">Leadership</span>
              <span v-if="m.deceased" class="tag tag--deceased">In Memoriam</span>
              <span v-else-if="!m.is_current" class="tag tag--past">Past</span>
              <span v-if="primaryRoleLabel(m)" class="tag">{{ primaryRoleLabel(m) }}</span>
            </div>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.page__header { margin-bottom: 2rem; }
.page__eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .page__eyebrow { color: #94b6e8; }
.page__header h1 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.75rem;
}
.dark .page__header h1 { color: #fafaf9; }
.page__lead {
  font-size: 1rem;
  line-height: 1.6;
  color: #57534e;
  max-width: 48rem;
  margin: 0;
}
.dark .page__lead { color: #d6d3d1; }

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
  font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: #78716c;
}
.dark .filter__label { color: #a8a29e; }
.filter__chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip {
  display: inline-flex; align-items: center;
  padding: 0.375rem 0.75rem; border-radius: 9999px;
  border: 1px solid #d6d3d1; background: #fff; color: #57534e;
  font-size: 0.8125rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: all 0.15s; text-transform: capitalize;
}
.chip:hover { border-color: var(--color-blue-accent); color: var(--color-blue-accent); }
.chip--active { background: var(--color-blue-accent); border-color: var(--color-blue-accent); color: #fff; }
.dark .chip { background: #292524; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: #5379bf; color: #94b6e8; }
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
  display: flex; gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  height: 100%;
}
.dark .card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.card:hover {
  border-color: var(--color-blue-accent);
  box-shadow: 0 4px 12px rgb(30 58 138 / 0.08);
  transform: translateY(-2px);
}
.dark .card:hover { border-color: #5379bf; box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }
.card--chair {
  border-color: var(--color-brand);
}
.dark .card--chair { border-color: var(--color-brand); }
.card--deceased { opacity: 0.85; }

.card__avatar {
  width: 3.5rem; height: 3.5rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--color-blue-accent), #5379bf);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1rem;
  overflow: hidden;
  flex-shrink: 0;
}
.card__avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.card--deceased .card__avatar img { filter: grayscale(1); }
.card__body { flex: 1; min-width: 0; }
.card__name {
  font-size: 1rem; font-weight: 600; color: #1c1917;
  margin: 0 0 0.125rem;
}
.dark .card__name { color: #fafaf9; }
.card__affiliation {
  font-size: 0.8125rem; color: #78716c;
  margin: 0 0 0.5rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dark .card__affiliation { color: #a8a29e; }
.card__tags {
  display: flex; flex-wrap: wrap; gap: 0.25rem;
}
.tag {
  display: inline-block;
  padding: 0.0625rem 0.5rem;
  font-size: 0.6875rem; font-weight: 600;
  text-transform: capitalize;
  border-radius: 0.25rem;
  background: #f5f5f4; color: #57534e;
}
.dark .tag { background: #292524; color: #d6d3d1; }
.tag--chair { background: var(--color-brand); color: #fff; }
.tag--leadership { background: #fef3c7; color: #92400e; }
.dark .tag--leadership { background: rgb(245 158 11 / 0.2); color: #fcd34d; }
.tag--deceased { background: #e7e5e4; color: #57534e; font-style: italic; text-transform: none; }
.dark .tag--deceased { background: #44403c; color: #a8a29e; }
.tag--past { background: #f5f5f4; color: #a8a29e; text-transform: capitalize; }
.dark .tag--past { background: #292524; color: #78716c; }
</style>
