<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import {
  type Group,
  type GroupCollaborativeParty,
  type ConvenorTerm,
} from '../types/group'
import { groupCategoryLabel, lifecycleStatus } from '../domain/groupPresentation'
import { asciidocify } from '../utils/asciidoc'
import { memberPath, projectPath } from '../utils/urn'
import type { Member } from '../types/member'
import type { SubnavSection } from '../types/group'
import PageHero from '../components/PageHero.vue'
import GroupTimeline from '../components/GroupTimeline.vue'
import ConvenorTermBar from '../components/ConvenorTermBar.vue'
import SectionSubnav from '../components/SectionSubnav.vue'

const route = useRoute()
const { groups, isLoaded, loadData, get: getGroup } = useGroups()
const { loadData: loadMembers, get: getMember } = useMembers()
const group = computed<Group | null>(() => {
  const id = String(route.params.id ?? '')
  return groups.value.find(g => g.id === id || g._id === id) ?? null
})

onMounted(async () => {
  await Promise.all([loadData(), loadMembers()])
})

const description = computed(() => {
  if (!group.value?._description) return ''
  return asciidocify(group.value._description)
})

const introHtml = computed(() => {
  if (!group.value?.intro) return ''
  return asciidocify(group.value.intro)
})

const scopeHtml = computed(() => {
  if (!group.value?.scope) return ''
  return asciidocify(group.value.scope)
})

const historyStoryHtml = computed(() => {
  if (!group.value?.history?.story) return ''
  return asciidocify(group.value.history.story)
})

const collaborativePartyHtml = (p: GroupCollaborativeParty): string => {
  if (!p.description) return ''
  return asciidocify(p.description)
}

const status = computed(() => group.value ? lifecycleStatus(group.value) : 'active')

const establishedYear = computed(() => {
  const date = group.value?.history?.established?.date
  if (!date) return null
  return String(date).slice(0, 4)
})

const dissolvedDate = computed(() => group.value?.history?.dissolved?.date ?? null)
const dissolvedYear = computed(() => dissolvedDate.value ? String(dissolvedDate.value).slice(0, 4) : null)

const lifecycleEvents = computed(() => group.value?.history?.events ?? [])
const convenorTerms = computed(() => group.value?.convenor_terms ?? [])

const subnavSections = computed<SubnavSection[]>(() => {
  if (!group.value) return []
  const g = group.value
  const sections: SubnavSection[] = []
  if (g.intro) sections.push({ id: 'overview', label: 'Overview' })
  if (g._description) sections.push({ id: 'mandate', label: 'Mandate' })
  if (g.scope) sections.push({ id: 'scope', label: 'Scope' })
  if (lifecycleEvents.value.length) sections.push({ id: 'lifecycle', label: 'Lifecycle' })
  if (convenorTerms.value.length) sections.push({ id: 'convenors', label: 'Convenors' })
  if (g.history?.story) sections.push({ id: 'history', label: 'History' })
  if (g.collaborative_parties?.length) sections.push({ id: 'partners', label: 'Partners' })
  if (g.standards?.length) sections.push({ id: 'standards', label: 'Standards' })
  if (g.active_projects?.length) sections.push({ id: 'projects', label: 'Projects' })
  return sections
})

const predecessorTerms = computed<ConvenorTerm[]>(() => {
  const pred = group.value?.predecessor
  if (!pred) return []
  return getGroup(pred.id)?.convenor_terms ?? []
})

function memberName(id: string): string {
  const m = getMember(id) as Member | undefined
  return m?.name ?? id
}

function memberUrl(id: string): string {
  return memberPath(id)
}

function projectUrl(id: string): string {
  return projectPath(id)
}

function memberInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const convenors = computed<string[]>(() => {
  if (!group.value) return []
  return group.value.convenors ?? group.value.organization?.convenors ?? []
})
const coChairs = computed<string[]>(() => {
  if (!group.value) return []
  return group.value.co_chairs ?? group.value.organization?.co_chairs ?? []
})
const managers = computed<string[]>(() => {
  if (!group.value) return []
  return group.value.managers ?? group.value.organization?.managers ?? []
})
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>

  <div class="detail" v-else-if="!group">
    <PageHero
      variant="detail"
      bleed
      eyebrow="Not found"
      title="Group not found"
      :lead="`No group matches ${route.params.id}.`"
    />
    <div class="detail__body">
      <RouterLink to="/groups/" class="detail__back">← All groups</RouterLink>
    </div>
  </div>

  <article class="detail" v-else :key="group.id">
    <PageHero
      variant="detail"
      bleed
      :eyebrow="`${groupCategoryLabel(group.category)}`"
      :lead="group.title"
    >
      <template #title>
        <span :class="{ 'detail__title--muted': status === 'dissolved' }" v-html="group.name"></span>
      </template>
      <template #breadcrumb>
        <RouterLink to="/groups/">
          Groups
        </RouterLink>
      </template>

      <div class="detail__badges">
        <span :class="['detail__badge', `detail__badge--${status}`]">
          <span class="detail__badge-dot" aria-hidden="true"></span>
          <span class="detail__badge-text">{{ status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Dissolved' }}</span>
        </span>
        <span v-if="establishedYear" class="detail__badge detail__badge--neutral">
          <span class="detail__badge-label">Est.</span>
          <span class="detail__badge-text">{{ establishedYear }}</span>
        </span>
        <span v-if="dissolvedYear" class="detail__badge detail__badge--neutral">
          <span class="detail__badge-label">Dissolved</span>
          <span class="detail__badge-text">{{ dissolvedYear }}</span>
        </span>
      </div>

      <div v-if="group.predecessor || group.successor" class="detail__lineage">
        <RouterLink
          v-if="group.predecessor"
          :to="`/groups/${group.predecessor.id}/`"
          class="detail__lineage-chip detail__lineage-chip--pred"
        >
          <span class="detail__lineage-arrow" aria-hidden="true">←</span>
          <span class="detail__lineage-body">
            <span class="detail__lineage-label">Succeeded</span>
            <span class="detail__lineage-name">{{ group.predecessor.name }}</span>
          </span>
        </RouterLink>
        <RouterLink
          v-if="group.successor"
          :to="`/groups/${group.successor.id}/`"
          class="detail__lineage-chip detail__lineage-chip--succ"
        >
          <span class="detail__lineage-arrow" aria-hidden="true">→</span>
          <span class="detail__lineage-body">
            <span class="detail__lineage-label">Succeeded by</span>
            <span class="detail__lineage-name">{{ group.successor.name }}</span>
          </span>
        </RouterLink>
      </div>
    </PageHero>

    <SectionSubnav v-if="subnavSections.length > 2" :sections="subnavSections" />

    <div class="detail__grid">
      <div class="detail__main">
        <section v-if="introHtml" id="overview" class="detail__section">
          <h2 class="detail__section-title">Overview</h2>
          <div class="prose" v-html="introHtml"></div>
        </section>

        <section v-if="description" id="mandate" class="detail__section">
          <h2 class="detail__section-title">Mandate</h2>
          <div class="prose" v-html="description"></div>
        </section>

        <section v-if="scopeHtml" id="scope" class="detail__section">
          <h2 class="detail__section-title">Scope</h2>
          <div class="prose" v-html="scopeHtml"></div>
        </section>

        <section v-if="lifecycleEvents.length" id="lifecycle" class="detail__section detail__section--timeline">
          <h2 class="detail__section-title">Lifecycle</h2>
          <p class="detail__section-intro">Key moments in this group's history, traced through plenary resolutions.</p>
          <GroupTimeline :events="lifecycleEvents" />
        </section>

        <section v-if="convenorTerms.length" id="convenors" class="detail__section detail__section--terms">
          <h2 class="detail__section-title">Convenor terms</h2>
          <p class="detail__section-intro">Leadership tenures on a shared timeline. Bars link to member profiles; chips link to appointing resolutions.</p>
          <ConvenorTermBar
            :terms="convenorTerms"
            :predecessor-terms="predecessorTerms"
            :predecessor-name="group.predecessor?.name"
          />
        </section>

        <section v-if="group.history?.story && historyStoryHtml" id="history" class="detail__section">
          <h2 class="detail__section-title">History</h2>
          <div class="prose" v-html="historyStoryHtml"></div>
        </section>

        <section v-if="group.collaborative_parties?.length" id="partners" class="detail__section">
          <h2 class="detail__section-title">Collaborative parties</h2>
          <div v-for="(p, idx) in group.collaborative_parties" :key="idx" class="detail__party">
            <h3 class="detail__party-name">{{ p.entity_name }}</h3>
            <div v-if="p.projects?.length" class="detail__party-projects">
              <span class="detail__party-label">Projects:</span>
              <span v-for="proj in p.projects" :key="proj" class="pill">
                <a :href="projectUrl(proj)">{{ proj }}</a>
              </span>
            </div>
            <div class="prose" v-html="collaborativePartyHtml(p)"></div>
          </div>
        </section>

        <section v-if="group.standards?.length" id="standards" class="detail__section">
          <h2 class="detail__section-title">Standards</h2>
          <ul class="detail__standards">
            <li v-for="std in group.standards" :key="std">{{ std }}</li>
          </ul>
        </section>

        <section v-if="group.active_projects?.length" id="projects" class="detail__section">
          <h2 class="detail__section-title">Active projects</h2>
          <ul class="detail__projects">
            <li v-for="proj in group.active_projects" :key="proj">
              <a :href="projectUrl(proj)">{{ proj }}</a>
            </li>
          </ul>
        </section>
      </div>

      <aside class="detail__aside">
        <section v-if="convenors.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Convenor{{ convenors.length > 1 ? 's' : '' }}</h3>
          <ul class="detail__people">
            <li v-for="id in convenors" :key="`c-${id}`">
              <a :href="memberUrl(id)" class="person-chip">
                <span class="person-chip__avatar">{{ memberInitials(memberName(id)) }}</span>
                <span class="person-chip__name">{{ memberName(id) }}</span>
              </a>
            </li>
          </ul>
        </section>

        <section v-if="coChairs.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Co-chair{{ coChairs.length > 1 ? 's' : '' }}</h3>
          <ul class="detail__people">
            <li v-for="id in coChairs" :key="`co-${id}`">
              <a :href="memberUrl(id)" class="person-chip">
                <span class="person-chip__avatar">{{ memberInitials(memberName(id)) }}</span>
                <span class="person-chip__name">{{ memberName(id) }}</span>
              </a>
            </li>
          </ul>
        </section>

        <section v-if="managers.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Manager{{ managers.length > 1 ? 's' : '' }}</h3>
          <ul class="detail__people">
            <li v-for="id in managers" :key="`m-${id}`">
              <a :href="memberUrl(id)" class="person-chip">
                <span class="person-chip__avatar">{{ memberInitials(memberName(id)) }}</span>
                <span class="person-chip__name">{{ memberName(id) }}</span>
              </a>
            </li>
          </ul>
        </section>

        <section v-if="group.members?.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Members ({{ group.members.length }})</h3>
          <ul class="detail__people">
            <li v-for="id in group.members" :key="`mem-${id}`">
              <a :href="memberUrl(id)" class="person-chip">
                <span class="person-chip__avatar">{{ memberInitials(memberName(id)) }}</span>
                <span class="person-chip__name">{{ memberName(id) }}</span>
              </a>
            </li>
          </ul>
        </section>

        <section v-if="group.past_members?.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Past members</h3>
          <ul class="detail__people">
            <li v-for="id in group.past_members" :key="`pm-${id}`">
              <a :href="memberUrl(id)" class="person-chip person-chip--past">
                <span class="person-chip__avatar">{{ memberInitials(memberName(id)) }}</span>
                <span class="person-chip__name">{{ memberName(id) }}</span>
              </a>
            </li>
          </ul>
        </section>

        <section v-if="group.history?.leadership?.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Past leadership</h3>
          <ul class="detail__leadership">
            <li v-for="id in group.history.leadership" :key="`l-${id}`">
              <a :href="memberUrl(id)">{{ memberName(id) }}</a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.detail {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__back {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.detail__back:hover { text-decoration: underline; }

.detail__title--muted {
  opacity: 0.85;
}

.detail__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
}
.detail__badge {
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
.detail__badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: currentColor;
  flex-shrink: 0;
}
.detail__badge--active {
  background: rgba(30, 58, 138, 0.08);
  color: var(--color-brand);
  border-color: rgba(30, 58, 138, 0.2);
}
.detail__badge--inactive {
  background: rgba(180, 83, 9, 0.08);
  color: var(--color-amber-warm);
  border-color: rgba(180, 83, 9, 0.25);
}
.detail__badge--dissolved {
  background: rgba(120, 113, 108, 0.1);
  color: var(--color-slate-600);
  border-color: rgba(120, 113, 108, 0.25);
}
.dark .detail__badge--dissolved { color: var(--color-slate-400); }
.detail__badge--inactive .detail__badge-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
}
.detail__badge--dissolved .detail__badge-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
  position: relative;
}
.detail__badge--neutral {
  background: var(--color-slate-50);
  color: var(--color-slate-700);
  border-color: var(--color-slate-200);
}
.dark .detail__badge--neutral {
  background: var(--color-slate-800);
  color: var(--color-slate-300);
  border-color: var(--color-slate-700);
}
.detail__badge-label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

.detail__lineage {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin: 0 0 1rem;
}
.detail__lineage-chip {
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
.detail__lineage-chip:hover {
  background: var(--color-slate-100);
  transform: translateY(-1px);
}
.dark .detail__lineage-chip {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
}
.dark .detail__lineage-chip:hover { background: var(--color-slate-700); }

.detail__lineage-chip--pred {
  border-left: 3px solid var(--color-slate-400);
}
.detail__lineage-chip--succ {
  border-left: 3px solid var(--color-brand-fill);
}
.dark .detail__lineage-chip--pred { border-left-color: var(--color-slate-500); }

.detail__lineage-arrow {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1;
  color: var(--color-slate-500);
  flex-shrink: 0;
}
.dark .detail__lineage-arrow { color: var(--color-slate-400); }

.detail__lineage-body {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.detail__lineage-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate-500);
  font-weight: 600;
}
.dark .detail__lineage-label { color: var(--color-slate-400); }
.detail__lineage-name {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-900);
  font-weight: 500;
}
.dark .detail__lineage-name { color: var(--color-slate-100); }
.detail__lineage-chip:hover .detail__lineage-name { color: var(--color-brand); }

