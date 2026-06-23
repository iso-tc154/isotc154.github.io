<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { useStandards } from '../composables/useStandards'
import { useProjects } from '../composables/useProjects'
import {
  type Group,
  type GroupCollaborativeParty,
  type ConvenorTerm,
  type SubnavSection,
} from '../types/group'
import type { Standard } from '../types/standard'
import type { Project } from '../types/project'
import type { Member } from '../types/member'
import { groupCategoryLabel, lifecycleStatus } from '../domain/groupPresentation'
import {
  standardYear,
  standardUrlFromRaw,
  standardStatusLabel,
} from '../domain/standardPresentation'
import { projectStatusLabel, projectScopeExcerpt } from '../domain/projectPresentation'
import { asciidocify } from '../utils/asciidoc'
import { projectPath } from '../utils/urn'
import PageHero from '../components/PageHero.vue'
import GroupTimeline from '../components/GroupTimeline.vue'
import ConvenorTermBar from '../components/ConvenorTermBar.vue'
import SectionTabs from '../components/SectionTabs.vue'
import PersonCard from '../components/PersonCard.vue'
import PeopleList from '../components/PeopleList.vue'

const route = useRoute()
const { groups, isLoaded, loadData, get: getGroup } = useGroups()
const { loadData: loadMembers, get: getMember } = useMembers()
const { standards, loadData: loadStandards } = useStandards()
const { loadData: loadProjects, get: getProject } = useProjects()
const group = computed<Group | null>(() => {
  const id = String(route.params.id ?? '')
  return groups.value.find(g => g.id === id || g._id === id) ?? null
})

onMounted(async () => {
  await Promise.all([loadData(), loadMembers(), loadStandards(), loadProjects()])
})

const description = computed(() => {
  if (!group.value?._description) return ''
  return asciidocify(group.value._description)
})

