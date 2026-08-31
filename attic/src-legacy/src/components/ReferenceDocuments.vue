<script setup lang="ts">
import type { ReferenceDocument } from '../types/event'

defineProps<{ documents: ReferenceDocument[] }>()
</script>

<template>
  <ul class="rd">
    <li
      v-for="(doc, i) in documents"
      :key="i"
      class="rd__item"
    >
      <span class="rd__id">{{ doc.id }}</span>
      <span class="rd__desc">{{ doc.description }}</span>
    </li>
  </ul>
</template>

<style scoped>
.rd {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(22rem, 100%), 1fr));
  gap: 0;
  border-top: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .rd { border-top-color: var(--color-slate-700, #44403c); }
.rd__item {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.625rem 1rem;
  align-items: baseline;
  padding: 0.5625rem 0;
  border-bottom: 1px solid var(--color-slate-200, #e7e5e4);
}
.dark .rd__item { border-bottom-color: var(--color-slate-700, #44403c); }
.rd__id {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-blue-accent, #1e3a8a);
  letter-spacing: 0.02em;
}
.dark .rd__id { color: var(--color-brand-soft, #94b6e8); }
.rd__desc {
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-slate-600, #57534e);
}
.dark .rd__desc { color: var(--color-slate-300, #d6d3d1); }
@media (max-width: 480px) {
  .rd__item { grid-template-columns: 4rem 1fr; gap: 0.5rem 0.75rem; }
  .rd__id { font-size: 0.6875rem; }
  .rd__desc { font-size: 0.75rem; }
}
</style>
