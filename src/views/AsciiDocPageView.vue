<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePages } from '../composables/usePages'

const props = defineProps<{ slug?: string }>()

const route = useRoute()
const { pages, isLoaded, loadData } = usePages()

onMounted(async () => { await loadData() })

const targetUrl = computed(() => {
  if (props.slug) return `/${props.slug}/`
  const path = route.path.endsWith('/') ? route.path : `${route.path}/`
  return path
})

const page = computed(() => {
  const url = targetUrl.value
  return pages.value.find(p => p.url === url || p.frontmatter.permalink === url) ?? null
})

const title = computed(() => page.value?.frontmatter.title || targetUrl.value)
</script>

<template>
  <div v-if="!isLoaded" class="page"><p class="loading">Loading…</p></div>

  <article v-else-if="!page" class="page">
    <header class="page__header">
      <h1 class="page__title">Page not found</h1>
      <p>No page matches <code>{{ slug }}</code>.</p>
    </header>
  </article>

  <article v-else class="page">
    <header class="page__header">
      <h1 class="page__title">{{ title }}</h1>
    </header>
    <div class="prose" v-html="page.html"></div>
  </article>
</template>

<style scoped>
.page { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
.page__header {
  border-bottom: 1px solid #e7e5e4;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}
.dark .page__header { border-bottom-color: #292524; }
.page__title {
  font-family: var(--font-serif);
  font-size: clamp(1.875rem, 3.5vw, 2.5rem);
  font-weight: 700;
  margin: 0;
  color: #1c1917;
  letter-spacing: -0.02em;
}
.dark .page__title { color: #fafaf9; }

.prose {
  font-size: 1rem; line-height: 1.7;
  color: #44403c;
}
.dark .prose { color: #d6d3d1; }
.prose :deep(h1) {
  font-family: var(--font-serif);
  font-size: 1.875rem; font-weight: 700;
  color: #1c1917;
  margin: 2rem 0 1rem;
  letter-spacing: -0.01em;
}
.dark .prose :deep(h1) { color: #fafaf9; }
.prose :deep(h2) {
  font-family: var(--font-serif);
  font-size: 1.5rem; font-weight: 700;
  color: #1c1917;
  margin: 2rem 0 0.875rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e7e5e4;
  letter-spacing: -0.01em;
}
.dark .prose :deep(h2) { color: #fafaf9; border-bottom-color: #44403c; }
.prose :deep(h3) {
  font-size: 1.25rem; font-weight: 700;
  color: #1c1917;
  margin: 1.5rem 0 0.625rem;
}
.dark .prose :deep(h3) { color: #fafaf9; }
.prose :deep(h4) {
  font-size: 1rem; font-weight: 700;
  color: #1c1917;
  margin: 1.25rem 0 0.5rem;
}
.dark .prose :deep(h4) { color: #fafaf9; }
.prose :deep(p) { margin: 0 0 1rem; }
.prose :deep(a) { color: var(--color-blue-accent); text-decoration: underline; }
.dark .prose :deep(a) { color: #94b6e8; }
.prose :deep(ul), .prose :deep(ol) { margin: 0 0 1rem; padding-left: 1.5rem; }
.prose :deep(li) { margin-bottom: 0.375rem; }
.prose :deep(code) {
  font-family: ui-monospace, monospace;
  background: #f5f5f4;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
.dark .prose :deep(code) { background: #44403c; }
.prose :deep(blockquote) {
  border-left: 3px solid var(--color-blue-accent);
  padding: 0.5rem 1rem;
  margin: 1.5rem 0;
  background: #fafaf9;
  color: #57534e;
}
.dark .prose :deep(blockquote) {
  background: #292524;
  color: #d6d3d1;
  border-left-color: #5379bf;
}
.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9375rem;
}
.prose :deep(th), .prose :deep(td) {
  border: 1px solid #e7e5e4;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.dark .prose :deep(th), .dark .prose :deep(td) { border-color: #44403c; }
.prose :deep(th) { background: #fafaf9; font-weight: 700; }
.dark .prose :deep(th) { background: #292524; }
.prose :deep(hr) {
  border: 0;
  border-top: 1px solid #e7e5e4;
  margin: 2rem 0;
}
.dark .prose :deep(hr) { border-top-color: #44403c; }

.prose :deep(.business-plan-cta) {
  margin: 1.25rem 0 1.75rem;
  padding: 1.25rem 1.5rem;
  border-left: 4px solid var(--color-iso-red);
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.dark .prose :deep(.business-plan-cta) {
  background: linear-gradient(135deg, rgb(185 28 28 / 0.08) 0%, rgb(15 23 42 / 0.5) 100%);
  border-left-color: var(--color-iso-red);
}
.prose :deep(.business-plan-cta a) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-iso-red);
  text-decoration: none;
  font-weight: 700;
}
.prose :deep(.business-plan-cta a::before) {
  content: '⬇';
  display: inline-block;
  font-size: 0.875rem;
}
.dark .prose :deep(.business-plan-cta a) { color: #ff6b73; }
.prose :deep(.business-plan-cta a:hover) { text-decoration: underline; }

.loading { color: #78716c; padding: 4rem 0; text-align: center; }
</style>
