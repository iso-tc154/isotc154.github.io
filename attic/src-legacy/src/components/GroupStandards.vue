<script setup lang="ts">
import type { StandardCard } from '../composables/useGroupRoster'

defineProps<{
  cards: StandardCard[]
}>()
</script>

<template>
  <ul class="gstd__list">
    <li v-for="card in cards" :key="card.raw" class="gstd__item">
      <a :href="card.url" class="gstd__link">
        <span class="gstd__main">
          <span class="gstd__code">{{ card.raw }}</span>
          <span v-if="card.standard?.iso.title" class="gstd__title">
            {{ card.standard.iso.title }}
          </span>
          <span v-if="card.year || card.stage" class="gstd__meta">
            <span v-if="card.year" class="gstd__year">{{ card.year }}</span>
            <span v-if="card.year && card.stage" class="gstd__meta-sep" aria-hidden="true">·</span>
            <span v-if="card.stage" class="gstd__stage">{{ card.stage }}</span>
          </span>
        </span>
        <span class="gstd__arrow" aria-hidden="true">→</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.gstd__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.gstd__item {
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dark .gstd__item {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
}
.gstd__item:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}
.gstd__link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: inherit;
}
.gstd__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}
.gstd__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-slate-900);
  letter-spacing: -0.01em;
}
.dark .gstd__code { color: var(--color-slate-100); }
.gstd__title {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--color-slate-600);
  font-style: italic;
  line-height: 1.4;
}
.dark .gstd__title { color: var(--color-slate-300); }
.gstd__meta {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.75rem;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}
.dark .gstd__meta { color: var(--color-slate-400); }
.gstd__year {
  font-family: var(--font-serif);
  font-style: italic;
}
.gstd__meta-sep { color: var(--color-slate-300); }
.dark .gstd__meta-sep { color: var(--color-slate-600); }
.gstd__stage {
  text-transform: capitalize;
  letter-spacing: 0.02em;
}
.gstd__arrow {
  flex: 0 0 auto;
  align-self: center;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-slate-400);
  transition: color 0.15s, transform 0.15s;
}
.gstd__item:hover .gstd__arrow {
  color: var(--color-blue-accent);
  transform: translateX(2px);
}
.dark .gstd__item:hover .gstd__arrow { color: var(--color-blue-accent); }
</style>
