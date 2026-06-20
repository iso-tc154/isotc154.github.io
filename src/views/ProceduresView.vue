<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePages } from '../composables/usePages'
import PageHero from '../components/PageHero.vue'

const { pages, isLoaded, loadData } = usePages()

onMounted(async () => { await loadData() })

const procedures = computed(() => pages.value.filter(p => p.slug.startsWith('/procedures/')))
</script>

<template>
  <div class="page">
    <PageHero
      variant="article"
      eyebrow="ISO/TC 154"
      title="Procedures"
      lead="Operating procedures and submission processes used by ISO/TC 154 and its working groups."
    >
      <dl class="page__stats" v-if="procedures.length">
        <div><dt>{{ procedures.length }}</dt><dd>documents</dd></div>
      </dl>
    </PageHero>

    <div v-if="!isLoaded" class="loading">Loading…</div>

    <section v-if="procedures.length" class="procedure-list">
      <article v-for="p in procedures" :key="p.slug" class="procedure-card">
        <RouterLink :to="p.url" class="procedure-card__link">
          <h2 class="procedure-card__title">{{ p.frontmatter.title || p.slug }}</h2>
          <p v-if="p.frontmatter.wg" class="procedure-card__wg">{{ p.frontmatter.wg }}</p>
        </RouterLink>
      </article>
    </section>

    <div v-else-if="isLoaded" class="empty">
      <p>No procedures documented yet.</p>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

.procedure-list { display: flex; flex-direction: column; gap: 0.75rem; }
.procedure-card {
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  background: #fff;
  transition: border-color 0.2s, transform 0.2s;
}
.dark .procedure-card { background: #292524; border-color: #44403c; }
.procedure-card:hover {
  border-color: var(--color-brand);
  transform: translateY(-1px);
}
.procedure-card__link {
  display: block; padding: 1rem 1.25rem;
  text-decoration: none; color: inherit;
}
.procedure-card__title {
  font-size: 1.0625rem; font-weight: 700;
  color: #1c1917;
  margin: 0 0 0.25rem;
}
.dark .procedure-card__title { color: #fafaf9; }
.procedure-card__wg {
  font-size: 0.875rem; color: #78716c;
  margin: 0;
}
.dark .procedure-card__wg { color: #a8a29e; }

.loading, .empty { color: #78716c; padding: 3rem 0; text-align: center; }
</style>
