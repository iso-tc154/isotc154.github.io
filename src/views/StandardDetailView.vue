<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStandards } from '../composables/useStandards'
import { useGroups } from '../composables/useGroups'
import { standardStatusLabel } from '../domain/standardPresentation'
import { renderProse } from '../utils/prose'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
const { standards, isLoaded, loadData } = useStandards()
const { loadData: loadGroups, get: getGroup } = useGroups()

const standard = computed(() => {
  const id = String(route.params.id ?? '')
  return standards.value.find(s => s.id === id) ?? null
})

onMounted(async () => {
  await Promise.all([loadData(), loadGroups()])
})

const scopeHtml = computed(() => {
  const text = standard.value?.tc154?.scope || standard.value?.iso?.scope
  return text ? renderProse(text) : ''
})

const introductionHtml = computed(() => {
  const text = standard.value?.tc154?.introduction
  return text ? renderProse(text) : ''
})

const publicationDate = computed(() => {
  const d = standard.value?.iso?.publication_date
  if (!d) return ''
  const year = parseInt(d.substring(0, 4), 10)
  if (year > 2026 || year < 1900) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
})

const publicationYear = computed(() => {
  const d = standard.value?.iso?.publication_date
  if (!d) return ''
  const year = parseInt(d.substring(0, 4), 10)
  if (year > 2026 || year < 1900) return ''
  return String(year)
})

const groupName = computed(() => {
  const g = standard.value?.tc154?.group
  if (!g) return ''
  return getGroup(g)?.title ?? g
})

const groupUrl = computed(() => {
  const g = standard.value?.tc154?.group
  return g ? `/groups/${g}/` : null
})

const isoStoreUrl = computed(() => {
  const sid = standard.value?.iso?.store_id
  return sid ? `https://www.iso.org/standard/${sid}.html` : ''
})

const icsList = computed(() => {
  const ics = standard.value?.iso?.ics
  if (!ics) return []
  return ics.split(',').map(s => s.trim()).filter(Boolean)
})

function statusLabel(): string {
  if (!standard.value) return ''
  return standardStatusLabel(standard.value.tc154?.status ?? 'published')
}
</script>

<template>
  <div class="detail" v-if="!isLoaded">
    <p class="detail__loading">Loading…</p>
  </div>

  <div class="detail" v-else-if="!standard">
    <PageHero
      variant="detail"
      bleed
      eyebrow="Not found"
      title="Standard not found"
      :lead="`No standard matches ${route.params.id}.`"
    />
    <div class="detail__body">
      <RouterLink to="/standards/" class="detail__back">← All standards</RouterLink>
    </div>
  </div>

  <article class="detail" v-else :key="standard.id">
    <PageHero
      variant="detail"
      bleed
      :eyebrow="`${standard.iso?.name}${publicationYear ? ' (' + publicationYear + ')' : ''}`"
      :title="standard.iso?.title"
    >
      <div class="detail__badges">
        <span class="detail__status" :class="`detail__status--${standard.tc154?.status ?? 'published'}`">{{ statusLabel() }}</span>
        <span v-if="standard.iso?.type && standard.iso.type !== 'international'" class="detail__type">{{ standard.iso.type }}</span>
        <span v-if="standard.iso?.stage" class="detail__stage">Stage {{ standard.iso.stage }}</span>
      </div>
      <template #breadcrumb>
        <RouterLink to="/standards/">
          Standards
        </RouterLink>
      </template>
    </PageHero>

    <div class="detail__grid">
      <div class="detail__main">
        <section v-if="introductionHtml" class="detail__section">
          <h2 class="detail__section-title">Introduction</h2>
          <div class="prose" v-html="introductionHtml"></div>
        </section>

        <section v-if="scopeHtml" class="detail__section">
          <h2 class="detail__section-title">Scope</h2>
          <div class="prose" v-html="scopeHtml"></div>
        </section>
      </div>

      <aside class="detail__aside">
        <section class="detail__aside-block">
          <h3 class="detail__aside-title">Metadata</h3>
          <dl class="meta">
            <div class="meta__row" v-if="standard.iso?.type">
              <dt>Type</dt>
              <dd>{{ standard.iso.type === 'international' ? 'International Standard' : standard.iso.type }}</dd>
            </div>
            <div class="meta__row" v-if="standard.iso?.stage">
              <dt>ISO stage</dt>
              <dd><code>{{ standard.iso.stage }}</code></dd>
            </div>
            <div class="meta__row" v-if="publicationDate">
              <dt>Published</dt>
              <dd>{{ publicationDate }}</dd>
            </div>
            <div class="meta__row" v-if="standard.tc154?.group">
              <dt>Responsible group</dt>
              <dd>
                <a v-if="groupUrl" :href="groupUrl!">{{ groupName }}</a>
                <span v-else>{{ groupName }}</span>
              </dd>
            </div>
            <div class="meta__row" v-if="icsList.length">
              <dt>ICS</dt>
              <dd>
                <ul class="meta__list">
                  <li v-for="code in icsList" :key="code"><code>{{ code }}</code></li>
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="isoStoreUrl" class="detail__aside-block">
          <h3 class="detail__aside-title">Get the standard</h3>
          <a :href="isoStoreUrl" target="_blank" rel="noopener noreferrer" class="store-link">
            View on ISO Store
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
          </a>
          <p v-if="standard.iso?.store_id" class="store-id">ISO Store ID: <code>{{ standard.iso.store_id }}</code></p>
        </section>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.detail {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}
