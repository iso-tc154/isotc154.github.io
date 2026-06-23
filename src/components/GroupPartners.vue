<script setup lang="ts">
import type { GroupCollaborativeParty } from '../types/group'
import { asciidocify } from '../utils/asciidoc'
import { projectPath } from '../utils/urn'

defineProps<{
  parties: GroupCollaborativeParty[]
}>()

function partyHtml(p: GroupCollaborativeParty): string {
  if (!p.description) return ''
  return asciidocify(p.description)
}

function projectUrl(id: string): string {
  return projectPath(id)
}
</script>

<template>
  <div v-for="(p, idx) in parties" :key="idx" class="gparty">
    <h3 class="gparty__name">{{ p.entity_name }}</h3>
    <div v-if="p.projects?.length" class="gparty__projects">
      <span class="gparty__label">Projects:</span>
      <span v-for="proj in p.projects" :key="proj" class="gparty__pill">
        <a :href="projectUrl(proj)">{{ proj }}</a>
      </span>
    </div>
    <div class="gparty__prose" v-html="partyHtml(p)"></div>
  </div>
</template>

<style scoped>
.gparty {
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-slate-200);
  border-left: 3px solid var(--color-blue-accent);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  background: #fff;
}
.dark .gparty {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
  border-left-color: var(--color-blue-accent);
}
.gparty__name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-slate-900);
}
.dark .gparty__name { color: var(--color-slate-100); }
.gparty__projects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  align-items: center;
}
.gparty__label {
  color: var(--color-slate-500);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.25rem;
}
.dark .gparty__label { color: var(--color-slate-400); }
.gparty__pill {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  background: var(--color-slate-100);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
}
.gparty__pill a { color: var(--color-blue-accent); text-decoration: none; }
.gparty__pill a:hover { text-decoration: underline; }
.dark .gparty__pill { background: var(--color-slate-800); }

.gparty__prose {
  font-size: 1rem;
  line-height: 1.75;
  color: #44403c;
  max-width: 48rem;
}
.dark .gparty__prose { color: #d6d3d1; }
.gparty__prose :deep(p) { margin: 0 0 1rem; }
.gparty__prose :deep(p:last-child) { margin-bottom: 0; }
.gparty__prose :deep(a) { color: var(--color-blue-accent); text-decoration: underline; text-underline-offset: 2px; }
</style>
