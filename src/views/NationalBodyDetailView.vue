<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNationalBodies } from '../composables/useNationalBodies'
import { membershipLabel, type NationalBody } from '../types/organization'
import PageHero from '../components/PageHero.vue'
import OrgLogo from '../components/OrgLogo.vue'

const route = useRoute()
const { nationalBodies, isLoaded, loadData } = useNationalBodies()
const body = computed<NationalBody | null>(() => {
  const id = String(route.params.id ?? '')
  return nationalBodies.value.find(nb => nb.id === id) ?? null
})

onMounted(async () => { await loadData() })

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
    <PageHero
      variant="detail"
      bleed
      eyebrow="Not found"
      title="National body not found"
    />
    <div class="detail__body">
      <RouterLink to="/national-bodies/" class="detail__back">← All national bodies</RouterLink>
    </div>
  </div>
  <article class="detail" v-else :key="body.id">
    <PageHero
      variant="detail"
      bleed
      :eyebrow="`${flagEmoji(body.iso_country_code)} ${body.country ?? ''} · ${body.former ? 'Former member' : membership().long}`"
      :title="body.short_name ?? body.name"
      :lead="body.short_name ? body.name : ''"
    >
      <template #breadcrumb>
        <RouterLink to="/national-bodies/">
          National bodies
        </RouterLink>
      </template>
    </PageHero>

    <div v-if="body.logo || body.logo_light || body.logo_dark" class="detail__logo-row">
      <OrgLogo
        :logo="body.logo"
        :logo_light="body.logo_light"
        :logo_dark="body.logo_dark"
        asset-prefix="/assets/images/national-bodies/"
        size="lg"
        radius="0.625rem"
        :alt="body.short_name ?? body.name"
        :fallback-text="body.short_name ?? body.name"
      />
      <div v-if="body.former" class="detail__former">
        <span class="detail__former-pill">Former</span>
        <p v-if="body.former_until" class="detail__former-note">
          Withdrew from ISO/TC 154 in {{ body.former_until }}.
        </p>
      </div>
    </div>

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
.detail { max-width: 80rem; margin: 0 auto; padding: 0 1.5rem 4rem; }
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__body { padding-top: 1.5rem; }
.detail__back { display: inline-block; font-size: 0.875rem; font-weight: 500; color: var(--color-blue-accent); text-decoration: none; }
.detail__back:hover { text-decoration: underline; }
.detail__logo-row { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; margin: -1rem 0 2rem; }

.detail__former { display: flex; flex-direction: column; gap: 0.5rem; }
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
  align-self: flex-start;
}
.dark .detail__former-pill { background: rgb(185 28 28 / 0.22); color: #fca5a5; }
.detail__former-note {
  font-size: 0.875rem;
  color: #78716c;
  font-style: italic;
  margin: 0;
}
.dark .detail__former-note { color: #a8a29e; }

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
