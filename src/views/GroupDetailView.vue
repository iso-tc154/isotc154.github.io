<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { useStandards } from '../composables/useStandards'
import { useProjects } from '../composables/useProjects'
import { useGroupRoster } from '../composables/useGroupRoster'
import { type Group, type SubnavSection } from '../types/group'
import { lifecycleStatus } from '../domain/groupPresentation'
import { asciidocify } from '../utils/asciidoc'
import PageHero from '../components/PageHero.vue'
import SectionTabs from '../components/SectionTabs.vue'
import GroupHero from '../components/GroupHero.vue'
import GroupSection from '../components/GroupSection.vue'
import GroupOverview from '../components/GroupOverview.vue'
import GroupHistory from '../components/GroupHistory.vue'
import GroupPartners from '../components/GroupPartners.vue'
import GroupStandards from '../components/GroupStandards.vue'
import GroupProjects from '../components/GroupProjects.vue'
import PeopleList from '../components/PeopleList.vue'

interface PeopleGroup {
  id: string
  label: string
  members: string[]
  variant: 'current' | 'past'
}

const route = useRoute()
const { groups, isLoaded, loadData } = useGroups()
const { loadData: loadMembers } = useMembers()
const { loadData: loadStandards } = useStandards()
const { loadData: loadProjects } = useProjects()
const roster = useGroupRoster()

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

const status = computed(() => group.value ? lifecycleStatus(group.value) : 'active')

const establishedYear = computed(() => {
  const date = group.value?.history?.established?.date
  return date ? String(date).slice(0, 4) : null
})

const dissolvedYear = computed(() => {
  const date = group.value?.history?.dissolved?.date
  return date ? String(date).slice(0, 4) : null
})

const lifecycleEvents = computed(() => group.value?.history?.events ?? [])
const convenorTerms = computed(() => group.value?.convenor_terms ?? [])
const pastLeadership = computed(() => group.value?.history?.leadership ?? [])
const predecessorTerms = computed(() =>
  group.value ? roster.predecessorTermsOf(group.value) : [],
)

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

const heroConvenors = computed(() =>
  roster.heroPeople(convenors.value.length ? convenors.value : coChairs.value, convenorTerms.value),
)
const heroConvenorLabel = computed(() =>
  convenors.value.length ? 'Convenor' : (coChairs.value.length ? 'Co-chair' : ''),
)
const heroManagers = computed(() => roster.heroPeople(managers.value))

const peopleGroups = computed<PeopleGroup[]>(() => {
  if (!group.value) return []
  const g = group.value
  const list: PeopleGroup[] = []
  if (g.members?.length) list.push({ id: 'members', label: `Members (${g.members.length})`, members: g.members, variant: 'current' })
  if (g.past_members?.length) list.push({ id: 'past-members', label: 'Past members', members: g.past_members, variant: 'past' })
  return list
})

const standardCards = computed(() => roster.standardCardsFor(group.value?.standards ?? []))
const projectCards = computed(() => roster.projectCardsFor(group.value?.active_projects ?? []))

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

const enabledSectionIds = computed(() => new Set(sections.value.map(s => s.id)))
function sectionEnabled(id: string): boolean {
  return enabledSectionIds.value.has(id)
}

const tabbedMode = computed(() => sections.value.length >= 3)
const activeTab = ref('')

watch(sections, (secs) => {
  if (!secs.length) {
    activeTab.value = ''
    return
  }
  if (activeTab.value && secs.some((s) => s.id === activeTab.value)) return
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
  activeTab.value = (hash && secs.some((s) => s.id === hash)) ? hash : secs[0].id
}, { immediate: true })

function sectionVisible(id: string): boolean {
  if (!tabbedMode.value) return true
  return activeTab.value === id
}

function standardCountLabel(n: number): string {
  return `${n} catalogue entr${n === 1 ? 'y' : 'ies'} attributable to this group.`
}
function projectCountLabel(n: number): string {
  return `${n} active work item${n === 1 ? '' : 's'}.`
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
    <GroupHero
      :group="group"
      :status="status"
      :hero-convenors="heroConvenors"
      :hero-convenor-label="heroConvenorLabel"
      :hero-managers="heroManagers"
      :established-year="establishedYear"
      :dissolved-year="dissolvedYear"
    />

    <SectionTabs v-if="tabbedMode" v-model="activeTab" :sections="sections" />

    <div :class="['group__body', tabbedMode ? 'group__body--single' : 'group__body--grid']">
      <div :class="{ 'group__main': !tabbedMode }">
        <GroupSection
          v-if="sectionEnabled('overview')"
          section-id="overview"
          title="Overview"
          :tabbed="tabbedMode"
          :visible="sectionVisible('overview')"
        >
          <GroupOverview
            :intro-html="introHtml"
            :description="description"
            :history-story-html="historyStoryHtml"
          />
        </GroupSection>

        <GroupSection
          v-if="sectionEnabled('history')"
          section-id="history"
          title="History"
          :tabbed="tabbedMode"
          :visible="sectionVisible('history')"
        >
          <GroupHistory
            :lifecycle-events="lifecycleEvents"
            :convenor-terms="convenorTerms"
            :predecessor-terms="predecessorTerms"
            :predecessor-name="group.predecessor?.name"
            :past-leadership="pastLeadership"
            :name-of="roster.nameOf"
          />
        </GroupSection>

        <GroupSection
          v-if="sectionEnabled('partners')"
          section-id="partners"
          title="Collaborative parties"
          :tabbed="tabbedMode"
          :visible="sectionVisible('partners')"
        >
          <GroupPartners :parties="group.collaborative_parties ?? []" />
        </GroupSection>

        <GroupSection
          v-if="sectionEnabled('standards')"
          section-id="standards"
          title="Standards"
          :intro="standardCountLabel(standardCards.length)"
          :tabbed="tabbedMode"
          :visible="sectionVisible('standards')"
        >
          <GroupStandards :cards="standardCards" />
        </GroupSection>

        <GroupSection
          v-if="sectionEnabled('projects')"
          section-id="projects"
          title="Active projects"
          :intro="projectCountLabel(projectCards.length)"
          :tabbed="tabbedMode"
          :visible="sectionVisible('projects')"
        >
          <GroupProjects :cards="projectCards" />
        </GroupSection>

        <GroupSection
          v-if="tabbedMode && sectionEnabled('members')"
          section-id="members"
          title="Members"
          :tabbed="true"
          :visible="sectionVisible('members')"
        >
          <div class="group__people-grid">
            <PeopleList :groups="peopleGroups" :name-of="roster.nameOf" />
          </div>
        </GroupSection>
      </div>

      <aside v-if="!tabbedMode && sectionEnabled('members')" class="group__aside">
        <PeopleList :groups="peopleGroups" :name-of="roster.nameOf" />
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
.detail__body { padding-top: 1.5rem; }
.detail__back {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.detail__back:hover { text-decoration: underline; }

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

.group__aside {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group__people-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 768px) {
  .group__people-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
