<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePosts } from '../composables/usePosts'
import { formatDate } from '../utils/format'

const { posts, isLoaded, loadData, byYear } = usePosts()

onMounted(async () => { await loadData() })

const yearGroups = computed(() => byYear())

function excerpt(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 200 ? text.slice(0, 200).trim() + '…' : text
}

function postTitle(post: typeof posts.value[number]): string {
  return post.frontmatter.title || post.slug
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function postCategories(post: typeof posts.value[number]): string[] {
  const c = post.frontmatter.categories
  if (!c) return []
  if (Array.isArray(c)) return c
  return String(c).split(/[,\s]+/).filter(Boolean)
}
</script>

<template>
  <div class="page news-list">
    <header class="page__header">
      <p class="page__eyebrow">ISO/TC 154</p>
      <h1 class="page__title">News &amp; announcements</h1>
      <p class="page__lead">
        Publications of new and revised ISO/TC 154 standards, committee
        announcements, and obituaries of esteemed colleagues.
      </p>
    </header>

    <div v-if="!isLoaded" class="loading">Loading…</div>

    <section
      v-for="[year, items] in yearGroups"
      :key="year"
      class="year-section"
    >
      <h2 class="year-section__heading">{{ year }}</h2>
      <ul class="post-list">
        <li v-for="post in items" :key="post.slug" class="post-card">
          <RouterLink :to="`/posts/${post.slug}/`" class="post-card__link">
            <p class="post-card__date">{{ formatDate(post.date) }}</p>
            <h3 class="post-card__title">{{ postTitle(post) }}</h3>
            <p v-if="excerpt(post.html)" class="post-card__excerpt">{{ excerpt(post.html) }}</p>
            <div v-if="postCategories(post).length" class="post-card__tags">
              <span v-for="c in postCategories(post)" :key="c" class="post-card__tag">{{ c }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>

    <div v-if="isLoaded && !posts.length" class="empty">
      <p>No posts published yet.</p>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
.page__eyebrow {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .page__eyebrow { color: #94b6e8; }
.page__title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  color: #1c1917;
}
.dark .page__title { color: #fafaf9; }
.page__lead {
  font-size: 1.0625rem; line-height: 1.65; color: #57534e;
  max-width: 48rem; margin: 0 0 3rem;
}
.dark .page__lead { color: #d6d3d1; }

.year-section { margin-bottom: 2.5rem; }
.year-section__heading {
  font-family: var(--font-serif);
  font-size: 1.5rem; font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .year-section__heading { border-bottom-color: #292524; }

.post-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.875rem;
}
.post-card {
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  background: #fff;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.dark .post-card {
  background: #292524;
  border-color: #44403c;
}
.post-card:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -4px rgba(0, 97, 173, 0.15);
}
.post-card__link {
  display: block;
  padding: 1rem 1.25rem;
  text-decoration: none; color: inherit;
}
.post-card__date {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-brand);
  margin: 0 0 0.375rem;
}
.post-card__title {
  font-size: 1.125rem; font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}
.dark .post-card__title { color: #fafaf9; }
.post-card__excerpt {
  font-size: 0.9375rem; color: #57534e;
  line-height: 1.55; margin: 0 0 0.625rem;
}
.dark .post-card__excerpt { color: #d6d3d1; }
.post-card__tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.post-card__tag {
  font-size: 0.6875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #78716c;
  background: #f5f5f4;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}
.dark .post-card__tag { color: #a8a29e; background: #44403c; }

.loading, .empty { color: #78716c; padding: 3rem 0; text-align: center; }
</style>
