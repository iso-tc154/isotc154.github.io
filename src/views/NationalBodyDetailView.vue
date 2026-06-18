<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNationalBodies } from '../composables/useNationalBodies'
import { useTheme } from '../composables/useTheme'
import { membershipLabel, type NationalBody } from '../types/organization'

const route = useRoute()
const { nationalBodies, isLoaded, loadData } = useNationalBodies()
const { isDark } = useTheme()
const body = computed<NationalBody | null>(() => {
  const id = String(route.params.id ?? '')
  return nationalBodies.value.find(nb => nb.id === id) ?? null
})

onMounted(async () => { await loadData() })

const logoUrl = computed<string | null>(() => {
  const b = body.value
  if (!b) return null
  const explicit = isDark.value ? (b.logo_dark ?? b.logo_light) : (b.logo_light ?? b.logo_dark)
  const candidate = explicit ?? b.logo
  if (!candidate) return null
  if (candidate.startsWith('http') || candidate.startsWith('/')) return candidate
  return `/assets/images/national-bodies/${candidate}`
})

function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}

function membership(): { short: string; long: string } {
  return membershipLabel(body.value?.membership)
}
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>
  <div class="detail" v-else-if="!body">
    <header class="detail__header">
      <h1>National body not found</h1>
      <RouterLink to="/national-bodies/" class="detail__back">← All national bodies</RouterLink>
    </header>
  </div>
  <article class="detail" v-else :key="body.id">
    <header class="detail__header">
      <RouterLink to="/national-bodies/" class="detail__back">← All national bodies</RouterLink>
      <div class="detail__head">
        <div class="detail__logo" v-if="logoUrl">
          <img :src="logoUrl" :alt="body.short_name ?? body.name" />
        </div>
        <div>
          <p class="detail__eyebrow">
            {{ flagEmoji(body.iso_country_code) }} {{ body.country ?? '' }}
            <span v-if="body.former" class="detail__eyebrow-former"> · Former member<template v-if="body.former_until"> until {{ body.former_until }}</template></span>
            <template v-else> · {{ membership().long }}</template>
          </p>
          <div class="detail__title-row">
            <h1>{{ body.short_name ?? body.name }}</h1>
            <span v-if="body.former" class="detail__former-pill">Former</span>
          </div>
          <p v-if="body.short_name" class="detail__full-name">{{ body.name }}</p>
          <p v-if="body.former_until" class="detail__former-note">
            Withdrew from ISO/TC 154 in {{ body.former_until }}.
          </p>
        </div>
      </div>
    </header>

    <section v-if="body.description" class="detail__section">
      <h2 class="detail__section-title">About</h2>
      <p class="prose">{{ body.description }}</p>
    </section>

    <section v-if="body.url" class="detail__section">
      <h2 class="detail__section-title">Website</h2>
      <a :href="body.url" target="_blank" rel="noopener noreferrer" class="external">
        {{ body.url }}
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

.detail__title-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin: 0 0 0.5rem;
}
.detail__title-row h1 { margin: 0; }
.detail__former-pill {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 0.1875rem;
  background: #fee2e2;
  color: #991b1b;
  position: relative;
  top: -0.1875rem;
}
.dark .detail__former-pill { background: rgb(185 28 28 / 0.22); color: #fca5a5; }
.detail__former-note {
  font-size: 0.875rem;
  color: #78716c;
  font-style: italic;
  margin: 0.5rem 0 0;
}
.dark .detail__former-note { color: #a8a29e; }
.detail__eyebrow-former { color: #b45309; font-weight: 700; }
.dark .detail__eyebrow-former { color: #fbbf24; }

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
