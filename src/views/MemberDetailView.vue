<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMembers } from '../composables/useMembers'
import { useGroups } from '../composables/useGroups'
import type { RoleRecord } from '../types/member'
import { flattenMemberRoles, memberRoleSpan } from '../types/member'
import { asciidocify } from '../utils/asciidoc'
import { roleLabel as formatRoleLabel } from '../utils/roles'

const route = useRoute()
const { index, isLoaded, loadData } = useMembers()
const { loadData: loadGroups, get: getGroup } = useGroups()

const member = computed(() => {
  const id = String(route.params.id ?? '')
  return index.value?.all?.[id] ?? null
})

onMounted(async () => {
  await Promise.all([loadData(), loadGroups()])
})

const roles = computed<RoleRecord[]>(() => {
  if (!member.value) return []
  return flattenMemberRoles(member.value)
})

const bioHtml = computed(() => {
  if (!member.value?.bio) return ''
  return asciidocify(member.value.bio)
})

const pictureUrl = computed<string | null>(() => {
  if (!member.value?.picture) return null
  return `/assets/images/members/${member.value.picture}`
})

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function roleLabel(roleId: string): string {
  return formatRoleLabel(roleId)
}

function groupLabel(groupId?: string): string {
  if (!groupId) return ''
  const g = getGroup(groupId)
  return g?.title ?? groupId
}

function groupUrl(groupId?: string): string | null {
  if (!groupId) return null
  return `/groups/${groupId}/`
}

function sortedRoles(list: RoleRecord[]): RoleRecord[] {
  return [...list].sort((a, b) => {
    const ag = a.group ?? '~'
    const bg = b.group ?? '~'
    if (ag !== bg) return ag.localeCompare(bg)
    return (a.from?.date ?? '').localeCompare(b.from?.date ?? '')
  })
}
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>

  <div class="detail" v-else-if="!member">
    <header class="detail__header">
      <h1>Member not found</h1>
      <p>No member matches <code>{{ route.params.id }}</code>.</p>
      <RouterLink to="/members/" class="detail__back">← All members</RouterLink>
    </header>
  </div>

  <article class="detail" v-else :key="member['member-id']">
    <header class="detail__header">
      <RouterLink to="/members/" class="detail__back">← All members</RouterLink>
      <div class="detail__head">
        <div class="detail__avatar" :class="{ 'detail__avatar--deceased': member.deceased }">
          <img v-if="pictureUrl" :src="pictureUrl" :alt="member.name" />
          <span v-else>{{ memberInitials(member.name) }}</span>
        </div>
        <div>
          <p class="detail__eyebrow">
            <span v-if="member.is_the_chair">Chair of ISO/TC 154</span>
            <span v-else-if="member.is_in_leadership">Leadership</span>
            <span v-else-if="member.is_current">Current member</span>
            <span v-else>Past member</span>
            <span v-if="member.deceased"> · In Memoriam</span>
          </p>
          <h1>{{ member.name }}</h1>
          <p class="detail__affiliation" v-if="member.affiliation">{{ member.affiliation }}</p>
        </div>
      </div>
    </header>

    <div class="detail__body">
      <section v-if="bioHtml" class="detail__section">
        <h2 class="detail__section-title">Biography</h2>
        <div class="prose" v-html="bioHtml"></div>
      </section>

      <section v-if="roles.length" class="detail__section">
        <h2 class="detail__section-title">Roles in ISO/TC 154</h2>
        <ul class="roles">
          <li v-for="(r, idx) in sortedRoles(roles)" :key="idx" class="role">
            <div class="role__head">
              <span class="role__title">{{ roleLabel(r.id) }}</span>
              <a v-if="groupUrl(r.group)" :href="groupUrl(r.group)!" class="role__group">{{ groupLabel(r.group) }}</a>
              <span v-else-if="r.group" class="role__group role__group--plain">{{ groupLabel(r.group) }}</span>
              <span v-else class="role__group role__group--plain">Committee-wide</span>
            </div>
            <span class="role__span">{{ memberRoleSpan(r) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="member.links?.length" class="detail__section">
        <h2 class="detail__section-title">Links</h2>
        <ul class="links">
          <li v-for="(l, idx) in member.links" :key="idx">
            <a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.label ?? l.title ?? l.url }}</a>
          </li>
        </ul>
      </section>
    </div>
  </article>
</template>

<style scoped>
.detail {
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__header { margin-bottom: 2rem; }
.detail__back {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-blue-accent);
  text-decoration: none;
  margin-bottom: 1rem;
}
.detail__back:hover { text-decoration: underline; }
.dark .detail__back { color: #94b6e8; }
.detail__head { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
.detail__avatar {
  width: 6rem; height: 6rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--color-blue-accent), #5379bf);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.75rem;
  overflow: hidden;
  flex-shrink: 0;
}
.detail__avatar img { width: 100%; height: 100%; object-fit: cover; }
.detail__avatar--deceased img { filter: grayscale(1); }
.detail__eyebrow {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .detail__eyebrow { color: #94b6e8; }
.detail__header h1 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}
.dark .detail__header h1 { color: #fafaf9; }
.detail__affiliation {
  font-size: 1rem; color: #57534e; margin: 0;
}
.dark .detail__affiliation { color: #d6d3d1; }

.detail__body { margin-top: 2rem; }
.detail__section { margin-bottom: 2.5rem; }
.detail__section-title {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #78716c;
  margin: 0 0 0.875rem;
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
.dark .prose :deep(a) { color: #94b6e8; }

.roles {
  list-style: none;
  margin: 0; padding: 0;
  display: flex; flex-direction: column;
  gap: 0.5rem;
}
.role {
  display: flex; flex-direction: column;
  padding: 0.625rem 0.875rem;
  background: #fafaf9;
  border-radius: 0.5rem;
  border-left: 3px solid var(--color-blue-accent);
}
.dark .role { background: #292524; border-left-color: #5379bf; }
.role__head {
  display: flex; justify-content: space-between;
  align-items: baseline; gap: 0.5rem;
  flex-wrap: wrap;
}
.role__title {
  font-size: 0.9375rem; font-weight: 600; color: #1c1917;
}
.dark .role__title { color: #fafaf9; }
.role__group {
  font-size: 0.875rem; color: var(--color-blue-accent);
  text-decoration: none;
  font-weight: 500;
}
.role__group:hover { text-decoration: underline; }
.role__group--plain { color: #78716c; }
.dark .role__group--plain { color: #a8a29e; }
.role__span {
  font-size: 0.8125rem; color: #78716c;
  font-family: ui-monospace, monospace;
  margin-top: 0.125rem;
}
.dark .role__span { color: #a8a29e; }

.links {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column;
  gap: 0.375rem;
}
.links a {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background: #fafaf9;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.links a:hover { background: #e0e7ff; }
.dark .links a { background: #292524; color: #94b6e8; }
.dark .links a:hover { background: #44403c; }
</style>
