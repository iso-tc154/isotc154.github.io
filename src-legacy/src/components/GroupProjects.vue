<script setup lang="ts">
import type { ProjectCard } from '../composables/useGroupRoster'

defineProps<{
  cards: ProjectCard[]
}>()
</script>

<template>
  <ul class="gproj__list">
    <li v-for="card in cards" :key="card.id" class="gproj__item">
      <a :href="card.url" class="gproj__link">
        <span class="gproj__main">
          <span class="gproj__code">{{ card.name }}</span>
          <span v-if="card.title" class="gproj__title">
            {{ card.title }}
          </span>
          <span v-if="card.stage || card.statusLabel" class="gproj__meta">
            <span v-if="card.stage" class="gproj__stage">{{ card.stage }}</span>
            <span v-if="card.stage && card.statusLabel" class="gproj__meta-sep" aria-hidden="true">·</span>
            <span v-if="card.statusLabel" class="gproj__status">{{ card.statusLabel }}</span>
          </span>
          <span v-if="card.excerpt" class="gproj__excerpt">
            {{ card.excerpt }}
          </span>
        </span>
        <span class="gproj__arrow" aria-hidden="true">→</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.gproj__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.gproj__item {
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dark .gproj__item {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
}
.gproj__item:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}
.gproj__link {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.125rem;
  text-decoration: none;
  color: inherit;
}
.gproj__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.gproj__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .gproj__code { color: var(--color-slate-100); }
.gproj__title {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-slate-700);
  line-height: 1.4;
}
.dark .gproj__title { color: var(--color-slate-200); }
.gproj__meta {
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
.dark .gproj__meta { color: var(--color-slate-400); }
.gproj__stage {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: rgba(30, 58, 138, 0.08);
  color: var(--color-brand);
  border-radius: 0.1875rem;
  letter-spacing: 0.06em;
}
.dark .gproj__stage {
  background: rgba(83, 121, 191, 0.16);
  color: var(--color-blue-accent);
}
.gproj__status { color: var(--color-slate-500); }
.dark .gproj__status { color: var(--color-slate-400); }
.gproj__meta-sep { color: var(--color-slate-300); }
.dark .gproj__meta-sep { color: var(--color-slate-600); }
.gproj__excerpt {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-style: italic;
  color: var(--color-slate-500);
  line-height: 1.55;
  margin-top: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-slate-200);
}
.dark .gproj__excerpt {
  color: var(--color-slate-400);
  border-top-color: var(--color-slate-700);
}
.gproj__arrow {
  flex: 0 0 auto;
  align-self: center;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-slate-400);
  transition: color 0.15s, transform 0.15s;
}
.gproj__item:hover .gproj__arrow {
  color: var(--color-blue-accent);
  transform: translateX(2px);
}
.dark .gproj__item:hover .gproj__arrow { color: var(--color-blue-accent); }
</style>
