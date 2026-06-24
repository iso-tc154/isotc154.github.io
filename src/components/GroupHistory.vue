<script setup lang="ts">
import { computed } from 'vue'
import { memberPath } from '../utils/urn'
import type { GroupLifecycleEvent, ConvenorTerm } from '../types/group'
import GroupTimeline from './GroupTimeline.vue'
import ConvenorTermBar from './ConvenorTermBar.vue'

const props = defineProps<{
  lifecycleEvents: GroupLifecycleEvent[]
  convenorTerms: ConvenorTerm[]
  predecessorTerms: ConvenorTerm[]
  predecessorName?: string
  pastLeadership: string[]
  nameOf: (id: string) => string
  pictureOf?: (id: string) => string | null | undefined
  deceasedOf?: (id: string) => boolean
  affiliationOf?: (id: string) => string | undefined
  seats?: { label: string; member_ids: string[] }[]
}>()

interface PastLeaderCard {
  id: string
  name: string
  href: string
  pictureUrl: string | null
  deceased: boolean
  initials: string
  affiliation?: string
  role: string
  fromYear?: string
  toYear?: string
  durationLabel?: string
}

function initialsOf(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatYearRange(from?: string, to?: string): string | undefined {
  if (!from && !to) return undefined
  if (from && to) return `${from} – ${to}`
  if (from) return `since ${from}`
  return `until ${to}`
}

function computeDuration(from?: string, to?: string): string | undefined {
  if (!from) return undefined
  const fromYear = parseInt(from, 10)
  const endYear = to ? parseInt(to, 10) : new Date().getFullYear()
  if (isNaN(fromYear) || isNaN(endYear) || endYear < fromYear) return undefined
  const years = endYear - fromYear
  if (years <= 0) return undefined
  return `${years} year${years === 1 ? '' : 's'}`
}

const pastLeaderCards = computed<PastLeaderCard[]>(() =>
  props.pastLeadership.map(id => {
    const terms = props.convenorTerms.filter(t => t.member_id === id)
    const earliest = terms
      .slice()
      .sort((a, b) => (a.from < b.from ? -1 : 1))[0]
    const latest = terms
      .slice()
      .sort((a, b) => {
        const at = a.to ?? '9999'
        const bt = b.to ?? '9999'
        return at < bt ? -1 : 1
      })[terms.length - 1]
    const fromYear = earliest?.from ? String(earliest.from).slice(0, 4) : undefined
    const toYear = latest?.to ? String(latest.to).slice(0, 4) : undefined
    const picture = props.pictureOf?.(id)
    return {
      id,
      name: props.nameOf(id),
      href: memberPath(id),
      pictureUrl: picture ? `/assets/images/members/${picture}` : null,
      deceased: props.deceasedOf?.(id) ?? false,
      initials: initialsOf(props.nameOf(id)),
      affiliation: props.affiliationOf?.(id),
      role: earliest?.role ?? 'Convenor',
      fromYear,
      toYear,
      durationLabel: computeDuration(fromYear, toYear),
    }
  }),
)
</script>

<template>
  <div v-if="lifecycleEvents.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Lifecycle</h3>
    <p class="ghist__intro">Key moments in this group's history, traced through plenary resolutions.</p>
    <GroupTimeline :events="lifecycleEvents" />
  </div>

  <div v-if="convenorTerms.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Leadership timeline</h3>
    <p class="ghist__intro">Convenor tenures on a shared timeline. Bars link to member profiles; chips link to appointing resolutions.</p>
    <ConvenorTermBar
      :terms="convenorTerms"
      :predecessor-terms="predecessorTerms"
      :predecessor-name="predecessorName"
      :seats="seats"
    />
  </div>

  <div v-if="pastLeaderCards.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Past leadership</h3>
    <p class="ghist__intro">Former convenors and chairs of this group, with their terms of service.</p>
    <div class="ghist__leaders">
      <RouterLink
        v-for="leader in pastLeaderCards"
        :key="leader.id"
        :to="leader.href"
        :class="['gleader', { 'gleader--deceased': leader.deceased }]"
      >
        <span class="gleader__avatar" aria-hidden="true">
          <img v-if="leader.pictureUrl" :src="leader.pictureUrl" :alt="leader.name" loading="lazy" />
          <template v-else>{{ leader.initials }}</template>
        </span>
        <span class="gleader__body">
          <span class="gleader__name">{{ leader.name }}</span>
          <span class="gleader__role">{{ leader.role }}</span>
          <span v-if="leader.affiliation" class="gleader__affil">{{ leader.affiliation }}</span>
          <span v-if="leader.fromYear || leader.toYear" class="gleader__term">
            <span class="gleader__term-range">{{ formatYearRange(leader.fromYear, leader.toYear) }}</span>
            <span v-if="leader.durationLabel" class="gleader__term-duration">{{ leader.durationLabel }}</span>
          </span>
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.ghist__block {
  margin-bottom: 1.5rem;
}
.ghist__block:last-child { margin-bottom: 0; }
.ghist__card {
  padding: 1.5rem;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.625rem;
  box-shadow: 0 1px 2px rgba(120, 113, 108, 0.04);
}
.dark .ghist__card {
  background: rgba(15, 23, 42, 0.45);
  border-color: var(--color-slate-700);
  box-shadow: none;
}
.ghist__heading {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}
.dark .ghist__heading { color: var(--color-slate-100); }
.ghist__intro {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-500);
  font-style: italic;
  margin: 0 0 1.25rem;
  line-height: 1.55;
  max-width: 42rem;
}
.dark .ghist__intro { color: var(--color-slate-400); }

.ghist__leaders {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) {
  .ghist__leaders { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.gleader {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--color-slate-900);
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.gleader:hover {
  border-color: var(--color-blue-accent);
  background: #fff;
  transform: translateY(-1px);
}
.dark .gleader {
  background: rgba(15, 23, 42, 0.5);
  border-color: var(--color-slate-700);
  color: var(--color-slate-100);
}
.dark .gleader:hover {
  border-color: var(--color-blue-accent);
  background: rgba(15, 23, 42, 0.8);
}

.gleader__avatar {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background: var(--color-blue-accent);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  overflow: hidden;
}
.dark .gleader__avatar { background: #5379bf; }
.gleader__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gleader--deceased .gleader__avatar img { filter: grayscale(1); }

.gleader__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  padding-top: 0.0625rem;
}
.gleader__name {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
  letter-spacing: -0.005em;
  line-height: 1.2;
}
.gleader:hover .gleader__name { color: var(--color-blue-accent); }
.gleader__role {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.dark .gleader__role { color: var(--color-slate-400); }
.gleader__affil {
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  font-style: italic;
  color: var(--color-slate-500);
  line-height: 1.3;
}
.dark .gleader__affil { color: var(--color-slate-400); }
.gleader__term {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.375rem;
}
.gleader__term-range {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  color: var(--color-slate-600);
}
.dark .gleader__term-range { color: var(--color-slate-300); }
.gleader__term-duration {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.125rem 0.5rem;
  background: rgba(30, 58, 138, 0.06);
  color: var(--color-brand);
  border-radius: 9999px;
}
.dark .gleader__term-duration {
  background: rgba(51, 133, 214, 0.12);
  color: #93c5fd;
}
</style>