.detail__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}
@media (min-width: 1024px) {
  .detail__grid { grid-template-columns: minmax(0, 1fr) 22rem; }
}

.detail__section { margin-bottom: 2rem; scroll-margin-top: 5rem; }
.detail__section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #78716c;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .detail__section-title { color: #a8a29e; border-bottom-color: #292524; }

.detail__section-intro {
  font-size: 0.8125rem;
  color: var(--color-slate-500);
  font-style: italic;
  margin: 0 0 1rem;
  line-height: 1.5;
}
.dark .detail__section-intro { color: var(--color-slate-400); }

.detail__section--timeline,
.detail__section--terms {
  padding: 1.25rem 1.25rem 1rem;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
}
.dark .detail__section--timeline,
.dark .detail__section--terms {
  background: rgba(15, 23, 42, 0.35);
  border-color: var(--color-slate-700);
}
.detail__section--timeline .detail__section-title,
.detail__section--terms .detail__section-title {
  border-bottom-color: var(--color-slate-200);
  margin-bottom: 0.5rem;
}

.prose {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #44403c;
}
.dark .prose { color: #d6d3d1; }
.prose :deep(p) { margin: 0 0 0.875rem; }
.prose :deep(p:last-child) { margin-bottom: 0; }
.prose :deep(a) { color: var(--color-blue-accent); text-decoration: underline; }
.prose :deep(ul), .prose :deep(ol) { margin: 0 0 0.875rem; padding-left: 1.25rem; }
.prose :deep(li) { margin-bottom: 0.25rem; }
.prose :deep(code) {
  font-family: ui-monospace, monospace;
  background: #f5f5f4;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
.dark .prose :deep(code) { background: #292524; }

.detail__standards, .detail__projects {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.detail__standards li {
  padding: 0.5rem 0.75rem;
  background: #fafaf9;
  border-radius: 0.375rem;
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  color: #44403c;
}
.dark .detail__standards li { background: #292524; color: #d6d3d1; }
.detail__projects li a {
  display: block;
  padding: 0.5rem 0.75rem;
  background: #fafaf9;
  border-radius: 0.375rem;
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.detail__projects li a:hover { background: #e0e7ff; }
.dark .detail__projects li a { background: #292524; }
.dark .detail__projects li a:hover { background: #44403c; }

.detail__party {
  padding: 1rem;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  background: #fff;
}
.dark .detail__party { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.detail__party-name { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: #1c1917; }
.dark .detail__party-name { color: #fafaf9; }
.detail__party-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}
.detail__party-label { color: #78716c; }
.dark .detail__party-label { color: #a8a29e; }
.pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #f5f5f4;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
}
.pill a { color: var(--color-blue-accent); text-decoration: none; }
.dark .pill { background: #292524; }

.detail__aside {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.detail__aside-block {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
}
.dark .detail__aside-block { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.detail__aside-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #78716c;
  margin: 0 0 0.75rem;
}
.dark .detail__aside-title { color: #a8a29e; }

.detail__people {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.person-chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  color: #44403c;
  transition: background 0.15s;
}
.person-chip:hover { background: #f5f5f4; }
.dark .person-chip { color: #d6d3d1; }
.dark .person-chip:hover { background: #292524; }
.person-chip__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: var(--color-blue-accent);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  flex-shrink: 0;
}
.dark .person-chip__avatar { background: #5379bf; }
.person-chip--past .person-chip__avatar { background: #a8a29e; }
.dark .person-chip--past .person-chip__avatar { background: #57534e; }
.person-chip__name { font-size: 0.875rem; }

.detail__leadership {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}
.detail__leadership a {
  color: var(--color-blue-accent);
  text-decoration: none;
}
.detail__leadership a:hover { text-decoration: underline; }
</style>
