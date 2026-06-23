<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageHero from './PageHero.vue'
import PersonCard from './PersonCard.vue'
import type { Group, LifecycleStatus } from '../types/group'
import type { HeroPerson } from '../composables/useGroupRoster'
import { groupCategoryLabel } from '../domain/groupPresentation'

defineProps<{
  group: Group
  status: LifecycleStatus
  heroConvenors: HeroPerson[]
  heroConvenorLabel: string
  heroManagers: HeroPerson[]
  establishedYear: string | null
  dissolvedYear: string | null
}>()

function statusLabel(s: LifecycleStatus): string {
  return s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'Dissolved'
}
</script>

<template>
  <PageHero
    variant="detail"
    bleed
    :eyebrow="groupCategoryLabel(group.category)"
    :lead="group.title"
  >
    <template #title>
      <span :class="{ 'ghero__title--muted': status === 'dissolved' }" v-html="group.name"></span>
    </template>
    <template #breadcrumb>
      <RouterLink to="/groups/">
        Groups
      </RouterLink>
    </template>

    <p v-if="group.scope" class="ghero__scope">
      {{ group.scope.trim() }}
    </p>

    <div
      v-if="heroConvenors.length || heroManagers.length || establishedYear || dissolvedYear"
      class="ghero__people"
    >
      <div v-if="heroConvenors.length" class="ghero__group">
        <span class="ghero__label">{{ heroConvenorLabel }}</span>
        <div class="ghero__cards">
          <PersonCard
            v-for="c in heroConvenors"
            :key="c.id"
            :id="c.id"
            :name="c.name"
            :meta="c.fromYear ? `since ${c.fromYear}` : undefined"
          />
        </div>
      </div>

      <div v-if="heroManagers.length" class="ghero__group">
        <span class="ghero__label">Manager</span>
        <div class="ghero__cards">
          <PersonCard
            v-for="m in heroManagers"
            :key="m.id"
            :id="m.id"
            :name="m.name"
            variant="leader"
          />
        </div>
      </div>

      <div v-if="establishedYear || dissolvedYear" class="ghero__group">
        <span class="ghero__label">First established</span>
        <div class="ghero__cards ghero__cards--text">
          <span v-if="establishedYear" class="ghero__fact">
            <span class="ghero__fact-value">{{ establishedYear }}</span>
            <span class="ghero__fact-hint">established</span>
          </span>
          <span v-if="dissolvedYear" class="ghero__fact">
            <span class="ghero__fact-value">{{ dissolvedYear }}</span>
            <span class="ghero__fact-hint">dissolved</span>
          </span>
        </div>
      </div>
    </div>

    <div class="ghero__badges">
      <span :class="['ghero__badge', `ghero__badge--${status}`]">
        <span class="ghero__badge-dot" aria-hidden="true"></span>
        <span class="ghero__badge-text">{{ statusLabel(status) }}</span>
      </span>
    </div>

    <div v-if="group.predecessor || group.successor" class="ghero__lineage">
      <RouterLink
        v-if="group.predecessor"
        :to="`/groups/${group.predecessor.id}/`"
        class="ghero__lineage-chip ghero__lineage-chip--pred"
      >
        <span class="ghero__lineage-arrow" aria-hidden="true">←</span>
        <span class="ghero__lineage-body">
          <span class="ghero__lineage-label">Succeeded</span>
          <span class="ghero__lineage-name">{{ group.predecessor.name }}</span>
        </span>
      </RouterLink>
      <RouterLink
        v-if="group.successor"
        :to="`/groups/${group.successor.id}/`"
        class="ghero__lineage-chip ghero__lineage-chip--succ"
      >
        <span class="ghero__lineage-arrow" aria-hidden="true">→</span>
        <span class="ghero__lineage-body">
          <span class="ghero__lineage-label">Succeeded by</span>
          <span class="ghero__lineage-name">{{ group.successor.name }}</span>
        </span>
      </RouterLink>
    </div>
  </PageHero>
</template>

<style scoped>
.ghero__title--muted { opacity: 0.85; }

.ghero__scope {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  line-height: 1.6;
  color: #44403c;
  margin: 0 0 1.5rem;
  padding: 1rem 1.25rem;
  border-left: 2px solid var(--color-blue-accent);
  background: rgba(30, 58, 138, 0.03);
  max-width: 48rem;
  font-style: italic;
}
.dark .ghero__scope {
  color: #d6d3d1;
  background: rgba(83, 121, 191, 0.07);
}

.ghero__people {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
  margin: 0 0 1.25rem;
  max-width: 56rem;
}
.ghero__group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.ghero__label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.dark .ghero__label { color: var(--color-slate-400); }
.ghero__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ghero__cards--text {
  flex-direction: row;
  align-items: baseline;
  gap: 1rem;
}

.ghero__fact {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.1;
}
.ghero__fact-value {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .ghero__fact-value { color: var(--color-slate-100); }
.ghero__fact-hint {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}
.dark .ghero__fact-hint { color: var(--color-slate-400); }

.ghero__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
}
.ghero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0.3125rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
}
.ghero__badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: currentColor;
  flex-shrink: 0;
}
.ghero__badge--active {
  background: rgba(30, 58, 138, 0.08);
  color: var(--color-brand);
  border-color: rgba(30, 58, 138, 0.2);
}
.ghero__badge--inactive {
  background: rgba(180, 83, 9, 0.08);
  color: var(--color-amber-warm);
  border-color: rgba(180, 83, 9, 0.25);
}
.ghero__badge--dissolved {
  background: rgba(120, 113, 108, 0.1);
  color: var(--color-slate-600);
  border-color: rgba(120, 113, 108, 0.25);
}
.dark .ghero__badge--dissolved { color: var(--color-slate-400); }
.ghero__badge--inactive .ghero__badge-dot,
.ghero__badge--dissolved .ghero__badge-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
}

.ghero__lineage {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin: 0 0 1rem;
}
.ghero__lineage-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem 0.375rem 0.625rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.ghero__lineage-chip:hover {
  background: var(--color-slate-100);
  transform: translateY(-1px);
}
.dark .ghero__lineage-chip {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
}
.dark .ghero__lineage-chip:hover { background: var(--color-slate-700); }

.ghero__lineage-chip--pred { border-left: 3px solid var(--color-slate-400); }
.ghero__lineage-chip--succ { border-left: 3px solid var(--color-brand-fill); }
.dark .ghero__lineage-chip--pred { border-left-color: var(--color-slate-500); }

.ghero__lineage-arrow {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1;
  color: var(--color-slate-500);
  flex-shrink: 0;
}
.dark .ghero__lineage-arrow { color: var(--color-slate-400); }

.ghero__lineage-body {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.ghero__lineage-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate-500);
  font-weight: 600;
}
.dark .ghero__lineage-label { color: var(--color-slate-400); }
.ghero__lineage-name {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-900);
  font-weight: 500;
}
.dark .ghero__lineage-name { color: var(--color-slate-100); }
.ghero__lineage-chip:hover .ghero__lineage-name { color: var(--color-brand); }
</style>
