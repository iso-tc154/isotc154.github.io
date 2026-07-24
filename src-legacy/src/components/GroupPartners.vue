<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { GroupCollaborativeParty } from '../types/group'
import { renderProse } from '../utils/prose'
import { projectPath } from '../utils/urn'
import { useLiaisons } from '../composables/useLiaisons'
import OrgLogo from './OrgLogo.vue'

const props = defineProps<{
  parties: GroupCollaborativeParty[]
}>()

const { liaisons, loadData } = useLiaisons()
onMounted(loadData)

const LIAISON_PREFIX = '/assets/images/liaisons/'

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\.$/, '')
}

function liaisonFor(name: string) {
  const target = normalize(name)
  if (!target) return undefined
  return liaisons.value.find((l) => {
    if (l.id && l.id.toLowerCase() === target) return true
    if (l.short_name && normalize(l.short_name) === target) return true
    if (l.name && normalize(l.name) === target) return true
    if (l.aliases?.some((a) => normalize(a) === target)) return true
    return false
  })
}

function partyHtml(p: GroupCollaborativeParty): string {
  if (!p.description) return ''
  return renderProse(p.description)
}

function projectUrl(id: string): string {
  return projectPath(id)
}

const ordered = computed(() => {
  const list = [...props.parties]
  return list.sort((a, b) => {
    const aj = a.relationship === 'joint_sponsor' ? 0 : 1
    const bj = b.relationship === 'joint_sponsor' ? 0 : 1
    return aj - bj
  })
})
</script>

<template>
  <div v-for="(p, idx) in ordered" :key="idx" :class="['gparty', { 'gparty--joint': p.relationship === 'joint_sponsor' }]">
    <span v-if="p.relationship === 'joint_sponsor'" class="gparty__seal">
      <span class="gparty__seal-mark" aria-hidden="true"></span>
      Joint sponsor
    </span>
    <div class="gparty__head">
      <OrgLogo
        v-if="liaisonFor(p.entity_name)"
        :logo="liaisonFor(p.entity_name)?.logo"
        :logo_light="liaisonFor(p.entity_name)?.logo_light"
        :logo_dark="liaisonFor(p.entity_name)?.logo_dark"
        :asset-prefix="LIAISON_PREFIX"
        :fallback-text="p.entity_name"
        :alt="p.entity_name + ' logo'"
        size="lg"
        :radius="'0.5rem'"
        :class="['gparty__logo', { 'gparty__logo--joint': p.relationship === 'joint_sponsor' }]"
      />
      <div class="gparty__head-text">
        <h3 :class="['gparty__name', { 'gparty__name--joint': p.relationship === 'joint_sponsor' }]">{{ p.entity_name }}</h3>
        <a
          v-if="liaisonFor(p.entity_name)?.url"
          :href="liaisonFor(p.entity_name)!.url"
          class="gparty__url"
          target="_blank"
          rel="noopener"
        >{{ liaisonFor(p.entity_name)!.short_name || p.entity_name }} ↗</a>
      </div>
    </div>
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
  position: relative;
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

.gparty--joint {
  padding: 1.5rem 1.75rem;
  border: 1px solid rgba(30, 58, 138, 0.18);
  border-left: 3px solid transparent;
  border-image: linear-gradient(180deg, var(--color-brand) 0%, var(--color-amber-warm) 100%) 1;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.035) 0%, rgba(180, 83, 9, 0.025) 100%);
  box-shadow: 0 1px 2px rgba(30, 58, 138, 0.04);
}
.dark .gparty--joint {
  background: linear-gradient(135deg, rgba(51, 133, 214, 0.07) 0%, rgba(180, 83, 9, 0.05) 100%);
  border-color: rgba(51, 133, 214, 0.22);
  border-image: linear-gradient(180deg, #93c5fd 0%, #fcd34d 100%) 1;
  box-shadow: none;
}

.gparty__seal {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(180, 83, 9, 0.08) 100%);
  border: 1px solid rgba(30, 58, 138, 0.15);
  border-radius: 9999px;
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-600);
}
.dark .gparty__seal {
  background: linear-gradient(135deg, rgba(51, 133, 214, 0.12) 0%, rgba(180, 83, 9, 0.1) 100%);
  border-color: rgba(51, 133, 214, 0.25);
  color: var(--color-slate-300);
}
.gparty__seal-mark {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-amber-warm) 100%);
}
.dark .gparty__seal-mark {
  background: linear-gradient(135deg, #93c5fd 0%, #fcd34d 100%);
}

.gparty__head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 0 0.75rem;
  padding-right: 8rem;
}
.gparty__head-text {
  min-width: 0;
}
.gparty__logo {
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
}
.gparty__logo--joint {
  box-shadow: 0 0 0 1px rgba(30, 58, 138, 0.18), 0 1px 3px rgba(30, 58, 138, 0.06);
}
.dark .gparty__logo--joint {
  box-shadow: 0 0 0 1px rgba(51, 133, 214, 0.25);
}

.gparty__name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0 0 0.125rem;
  color: var(--color-slate-900);
  line-height: 1.3;
}
.dark .gparty__name { color: var(--color-slate-100); }
.gparty__name--joint {
  font-size: 1.25rem;
}
.gparty__url {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: var(--color-slate-500);
  text-decoration: none;
  letter-spacing: 0.01em;
}
.gparty__url:hover {
  color: var(--color-blue-accent);
  text-decoration: underline;
}

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

@media (max-width: 640px) {
  .gparty__head {
    padding-right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .gparty__seal {
    position: static;
    align-self: flex-start;
    margin-bottom: 0.5rem;
  }
}
</style>
