<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePosts } from '../composables/usePosts'
import { formatDate } from '../utils/format'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
const { posts, isLoaded, loadData } = usePosts()

onMounted(async () => { await loadData() })

const post = computed(() => {
  const slug = String(route.params.slug ?? '')
  return posts.value.find(p => p.slug === slug) ?? null
})

const title = computed(() => {
  return post.value?.frontmatter.title
    || post.value?.slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    || ''
})
</script>

<template>
  <div v-if="!isLoaded">
    <PageHero variant="article" bleed title="Loading…" />
    <div class="page page--wide">
      <div class="post-shell"><p class="loading">Loading…</p></div>
    </div>
  </div>

  <div v-else-if="!post">
    <PageHero
      variant="article"
      bleed
      eyebrow="404"
      title="Post not found"
      lead="No post matches this slug."
    />
    <div class="page page--wide">
      <div class="post-shell">
        <RouterLink to="/posts/" class="back-link">← All news</RouterLink>
      </div>
    </div>
  </div>

  <div v-else>
    <PageHero
      variant="article"
      bleed
      :eyebrow="formatDate(post.date)"
      :title="title"
    >
      <template #breadcrumb>
        <RouterLink to="/posts/">
          News &amp; posts
        </RouterLink>
      </template>
      <div v-if="post.frontmatter.categories" class="post__tags">
        <span class="post__tag">{{ post.frontmatter.categories }}</span>
      </div>
    </PageHero>

    <article class="page page--wide">
      <div class="post-shell">
        <div class="post__body prose" v-html="post.html"></div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.post-shell { max-width: 48rem; }
.back-link {
  display: inline-block;
  font-size: 0.875rem; font-weight: 500;
  color: var(--color-brand);
  text-decoration: none;
  margin-bottom: 1rem;
}
.back-link:hover { text-decoration: underline; }

.post__tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.post__tag {
  font-size: 0.6875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #78716c;
  background: #f5f5f4;
  padding: 0.2rem 0.625rem;
  border-radius: 9999px;
}
.dark .post__tag { color: #a8a29e; background: #44403c; }

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
  letter-spacing: -0.01em;
}
.dark .prose :deep(h2) { color: #fafaf9; }
.prose :deep(h3) {
  font-size: 1.25rem; font-weight: 700;
  color: #1c1917;
  margin: 1.5rem 0 0.625rem;
}
.dark .prose :deep(h3) { color: #fafaf9; }
.prose :deep(p) { margin: 0 0 1rem; }
.prose :deep(a) { color: var(--color-brand); text-decoration: underline; }
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
  border-left: 3px solid var(--color-brand);
  padding: 0.5rem 1rem;
  margin: 1.5rem 0;
  background: #fafaf9;
  color: #57534e;
  font-style: italic;
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
.prose :deep(th) {
  background: #fafaf9;
  font-weight: 700;
}
.dark .prose :deep(th) { background: #292524; }
.prose :deep(hr) {
  border: 0;
  border-top: 1px solid #e7e5e4;
  margin: 2rem 0;
}
.dark .prose :deep(hr) { border-top-color: #44403c; }

.loading { color: #78716c; padding: 4rem 0; text-align: center; }
</style>