.detail__loading { color: #78716c; padding: 4rem 0; text-align: center; }
.detail__body { padding-top: 1.5rem; }
.detail__back {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.detail__back:hover { text-decoration: underline; }
.detail__badges {
  display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center;
  margin-bottom: 0.75rem;
}
.detail__status {
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 0.25rem 0.625rem; border-radius: 0.25rem;
  background: #f5f5f4; color: #57534e;
}
.dark .detail__status { background: #292524; color: #d6d3d1; }
.detail__status--published { background: rgb(16 185 129 / 0.15); color: #047857; }
.dark .detail__status--published { background: rgb(16 185 129 / 0.2); color: #6ee7b7; }
.detail__status--withdrawn { background: #f5f5f4; color: #78716c; }
.dark .detail__status--withdrawn { background: #292524; color: #a8a29e; }
.detail__status--deleted { background: rgb(185 28 28 / 0.1); color: var(--color-iso-red); }
.dark .detail__status--deleted { background: rgb(185 28 28 / 0.2); color: #fca5a5; }
.detail__status--under_development { background: rgb(30 58 138 / 0.1); color: var(--color-blue-accent); }
.dark .detail__status--under_development { background: rgb(51 133 214 / 0.2); color: #93c5fd; }
.detail__type {
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 0.25rem 0.625rem; border-radius: 0.25rem;
  background: #e0e7ff; color: var(--color-blue-accent);
}
.dark .detail__type { background: rgb(51 133 214 / 0.2); }
.detail__stage {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: #78716c;
}
.dark .detail__stage { color: #a8a29e; }

.detail__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  margin-top: 2rem;
}
@media (min-width: 1024px) {
  .detail__grid { grid-template-columns: minmax(0, 1fr) 20rem; }
}

.detail__section { margin-bottom: 2rem; }
.detail__section-title {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #78716c;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .detail__section-title { color: #a8a29e; border-bottom-color: #292524; }

.prose {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #44403c;
}
.dark .prose { color: #d6d3d1; }
.prose :deep(p) { margin: 0 0 0.875rem; }
.prose :deep(p:last-child) { margin-bottom: 0; }
.prose :deep(a) { color: var(--color-blue-accent); text-decoration: underline; }

.detail__aside { display: flex; flex-direction: column; gap: 1rem; }
.detail__aside-block {
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
}
.dark .detail__aside-block { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.detail__aside-title {
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #78716c;
  margin: 0 0 0.875rem;
}
.dark .detail__aside-title { color: #a8a29e; }

.meta { margin: 0; }
.meta__row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 0.5rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid #f5f5f4;
}
.meta__row:last-child { border-bottom: none; }
.dark .meta__row { border-bottom-color: #292524; }
.meta__row dt {
  font-size: 0.75rem;
  color: #78716c;
  font-weight: 500;
}
.dark .meta__row dt { color: #a8a29e; }
.meta__row dd {
  margin: 0;
  font-size: 0.875rem;
  color: #1c1917;
}
.dark .meta__row dd { color: #fafaf9; }
.meta__row dd a {
  color: var(--color-blue-accent);
  text-decoration: none;
}
.meta__row dd a:hover { text-decoration: underline; }
.meta__row code {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  background: #f5f5f4;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.1875rem;
}
.dark .meta__row code { background: #292524; }
.meta__list { list-style: none; margin: 0; padding: 0; }
.meta__list li { margin-bottom: 0.25rem; }

.store-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-blue-accent);
  color: #fff;
  border-radius: 0.375rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.15s;
}
.store-link:hover { background: #172554; }
.dark .store-link { background: #5379bf; }
.dark .store-link:hover { background: #2a6fae; }
.store-id {
  margin: 0.625rem 0 0;
  font-size: 0.75rem;
  color: #78716c;
}
.dark .store-id { color: #a8a29e; }
</style>
