<script setup lang="ts">
defineProps<{
  introHtml: string
  description: string
  historyStoryHtml: string
}>()
</script>

<template>
  <div v-if="introHtml" class="prose" v-html="introHtml"></div>
  <div
    v-if="description"
    :class="['prose', introHtml ? 'gover__prose-block' : '']"
    v-html="description"
  ></div>
  <div
    v-if="historyStoryHtml"
    :class="['prose', introHtml || description ? 'gover__prose-block' : '']"
    v-html="historyStoryHtml"
  ></div>
</template>

<style scoped>
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

.gover__prose-block { margin-top: 2rem; }
.gover__prose-block::before {
  content: '';
  display: block;
  width: 3rem;
  height: 1px;
  background: var(--color-slate-300);
  margin-bottom: 1.5rem;
}
.dark .gover__prose-block::before { background: var(--color-slate-600); }
</style>
