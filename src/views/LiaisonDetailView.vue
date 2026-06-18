<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLiaisons } from '../composables/useLiaisons'
import { useTheme } from '../composables/useTheme'
import type { Liaison } from '../types/organization'

const route = useRoute()
const { liaisons, isLoaded, loadData } = useLiaisons()
const { isDark } = useTheme()
const liaison = computed<Liaison | null>(() => {
  const id = String(route.params.id ?? '')
  return liaisons.value.find(l => l.id === id) ?? null
})

onMounted(async () => { await loadData() })

const logoUrl = computed<string | null>(() => {
  const l = liaison.value
  if (!l) return null
  const explicit = isDark.value ? (l.logo_dark ?? l.logo_light) : (l.logo_light ?? l.logo_dark)
  const candidate = explicit ?? l.logo
  if (!candidate) return null
  if (candidate.startsWith('http') || candidate.startsWith('/')) return candidate
  return `/assets/images/liaisons/${candidate}`
})

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
    <header class="detail__header">
      <h1>Liaison not found</h1>
      <RouterLink to="/liaisons/" class="detail__back">← All liaisons</RouterLink>
    </header>
  </div>
  <article class="detail" v-else :key="liaison.id">
    <header class="detail__header">
      <RouterLink to="/liaisons/" class="detail__back">← All liaisons</RouterLink>
      <div class="detail__head">
        <div class="detail__logo" v-if="logoUrl">
          <img :src="logoUrl" :alt="liaison.short_name ?? liaison.name" />
        </div>
        <div>
          <p class="detail__eyebrow">{{ categoryLabel(liaison.category) }}</p>
          <h1>{{ liaison.short_name ?? liaison.name }}</h1>
          <p v-if="liaison.short_name" class="detail__full-name">{{ liaison.name }}</p>
        </div>
      </div>
    </header>

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
.detail { max-width: 56rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__header { margin-bottom: 2rem; }
.detail__back { display: inline-block; font-size: 0.875rem; font-weight: 500; color: var(--color-blue-accent); text-decoration: none; margin-bottom: 1rem; }
.detail__back:hover { text-decoration: underline; }
.dark .detail__back { color: #94b6e8; }
.detail__head { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
.detail__logo { width: 6rem; height: 6rem; border-radius: 0.625rem; background: #fafaf9; display: flex; align-items: center; justify-content: center; padding: 0.75rem; flex-shrink: 0; overflow: hidden; }
.dark .detail__logo { background: #292524; }
.detail__logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.detail__eyebrow { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-blue-accent); margin: 0 0 0.5rem; }
.dark .detail__eyebrow { color: #94b6e8; }
.detail__header h1 { font-family: var(--font-serif); font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 700; color: #1c1917; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
.dark .detail__header h1 { color: #fafaf9; }
.detail__full-name { font-size: 1rem; color: #57534e; margin: 0; }
.dark .detail__full-name { color: #d6d3d1; }

.detail__section { margin-bottom: 2rem; }
.detail__section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin: 0 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e7e5e4; }
.dark .detail__section-title { color: #a8a29e; border-bottom-color: #292524; }

.prose { font-size: 0.9375rem; line-height: 1.7; color: #44403c; margin: 0; }
.dark .prose { color: #d6d3d1; }

.external { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: #fafaf9; border-radius: 0.375rem; font-size: 0.875rem; color: var(--color-blue-accent); text-decoration: none; word-break: break-all; }
.external:hover { background: #e0e7ff; }
.dark .external { background: #292524; color: #94b6e8; }
.dark .external:hover { background: #44403c; }
</style>