const introHtml = computed(() => {
  if (!group.value?.intro) return ''
  return asciidocify(group.value.intro)
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

interface HeroPerson {
  id: string
  name: string
  fromYear?: string
}

const heroConvenors = computed<HeroPerson[]>(() => {
  const ids = convenors.value.length ? convenors.value : coChairs.value
  return ids.map(id => {
    const term = convenorTerms.value.find(t => t.member_id === id)
    return {
      id,
      name: memberName(id),
      fromYear: term?.from ? String(term.from).slice(0, 4) : undefined,
    }
  })
})
const heroConvenorLabel = computed(() =>
  convenors.value.length ? 'Convenor' : (coChairs.value.length ? 'Co-chair' : ''),
)

const heroManagers = computed<HeroPerson[]>(() =>
  managers.value.map(id => ({ id, name: memberName(id) }))
)

interface PeopleGroup {
  id: string
  label: string
  members: string[]
  variant: 'current' | 'past'
}

const peopleGroups = computed<PeopleGroup[]>(() => {
  if (!group.value) return []
  const g = group.value
  const list: PeopleGroup[] = []
  if (g.members?.length) list.push({ id: 'members', label: `Members (${g.members.length})`, members: g.members, variant: 'current' })
  if (g.past_members?.length) list.push({ id: 'past-members', label: 'Past members', members: g.past_members, variant: 'past' })
  return list
})

const standardsByName = computed(() => {
  const map = new Map<string, Standard>()
  for (const s of standards.value) {
    if (s.iso?.name) map.set(s.iso.name, s)
  }
  return map
})

interface StandardCard {
  raw: string
  standard?: Standard
  url: string
  year: string
  stage: string
}

const standardCards = computed<StandardCard[]>(() => {
  const list = group.value?.standards ?? []
  return list.map(raw => {
    const standard = standardsByName.value.get(raw)
    return {
      raw,
      standard,
      url: standardUrlFromRaw(standards.value, raw),
      year: standardYear(standard),
      stage: standard ? standardStatusLabel(standard.tc154?.status) : '',
    }
  })
})

interface ProjectCard {
  id: string
  project?: Project
  url: string
  name: string
  title?: string
  stage?: string
  statusLabel: string
  excerpt: string
}

const projectCards = computed<ProjectCard[]>(() => {
  const list = group.value?.active_projects ?? []
  return list.map(id => {
    const project = getProject(id)
    return {
      id,
      project,
      url: projectPath(id),
      name: project?.name ?? id,
      title: project?.title,
      stage: project?.stage,
      statusLabel: project?.status ? projectStatusLabel(project.status) : '',
      excerpt: project ? projectScopeExcerpt(project) : '',
    }
  })
})

const sections = computed<SubnavSection[]>(() => {
  if (!group.value) return []
  const g = group.value
  const all: Array<SubnavSection & { enabled: boolean }> = [
    { id: 'overview', label: 'Overview', enabled: Boolean(g.intro || description.value || historyStoryHtml.value) },
    { id: 'history', label: 'History', enabled: Boolean(lifecycleEvents.value.length || convenorTerms.value.length || g.history?.leadership?.length) },
    { id: 'partners', label: 'Partners', enabled: !!g.collaborative_parties?.length },
    { id: 'standards', label: 'Standards', enabled: !!g.standards?.length },
    { id: 'projects', label: 'Projects', enabled: !!g.active_projects?.length },
    { id: 'members', label: 'Members', enabled: peopleGroups.value.length > 0 },
  ]
  return all.filter(s => s.enabled).map(({ id, label }) => ({ id, label }))
})

const subnavSections = sections

const enabledSectionIds = computed(() => new Set(sections.value.map(s => s.id)))

function sectionEnabled(id: string): boolean {
  return enabledSectionIds.value.has(id)
}

const tabbedMode = computed(() => subnavSections.value.length >= 3)

const activeTab = ref('')

watch(subnavSections, (secs) => {
  if (!secs.length) {
    activeTab.value = ''
    return
  }
  if (activeTab.value && secs.some((s) => s.id === activeTab.value)) return
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
  activeTab.value = (hash && secs.some((s) => s.id === hash)) ? hash : secs[0].id
}, { immediate: true })

const predecessorTerms = computed<ConvenorTerm[]>(() => {
  const pred = group.value?.predecessor
  if (!pred) return []
  return getGroup(pred.id)?.convenor_terms ?? []
})

function memberName(id: string): string {
  const m = getMember(id) as Member | undefined
  return m?.name ?? id
}

function projectUrl(id: string): string {
  return projectPath(id)
}

function sectionVisible(id: string): boolean {
  if (!tabbedMode.value) return true
  return activeTab.value === id
}
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

  <article class="group" v-else :key="group.id">
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

      <p v-if="group.scope" class="hero-scope">
        {{ group.scope.trim() }}
      </p>

      <div v-if="heroConvenors.length || heroManagers.length || establishedYear || dissolvedYear" class="hero-people">
        <div v-if="heroConvenors.length" class="hero-people__group">
          <span class="hero-people__label">{{ heroConvenorLabel }}</span>
          <div class="hero-people__cards">
            <PersonCard
              v-for="c in heroConvenors"
              :key="c.id"
              :id="c.id"
              :name="c.name"
              :meta="c.fromYear ? `since ${c.fromYear}` : undefined"
            />
          </div>
        </div>

        <div v-if="heroManagers.length" class="hero-people__group">
          <span class="hero-people__label">Manager</span>
          <div class="hero-people__cards">
            <PersonCard
              v-for="m in heroManagers"
              :key="m.id"
              :id="m.id"
              :name="m.name"
              variant="leader"
            />
          </div>
        </div>

        <div v-if="establishedYear || dissolvedYear" class="hero-people__group">
          <span class="hero-people__label">First established</span>
          <div class="hero-people__cards hero-people__cards--text">
            <span v-if="establishedYear" class="hero-fact">
              <span class="hero-fact__value">{{ establishedYear }}</span>
              <span class="hero-fact__hint">established</span>
            </span>
            <span v-if="dissolvedYear" class="hero-fact">
              <span class="hero-fact__value">{{ dissolvedYear }}</span>
              <span class="hero-fact__hint">dissolved</span>
            </span>
          </div>
        </div>
      </div>

      <div class="detail__badges">
        <span :class="['detail__badge', `detail__badge--${status}`]">
          <span class="detail__badge-dot" aria-hidden="true"></span>
          <span class="detail__badge-text">{{ status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Dissolved' }}</span>
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

    <SectionTabs v-if="tabbedMode" v-model="activeTab" :sections="subnavSections" />

    <div :class="['group__body', tabbedMode ? 'group__body--single' : 'group__body--grid']">
      <div :class="{ 'group__main': !tabbedMode }">
        <section
          v-if="sectionEnabled('overview') && sectionVisible('overview')"
          id="overview"
          :role="tabbedMode ? 'tabpanel' : undefined"
          :aria-labelledby="tabbedMode ? 'tab-overview' : undefined"
          class="group__section"
        >
          <h2 class="group__section-title">Overview</h2>
          <div v-if="introHtml" class="prose" v-html="introHtml"></div>
          <div v-if="description" :class="['prose', introHtml ? 'group__prose-block' : '']" v-html="description"></div>
          <div v-if="historyStoryHtml" :class="['prose', introHtml || description ? 'group__prose-block' : '']" v-html="historyStoryHtml"></div>
        </section>

        <section
          v-if="sectionEnabled('history') && sectionVisible('history')"
          id="history"
          :role="tabbedMode ? 'tabpanel' : undefined"
          :aria-labelledby="tabbedMode ? 'tab-history' : undefined"
          class="group__section"
        >
          <h2 class="group__section-title">History</h2>

          <div v-if="lifecycleEvents.length" class="group__history-block group__section--card">
            <h3 class="group__history-heading">Lifecycle</h3>
            <p class="group__section-intro">Key moments in this group's history, traced through plenary resolutions.</p>
            <GroupTimeline :events="lifecycleEvents" />
          </div>

          <div v-if="convenorTerms.length" class="group__history-block group__section--card">
            <h3 class="group__history-heading">Leadership timeline</h3>
            <p class="group__section-intro">Convenor tenures on a shared timeline. Bars link to member profiles; chips link to appointing resolutions.</p>
            <ConvenorTermBar
              :terms="convenorTerms"
              :predecessor-terms="predecessorTerms"
              :predecessor-name="group.predecessor?.name"
            />
          </div>

          <div v-if="group.history?.leadership?.length" class="group__history-block group__section--card">
            <h3 class="group__history-heading">Past leadership</h3>
            <div class="group__leadership-grid">
              <PersonCard
                v-for="id in group.history.leadership"
                :key="id"
                :id="id"
                :name="memberName(id)"
                variant="leader"
                size="sm"
              />
            </div>
          </div>
        </section>

        <section
          v-if="sectionEnabled('partners') && sectionVisible('partners')"
          id="partners"
          :role="tabbedMode ? 'tabpanel' : undefined"
          :aria-labelledby="tabbedMode ? 'tab-partners' : undefined"
          class="group__section"
        >
          <h2 class="group__section-title">Collaborative parties</h2>
          <div v-for="(p, idx) in group.collaborative_parties" :key="idx" class="group__party">
            <h3 class="group__party-name">{{ p.entity_name }}</h3>
            <div v-if="p.projects?.length" class="group__party-projects">
              <span class="group__party-label">Projects:</span>
              <span v-for="proj in p.projects" :key="proj" class="pill">
                <a :href="projectUrl(proj)">{{ proj }}</a>
              </span>
            </div>
            <div class="prose" v-html="collaborativePartyHtml(p)"></div>
          </div>
        </section>

        <section
          v-if="sectionEnabled('standards') && sectionVisible('standards')"
          id="standards"
          :role="tabbedMode ? 'tabpanel' : undefined"
          :aria-labelledby="tabbedMode ? 'tab-standards' : undefined"
          class="group__section"
        >
          <h2 class="group__section-title">Standards</h2>
          <p class="group__section-intro">{{ standardCards.length }} catalogue entr{{ standardCards.length === 1 ? 'y' : 'ies' }} attributable to this group.</p>
          <ul class="standards-list">
            <li v-for="card in standardCards" :key="card.raw" class="standard">
              <a :href="card.url" class="standard__link">
                <span class="standard__main">
                  <span class="standard__code">{{ card.raw }}</span>
                  <span v-if="card.standard?.iso.title" class="standard__title">
                    {{ card.standard.iso.title }}
                  </span>
                  <span v-if="card.year || card.stage" class="standard__meta">
                    <span v-if="card.year" class="standard__year">{{ card.year }}</span>
                    <span v-if="card.year && card.stage" class="standard__meta-sep" aria-hidden="true">·</span>
                    <span v-if="card.stage" class="standard__stage">{{ card.stage }}</span>
                  </span>
                </span>
                <span class="standard__arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ul>
        </section>

        <section
          v-if="sectionEnabled('projects') && sectionVisible('projects')"
          id="projects"
          :role="tabbedMode ? 'tabpanel' : undefined"
          :aria-labelledby="tabbedMode ? 'tab-projects' : undefined"
          class="group__section"
        >
          <h2 class="group__section-title">Active projects</h2>
          <p class="group__section-intro">{{ projectCards.length }} active work item{{ projectCards.length === 1 ? '' : 's' }}.</p>
          <ul class="projects-list">
            <li v-for="card in projectCards" :key="card.id" class="project">
              <a :href="card.url" class="project__link">
                <span class="project__main">
                  <span class="project__code">{{ card.name }}</span>
                  <span v-if="card.title" class="project__title">
                    {{ card.title }}
                  </span>
                  <span v-if="card.stage || card.statusLabel" class="project__meta">
                    <span v-if="card.stage" class="project__stage">{{ card.stage }}</span>
                    <span v-if="card.stage && card.statusLabel" class="project__meta-sep" aria-hidden="true">·</span>
                    <span v-if="card.statusLabel" class="project__status">{{ card.statusLabel }}</span>
                  </span>
                  <span v-if="card.excerpt" class="project__excerpt">
                    {{ card.excerpt }}
                  </span>
                </span>
                <span class="project__arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ul>
        </section>

        <section
          v-if="tabbedMode && sectionEnabled('members') && sectionVisible('members')"
          id="members"
          role="tabpanel"
          aria-labelledby="tab-members"
          class="group__section"
        >
          <h2 class="group__section-title">Members</h2>
          <div class="people-grid">
            <PeopleList :groups="peopleGroups" :name-of="memberName" />
          </div>
        </section>
      </div>

      <aside v-if="!tabbedMode && sectionEnabled('members')" class="group__aside">
        <PeopleList :groups="peopleGroups" :name-of="memberName" />
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

.detail__title--muted { opacity: 0.85; }

/* ─── Hero inlays: scope paragraph + person cards ─── */
.hero-scope {
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
.dark .hero-scope {
  color: #d6d3d1;
  background: rgba(83, 121, 191, 0.07);
}

.hero-people {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
  margin: 0 0 1.25rem;
  max-width: 56rem;
}
.hero-people__group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.hero-people__label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
}
.dark .hero-people__label { color: var(--color-slate-400); }
.hero-people__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.hero-people__cards--text {
  flex-direction: row;
  align-items: baseline;
  gap: 1rem;
}

.hero-fact {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.1;
}
.hero-fact__value {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .hero-fact__value { color: var(--color-slate-100); }
.hero-fact__hint {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}
.dark .hero-fact__hint { color: var(--color-slate-400); }

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
.detail__badge--inactive .detail__badge-dot,
.detail__badge--dissolved .detail__badge-dot {
  background: transparent;
  border: 1.5px solid currentColor;
  width: 0.4375rem;
  height: 0.4375rem;
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

.detail__lineage-chip--pred { border-left: 3px solid var(--color-slate-400); }
.detail__lineage-chip--succ { border-left: 3px solid var(--color-brand-fill); }
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

/* ─── Body layout ─────────────────────────────────────── */
.group__body {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}
.group__body--grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}
@media (min-width: 1024px) {
  .group__body--grid { grid-template-columns: minmax(0, 1fr) 22rem; }
}
.group__body--single {
  padding-top: 3rem;
}

/* ─── Section rhythm ──────────────────────────────────── */
.group__section {
  margin-bottom: 3rem;
  scroll-margin-top: 9rem;
}
.group__section:last-child { margin-bottom: 0; }

.group__section-title {
  font-family: var(--font-serif);
  font-size: 1.625rem;
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0 0 1.25rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-200);
  letter-spacing: -0.018em;
  line-height: 1.15;
  font-variation-settings: 'opsz' 32;
}
.dark .group__section-title {
  color: var(--color-slate-100);
  border-top-color: var(--color-slate-700);
}
.group__section:first-of-type .group__section-title {
  border-top: none;
  padding-top: 0;
}

.group__section-intro {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-500);
  font-style: italic;
  margin: 0 0 1.5rem;
  line-height: 1.55;
  max-width: 42rem;
}
.dark .group__section-intro { color: var(--color-slate-400); }

.group__prose-block { margin-top: 2rem; }
.group__prose-block::before {
  content: '';
  display: block;
  width: 3rem;
  height: 1px;
  background: var(--color-slate-300);
  margin-bottom: 1.5rem;
}
.dark .group__prose-block::before { background: var(--color-slate-600); }

/* History tab: stacked sub-blocks */
.group__history-block {
  margin-bottom: 1.5rem;
}
.group__history-block:last-child { margin-bottom: 0; }
.group__history-block.group__section--card {
  padding: 1.5rem;
}
.group__history-heading {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}
.dark .group__history-heading { color: var(--color-slate-100); }
.group__history-block .group__section-intro { margin-bottom: 1.25rem; }

.group__leadership-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Card variant: timeline, leadership */
.group__section--card {
  padding: 1.75rem;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.625rem;
  box-shadow: 0 1px 2px rgba(120, 113, 108, 0.04);
}
.dark .group__section--card {
  background: rgba(15, 23, 42, 0.45);
  border-color: var(--color-slate-700);
  box-shadow: none;
}
.group__section--card .group__section-title {
  border-top: none;
  padding-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.375rem;
}

/* ─── Prose ───────────────────────────────────────────── */
.prose {
  font-size: 1rem;
  line-height: 1.75;
  color: #44403c;
  max-width: 48rem;
}
.dark .prose { color: #d6d3d1; }
.prose :deep(p) { margin: 0 0 1rem; }
.prose :deep(p:last-child) { margin-bottom: 0; }
.prose :deep(a) { color: var(--color-blue-accent); text-decoration: underline; text-underline-offset: 2px; }
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  font-family: var(--font-serif);
  color: var(--color-slate-900);
  margin: 1.5rem 0 0.75rem;
  line-height: 1.3;
}
.dark .prose :deep(h2),
.dark .prose :deep(h3),
.dark .prose :deep(h4) { color: var(--color-slate-100); }
.prose :deep(ul), .prose :deep(ol) { margin: 0 0 1rem; padding-left: 1.5rem; }
.prose :deep(li) { margin-bottom: 0.375rem; }
.prose :deep(code) {
  font-family: ui-monospace, monospace;
  background: #f5f5f4;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
.dark .prose :deep(code) { background: #292524; }

/* ─── Collaborative party cards ───────────────────────── */
.group__party {
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-slate-200);
  border-left: 3px solid var(--color-blue-accent);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  background: #fff;
}
.dark .group__party {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
  border-left-color: var(--color-blue-accent);
}
.group__party-name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-slate-900);
}
.dark .group__party-name { color: var(--color-slate-100); }
.group__party-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  align-items: center;
}
.group__party-label {
  color: var(--color-slate-500);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.25rem;
}
.dark .group__party-label { color: var(--color-slate-400); }
.pill {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  background: var(--color-slate-100);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
}
.pill a { color: var(--color-blue-accent); text-decoration: none; }
.pill a:hover { text-decoration: underline; }
.dark .pill { background: var(--color-slate-800); }

/* ─── Standards list ────────────────────────────────────
   Robust flex layout: a main column (code/title/meta stacked)
   and a right-side arrow. No CSS grid template areas, no
   :has() selectors — those broke when title was absent. */
.standards-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.standard {
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dark .standard {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
}
.standard:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}
.standard__link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: inherit;
}
.standard__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}
.standard__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .standard__code { color: var(--color-slate-100); }
.standard__title {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--color-slate-600);
  font-style: italic;
  line-height: 1.4;
}
.dark .standard__title { color: var(--color-slate-300); }
.standard__meta {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.75rem;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}
.dark .standard__meta { color: var(--color-slate-400); }
.standard__year {
  font-family: var(--font-serif);
  font-style: italic;
}
.standard__meta-sep {
  color: var(--color-slate-300);
}
.dark .standard__meta-sep { color: var(--color-slate-600); }
.standard__stage {
  text-transform: capitalize;
  letter-spacing: 0.02em;
}
.standard__arrow {
  flex: 0 0 auto;
  align-self: center;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-slate-400);
  transition: color 0.15s, transform 0.15s;
}
.standard:hover .standard__arrow {
  color: var(--color-blue-accent);
  transform: translateX(2px);
}
.dark .standard:hover .standard__arrow { color: var(--color-blue-accent); }

