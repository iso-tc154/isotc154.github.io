<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjects } from '../composables/useProjects'
import { useGroups } from '../composables/useGroups'
import { projectStatusLabel, type Project } from '../types/project'
import { asciidocify } from '../utils/asciidoc'

const route = useRoute()
const { projects, isLoaded, loadData } = useProjects()
const { loadData: loadGroups, all: allGroups } = useGroups()
const project = computed<Project | null>(() => {
  const id = String(route.params.id ?? '')
  return projects.value.find(p => p.id === id) ?? null
})

onMounted(async () => { await Promise.all([loadData(), loadGroups()]) })

const scopeHtml = computed(() => {
  if (!project.value?.scope) return ''
  return asciidocify(project.value.scope)
})

const owningGroups = computed(() => {
  if (!project.value) return []
  return allGroups().filter(g => (g.active_projects ?? []).includes(project.value!.id))
})
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>
  <div class="detail" v-else-if="!project">
    <header class="detail__header">
      <h1>Project not found</h1>
      <RouterLink to="/projects/" class="detail__back">← All projects</RouterLink>
    </header>
  </div>
  <article class="detail" v-else :key="project.id">
    <header class="detail__header">
      <RouterLink to="/projects/" class="detail__back">← All projects</RouterLink>
      <div class="detail__eyebrow-row">
        <span class="detail__status" :class="`detail__status--${project.status ?? 'unknown'}`">{{ projectStatusLabel(project.status) }}</span>
        <span v-if="project.stage" class="detail__stage">Stage {{ project.stage }}</span>
      </div>
      <p class="detail__number">{{ project.name }}</p>
      <h1>{{ project.title }}</h1>
    </header>

    <div class="detail__grid">
      <div class="detail__main">
        <section v-if="scopeHtml" class="detail__section">
          <h2 class="detail__section-title">Scope</h2>
          <div class="prose" v-html="scopeHtml"></div>
        </section>

        <section v-if="project.url" class="detail__section">
          <h2 class="detail__section-title">ISO project page</h2>
          <a :href="project.url" target="_blank" rel="noopener noreferrer" class="external">
            {{ project.url }}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
          </a>
        </section>
      </div>

      <aside class="detail__aside">
        <section v-if="owningGroups.length" class="detail__aside-block">
          <h3 class="detail__aside-title">Responsible group{{ owningGroups.length > 1 ? 's' : '' }}</h3>
          <ul class="groups">
            <li v-for="g in owningGroups" :key="g.id">
              <a :href="`/groups/${g.id}/`">
                <strong v-html="g.name"></strong>
                <span>{{ g.title }}</span>
              </a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.detail { max-width: 64rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__header { margin-bottom: 2rem; }
.detail__back { display: inline-block; font-size: 0.875rem; font-weight: 500; color: var(--color-blue-accent); text-decoration: none; margin-bottom: 1rem; }
.detail__back:hover { text-decoration: underline; }
.dark .detail__back { color: #94b6e8; }
.detail__eyebrow-row { display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center; margin-bottom: 0.5rem; }
.detail__status { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.25rem 0.625rem; border-radius: 0.25rem; background: #f5f5f4; color: #57534e; }
.dark .detail__status { background: #292524; color: #d6d3d1; }
.detail__status--current { background: rgb(30 58 138 / 0.1); color: var(--color-blue-accent); }
.dark .detail__status--current { background: rgb(51 133 214 / 0.2); color: #93c5fd; }
.detail__status--deleted { background: rgb(185 28 28 / 0.1); color: var(--color-iso-red); }
.dark .detail__status--deleted { background: rgb(185 28 28 / 0.2); color: #fca5a5; }
.detail__status--withdrawn { background: #f5f5f4; color: #78716c; }
.dark .detail__status--withdrawn { background: #292524; color: #a8a29e; }
.detail__stage { font-size: 0.75rem; font-family: ui-monospace, monospace; color: #78716c; }
.dark .detail__stage { color: #a8a29e; }
.detail__number { font-family: ui-monospace, monospace; font-size: 1rem; font-weight: 600; color: #78716c; margin: 0 0 0.5rem; }
.dark .detail__number { color: #a8a29e; }
.detail__header h1 { font-family: var(--font-serif); font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; color: #1c1917; margin: 0; letter-spacing: -0.01em; line-height: 1.25; }
.dark .detail__header h1 { color: #fafaf9; }

.detail__grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
@media (min-width: 1024px) { .detail__grid { grid-template-columns: minmax(0, 1fr) 20rem; } }

.detail__section { margin-bottom: 2rem; }
.detail__section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin: 0 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e7e5e4; }
.dark .detail__section-title { color: #a8a29e; border-bottom-color: #292524; }

.prose { font-size: 0.9375rem; line-height: 1.7; color: #44403c; }
.dark .prose { color: #d6d3d1; }
.prose :deep(p) { margin: 0 0 0.875rem; }
.prose :deep(p:last-child) { margin-bottom: 0; }

.external { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: #fafaf9; border-radius: 0.375rem; font-size: 0.875rem; color: var(--color-blue-accent); text-decoration: none; word-break: break-all; }
.external:hover { background: #e0e7ff; }
.dark .external { background: #292524; color: #94b6e8; }
.dark .external:hover { background: #44403c; }

.detail__aside { display: flex; flex-direction: column; gap: 1rem; }
.detail__aside-block { padding: 1.25rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem; }
.dark .detail__aside-block { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.detail__aside-title { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin: 0 0 0.875rem; }
.dark .detail__aside-title { color: #a8a29e; }

.groups { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.groups a { display: flex; flex-direction: column; padding: 0.625rem 0.75rem; background: #fafaf9; border-radius: 0.375rem; text-decoration: none; transition: background 0.15s; }
.groups a:hover { background: #e0e7ff; }
.dark .groups a { background: #292524; }
.dark .groups a:hover { background: #44403c; }
.groups strong { color: var(--color-blue-accent); font-size: 0.9375rem; font-weight: 700; }
.dark .groups strong { color: #94b6e8; }
.groups span { color: #78716c; font-size: 0.8125rem; }
.dark .groups span { color: #a8a29e; }
</style>
