<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { groupCategoryLabel, type Group, type GroupCollaborativeParty } from '../types/group'
import { asciidocify } from '../utils/asciidoc'
import { memberPath, projectPath } from '../utils/urn'
import type { Member } from '../types/member'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
const { groups, isLoaded, loadData } = useGroups()
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
        <span v-html="group.name"></span>
      </template>
      <template #breadcrumb>
        <RouterLink to="/groups/">
          Groups
        </RouterLink>
      </template>
    </PageHero>

    <div class="detail__grid">
      <div class="detail__main">
        <section v-if="introHtml" class="detail__section">
          <h2 class="detail__section-title">Overview</h2>
          <div class="prose" v-html="introHtml"></div>
        </section>

        <section v-if="description" class="detail__section">
          <h2 class="detail__section-title">Mandate</h2>
          <div class="prose" v-html="description"></div>
        </section>

        <section v-if="scopeHtml" class="detail__section">
          <h2 class="detail__section-title">Scope</h2>
          <div class="prose" v-html="scopeHtml"></div>
        </section>

        <section v-if="group.history?.story && historyStoryHtml" class="detail__section">
          <h2 class="detail__section-title">History</h2>
          <div class="prose" v-html="historyStoryHtml"></div>
        </section>

        <section v-if="group.collaborative_parties?.length" class="detail__section">
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

        <section v-if="group.standards?.length" class="detail__section">
          <h2 class="detail__section-title">Standards</h2>
          <ul class="detail__standards">
            <li v-for="std in group.standards" :key="std">{{ std }}</li>
          </ul>
        </section>

        <section v-if="group.active_projects?.length" class="detail__section">
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

.detail__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}
@media (min-width: 1024px) {
  .detail__grid { grid-template-columns: minmax(0, 1fr) 22rem; }
}

.detail__section { margin-bottom: 2rem; }
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