/* ─── Projects list (mirrors standards pattern) ───────── */
.projects-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.project {
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dark .project {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
}
.project:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}
.project__link {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.125rem;
  text-decoration: none;
  color: inherit;
}
.project__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.project__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .project__code { color: var(--color-slate-100); }
.project__title {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-slate-700);
  line-height: 1.4;
}
.dark .project__title { color: var(--color-slate-200); }
.project__meta {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}
.dark .project__meta { color: var(--color-slate-400); }
.project__stage {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: rgba(30, 58, 138, 0.08);
  color: var(--color-brand);
  border-radius: 0.1875rem;
  letter-spacing: 0.06em;
}
.dark .project__stage {
  background: rgba(83, 121, 191, 0.16);
  color: var(--color-blue-accent);
}
.project__status {
  color: var(--color-slate-500);
}
.dark .project__status { color: var(--color-slate-400); }
.project__meta-sep {
  color: var(--color-slate-300);
}
.dark .project__meta-sep { color: var(--color-slate-600); }
.project__excerpt {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-style: italic;
  color: var(--color-slate-500);
  line-height: 1.55;
  margin-top: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-slate-200);
}
.dark .project__excerpt {
  color: var(--color-slate-400);
  border-top-color: var(--color-slate-700);
}
.project__arrow {
  flex: 0 0 auto;
  align-self: center;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-slate-400);
  transition: color 0.15s, transform 0.15s;
}
.project:hover .project__arrow {
  color: var(--color-blue-accent);
  transform: translateX(2px);
}
.dark .project:hover .project__arrow { color: var(--color-blue-accent); }

/* ─── People grid (tab mode) ──────────────────────────── */
.people-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 768px) {
  .people-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* ─── Aside (non-tabbed mode) ─────────────────────────── */
.group__aside {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
