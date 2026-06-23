<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLiaisons } from '../composables/useLiaisons'
import type { Liaison } from '../types/organization'
import PageHero from '../components/PageHero.vue'
import OrgLogo from '../components/OrgLogo.vue'

const route = useRoute()
const { liaisons, isLoaded, loadData } = useLiaisons()
const liaison = computed<Liaison | null>(() => {
  const id = String(route.params.id ?? '')
  return liaisons.value.find(l => l.id === id) ?? null
})

onMounted(async () => { await loadData() })

function categoryLabel(cat?: string): string {
  if (cat === 'A') return 'Category A — Active cooperation'
  if (cat === 'B') return 'Category B — Kept informed'
  if (cat === 'C') return 'Category C'
  if (cat === 'D') return 'Category D'
  return cat ?? ''
}
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>
  <div class="detail" v-else-if="!liaison">
    <PageHero
      variant="detail"
      bleed
      eyebrow="Not found"
      title="Liaison not found"
    />
    <div class="detail__body">
      <RouterLink to="/liaisons/" class="detail__back">← All liaisons</RouterLink>
    </div>
  </div>
  <article class="detail" v-else :key="liaison.id">
    <PageHero
      variant="detail"
      bleed
      :eyebrow="`${categoryLabel(liaison.category)}`"
      :title="liaison.short_name ?? liaison.name"
      :lead="liaison.short_name ? liaison.name : ''"
    >
      <template #breadcrumb>
        <RouterLink to="/liaisons/">
          Liaisons
        </RouterLink>
      </template>
    </PageHero>

    <div v-if="liaison.logo || liaison.logo_light || liaison.logo_dark" class="detail__logo-row">
      <OrgLogo
        :logo="liaison.logo"
        :logo_light="liaison.logo_light"
        :logo_dark="liaison.logo_dark"
        asset-prefix="/assets/images/liaisons/"
        size="lg"
        radius="0.625rem"
        :alt="liaison.short_name ?? liaison.name"
        :fallback-text="liaison.short_name ?? liaison.name"
      />
    </div>

    <section v-if="liaison.description" class="detail__section">
      <h2 class="detail__section-title">About</h2>
      <p class="prose">{{ liaison.description }}</p>
    </section>

    <section v-if="liaison.url" class="detail__section">
      <h2 class="detail__section-title">Website</h2>
      <a :href="liaison.url" target="_blank" rel="noopener noreferrer" class="external">
        {{ liaison.url }}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
      </a>
    </section>
  </article>
</template>

<style scoped>
.detail { max-width: 80rem; margin: 0 auto; padding: 0 1.5rem 4rem; }
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__body { padding-top: 1.5rem; }
.detail__back { display: inline-block; font-size: 0.875rem; font-weight: 500; color: var(--color-blue-accent); text-decoration: none; }
.detail__back:hover { text-decoration: underline; }
.detail__logo-row { margin: -1rem 0 2rem; }

.detail__section { margin-bottom: 2rem; }
.detail__section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin: 0 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e7e5e4; }
.dark .detail__section-title { color: #a8a29e; border-bottom-color: #292524; }

.prose { font-size: 0.9375rem; line-height: 1.7; color: #44403c; margin: 0; }
.dark .prose { color: #d6d3d1; }

.external { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: #fafaf9; border-radius: 0.375rem; font-size: 0.875rem; color: var(--color-blue-accent); text-decoration: none; word-break: break-all; }
.external:hover { background: #e0e7ff; }
.dark .external { background: #292524; }
.dark .external:hover { background: #44403c; }
</style>
