<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { committee } from '../data/committee'
import { useMeta } from '../composables/useMeta'
import { useCountUp } from '../composables/useCountUp'
import PageHero from '../components/PageHero.vue'

const router = useRouter()
const { meta, load: loadMeta } = useMeta()

const statsSectionRef = useTemplateRef<HTMLElement>('statsSection')
const statsVisible = ref(false)
const statsReady = computed(() => statsVisible.value && meta.value !== null)

const publishedStandardsCount = useCountUp(
  computed(() => meta.value?.counts.publishedStandards ?? 0),
  statsReady,
)
const totalMembersCount = useCountUp(
  computed(() => meta.value?.counts.totalMembers ?? 0),
  statsReady,
)
const establishedYear = ref(committee.established)
const activeGroupsCount = useCountUp(
  computed(() => meta.value?.counts.activeGroups ?? 0),
  statsReady,
)

const headlineStandards = [
  { num: 'ISO 8601', what: 'Date & time', used: 'Every timestamp on the internet', to: '/standards/iso-8601-1-2019/' },
  { num: 'ISO 9735', what: 'EDIFACT', used: 'Every electronic data interchange message', to: '/standards/iso-9735-1988/' },
  { num: 'ISO 7372', what: 'Trade Data Elements', used: 'Every data field in a customs declaration', to: '/standards/iso-7372-2005/' },
  { num: 'ISO 14533', what: 'Long-term signatures', used: 'Every verifiable electronic signature', to: '/standards/iso-14533-1-2022/' },
]

const stats = computed(() => [
  { value: establishedYear, label: 'Founded', caption: 'Five decades of continuous technical work.', to: '/history/' },
  { value: publishedStandardsCount, label: 'Published standards', caption: 'Deployed across global trade infrastructure.', to: '/standards/' },
  { value: activeGroupsCount, label: 'Active groups', caption: 'Working groups driving today\'s programmes.', to: '/groups/' },
  { value: totalMembersCount, label: 'Member bodies', caption: 'National bodies shaping every standard.', to: '/national-bodies/' },
])

const sections = [
  {
    n: '01',
    label: 'Standards',
    to: '/standards/',
    blurb: 'ISO 8601, EDIFACT, ISO 7372 — the rules behind global trade.',
    accent: 'time',
  },
  {
    n: '02',
    label: 'Resolutions',
    to: '/resolutions/',
    blurb: 'Every committee decision, searchable by number, topic, or meeting.',
    accent: 'resolve',
  },
  {
    n: '03',
    label: 'Members',
    to: '/members/',
    blurb: 'Experts from 45 national bodies and liaison organisations.',
    accent: 'people',
  },
  {
    n: '04',
    label: 'Meetings',
    to: '/meetings/',
    blurb: 'Plenary meetings since 1972 — hosts, agendas, and resolutions.',
    accent: 'meet',
  },
  {
    n: '05',
    label: 'History',
    to: '/history/',
    blurb: 'Five decades of milestones — chairs, structural changes, publications.',
    accent: 'history',
  },
  {
    n: '06',
    label: 'Procedures',
    to: '/procedures/',
    blurb: 'How the committee works — standing documents and consensus rules.',
    accent: 'process',
  },
]

// Current rail: next plenary, latest publication, open-for-comment documents.
const nextPlenary = computed(() => meta.value?.current.nextPlenary ?? null)
const latestPublication = computed(() => meta.value?.current.latestPublication ?? null)
const openForComment = computed(() => meta.value?.current.openForComment ?? [])

function plenaryDates(np: NonNullable<typeof nextPlenary.value>): string {
  if (!np.from_date) return ''
  const from = new Date(np.from_date)
  if (!np.to_date) return from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const to = new Date(np.to_date)
  if (from.getMonth() === to.getMonth()) {
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${to.getDate()}, ${to.getFullYear()}`
  }
  return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${to.getFullYear()}`
}

function publicationDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Hero search — three scopes, navigates to the corresponding list page.
type SearchScope = 'standards' | 'resolutions' | 'members'
const searchScope = ref<SearchScope>('standards')
const searchTerm = ref('')
const scopeTargets: Record<SearchScope, string> = {
  standards: '/standards/',
  resolutions: '/resolutions/',
  members: '/members/',
}

function submitSearch() {
  const q = searchTerm.value.trim()
  const path = scopeTargets[searchScope.value]
  router.push(q ? `${path}?q=${encodeURIComponent(q)}` : path)
}

onMounted(() => {
  loadMeta()
  const el = statsSectionRef.value
  if (!el) return
  if (typeof IntersectionObserver === 'undefined') {
    statsVisible.value = true
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          statsVisible.value = true
          observer.disconnect()
        }
      }
    },
    { threshold: 0.25 },
  )
  observer.observe(el)
})
</script>

<template>
  <div class="home-page">
    <PageHero
      variant="landing"
      bleed
      :eyebrow="`${committee.name} · since ${committee.established}`"
      lead="Every timestamp in your logs. Every message in a customs declaration. Every signed contract that has to hold up in court twenty years from now. TC 154 publishes the standards these systems share — so they understand each other."
    >
      <template #decoration>
        <div class="hero__grid" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="hero__glow" aria-hidden="true"></div>
      </template>
      <template #title>
        <span class="hero__title-line">We <em class="hero__title-verb">give</em></span>
        <span class="hero__title-cycle" aria-roledescription="rotating tagline">
          <span class="hero__title-accent">global commerce</span>
          <span class="hero__title-accent">every interchange</span>
          <span class="hero__title-accent">interoperable systems</span>
          <span class="hero__title-accent">every digital transaction</span>
          <span class="hero__title-accent">every cross-border handshake</span>
        </span>
        <span class="hero__title-line">a common language.</span>
      </template>

      <form class="hero-search" @submit.prevent="submitSearch">
        <div class="hero-search__scopes" role="tablist" aria-label="Search scope">
          <button
            v-for="scope in (['standards', 'resolutions', 'members'] as const)"
            :key="scope"
            type="button"
            role="tab"
            :aria-selected="searchScope === scope"
            :class="['hero-search__scope', { 'hero-search__scope--active': searchScope === scope }]"
            @click="searchScope = scope"
          >{{ scope[0].toUpperCase() + scope.slice(1) }}</button>
        </div>
        <div class="hero-search__row">
          <svg class="hero-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchTerm"
            type="search"
            class="hero-search__input"
            :placeholder="`Search ${searchScope}…`"
            aria-label="Search the catalogue"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" class="hero-search__submit">
            Search
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      <ul class="hero__standards">
        <li v-for="s in headlineStandards" :key="s.num">
          <RouterLink :to="s.to" class="hero__standard">
            <span class="hero__standard-num">{{ s.num }}</span>
            <span class="hero__standard-body">
              <span class="hero__standard-what">{{ s.what }}</span>
              <span class="hero__standard-used">{{ s.used }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>

      <template #actions>
        <RouterLink to="/standards/" class="hero__cta hero__cta--primary">
          Browse the catalogue
          <span aria-hidden="true">→</span>
        </RouterLink>
        <RouterLink to="/about/" class="hero__cta hero__cta--secondary">
          About the committee
        </RouterLink>
      </template>
    </PageHero>

    <div class="page page--wide">
      <section id="stats" ref="statsSection" class="stats">
        <div class="stats__inner">
          <RouterLink
            v-for="stat in stats"
            :key="stat.label"
            :to="stat.to"
            class="stats__cell"
          >
            <span class="stats__value">{{ stat.value.value }}</span>
            <span class="stats__label">{{ stat.label }}</span>
            <span class="stats__caption">{{ stat.caption }}</span>
          </RouterLink>
        </div>
      </section>

      <section v-if="nextPlenary || latestPublication || openForComment.length" class="current">
        <header class="current__head">
          <p class="current__eyebrow">— Current</p>
          <h2 class="current__title">What's happening now.</h2>
        </header>
        <div class="current__grid">
          <RouterLink
            v-if="nextPlenary"
            :to="nextPlenary.url"
            class="current-card current-card--plenary"
          >
            <span class="current-card__tag">Next plenary · #{{ nextPlenary.ordinal }}</span>
            <h3 class="current-card__heading">{{ nextPlenary.general_area }}</h3>
            <p class="current-card__meta">{{ plenaryDates(nextPlenary) }}</p>
            <a
              v-if="nextPlenary.registration_url"
              :href="nextPlenary.registration_url"
              target="_blank"
              rel="noopener noreferrer"
              class="current-card__cta"
              @click.stop
            >
              Register <span aria-hidden="true">↗</span>
            </a>
          </RouterLink>

          <RouterLink
            v-if="latestPublication"
            :to="latestPublication.url"
            class="current-card current-card--pub"
          >
            <span class="current-card__tag">Latest publication</span>
            <h3 class="current-card__heading">{{ latestPublication.name }}</h3>
            <p class="current-card__title-line">{{ latestPublication.title }}</p>
            <p class="current-card__meta">{{ publicationDate(latestPublication.publication_date) }}</p>
          </RouterLink>

          <div v-if="openForComment.length" class="current-card current-card--comment">
            <span class="current-card__tag">Open for comment</span>
            <p class="current-card__intro">Draft documents in DIS / DTR / DTS balloting — national bodies can submit comments.</p>
            <ul class="current-card__list">
              <li v-for="doc in openForComment" :key="doc.id">
                <RouterLink :to="doc.url" class="current-card__item">
                  <span class="current-card__item-name">{{ doc.name }}</span>
                  <span class="current-card__item-stage">stage {{ doc.stage }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="sections">
        <div class="sections__inner">
          <header class="sections__head">
            <p class="sections__eyebrow">— Explore</p>
            <h2 class="sections__title">
              Six ways into the work of
              <span class="sections__title-accent">TC&nbsp;154</span>.
            </h2>
          </header>

          <ul class="sections__list">
            <li v-for="card in sections" :key="card.to">
              <RouterLink :to="card.to" class="section-card" :data-accent="card.accent">
                <span class="section-card__n">{{ card.n }}</span>
                <div class="section-card__body">
                  <h3 class="section-card__heading">{{ card.label }}</h3>
                  <p class="section-card__blurb">{{ card.blurb }}</p>
                </div>
                <span class="section-card__arrow" aria-hidden="true">→</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* HERO decoration — grid + radial glow layered behind PageHero */
.hero__grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(2, 1fr);
  pointer-events: none;
}
.hero__grid span {
  border-right: 1px solid rgb(120 113 108 / 0.06);
}
.dark .hero__grid span {
  border-right-color: rgb(255 255 255 / 0.025);
}
.hero__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at top right, rgb(185 28 28 / 0.05), transparent 60%),
    radial-gradient(ellipse at bottom left, rgb(30 58 138 / 0.04), transparent 50%);
}
.dark .hero__glow {
  background:
    radial-gradient(ellipse at top right, rgb(248 113 113 / 0.07), transparent 60%),
    radial-gradient(ellipse at bottom left, rgb(148 182 232 / 0.04), transparent 50%);
}

/* Rotating verb animation — preserves homepage identity inside the title slot */
.hero__title-line {
  display: block;
}
.hero__title-verb {
  font-style: italic;
  font-weight: 700;
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
}

.hero__title-cycle {
  display: block;
  position: relative;
  overflow: hidden;
  margin-top: 0.35em;
  padding-bottom: 0.25em;
}
.hero__title-cycle::before {
  content: "every cross-border handshake";
  visibility: hidden;
  white-space: nowrap;
  display: block;
  font-style: italic;
  font-weight: 400;
}
.hero__title-accent {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  font-style: italic;
  font-weight: 400;
  color: var(--color-brand);
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
  animation-name: hero-cycle;
  animation-duration: 10s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-iteration-count: infinite;
}
.hero__title-accent:nth-child(1) { animation-delay: 0s; }
.hero__title-accent:nth-child(2) { animation-delay: 2s; }
.hero__title-accent:nth-child(3) { animation-delay: 4s; }
.hero__title-accent:nth-child(4) { animation-delay: 6s; }
.hero__title-accent:nth-child(5) { animation-delay: 8s; }

@keyframes hero-cycle {
  0%   { opacity: 0; transform: translate3d(0, 100%, 0); }
  5%   { opacity: 1; transform: translate3d(0, 0, 0); }
  20%  { opacity: 1; transform: translate3d(0, 0, 0); }
  25%  { opacity: 0; transform: translate3d(0, -100%, 0); }
  100% { opacity: 0; transform: translate3d(0, -100%, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .hero__title-cycle { overflow: visible; }
  .hero__title-accent {
    position: static;
    animation: none;
    opacity: 1;
  }
  .hero__title-accent:not(:first-child) { display: none; }
  .hero__title-cycle::before { content: none; }
}

/* HERO search — scoped input slotted below the title */
.hero-search {
  margin: 2rem 0 2.5rem;
  max-width: 36rem;
}
.hero-search__scopes {
  display: inline-flex;
  gap: 0.125rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
  padding-bottom: 0.25rem;
}
.dark .hero-search__scopes { border-bottom-color: #44403c; }
.hero-search__scope {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #78716c;
  cursor: pointer;
  transition: color 0.15s;
}
.dark .hero-search__scope { color: #a8a29e; }
.hero-search__scope:hover { color: #1c1917; }
.dark .hero-search__scope:hover { color: #fafaf9; }
.hero-search__scope--active {
  color: var(--color-brand);
  position: relative;
}
.hero-search__scope--active::after {
  content: '';
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: -0.3rem;
  height: 2px;
  background: var(--color-brand);
}
.hero-search__row {
  display: flex;
  align-items: stretch;
  gap: 0;
  border: 1px solid #d6d3d1;
  background: #fafaf9;
}
.dark .hero-search__row {
  border-color: #44403c;
  background: rgb(15 23 42 / 0.6);
}
.hero-search__row:focus-within {
  border-color: var(--color-blue-accent);
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}
.dark .hero-search__row:focus-within {
  border-color: #5379bf;
  box-shadow: 0 0 0 3px rgb(83 121 191 / 0.2);
}
.hero-search__icon {
  align-self: center;
  margin-left: 0.875rem;
  color: #78716c;
  pointer-events: none;
  flex-shrink: 0;
}
.dark .hero-search__icon { color: #a8a29e; }
.hero-search__input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.75rem 0.875rem;
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  color: #1c1917;
  outline: none;
}
.hero-search__input::placeholder {
  color: #78716c;
  font-style: italic;
}
.dark .hero-search__input { color: #fafaf9; }
.dark .hero-search__input::placeholder { color: #a8a29e; }
.hero-search__submit {
  appearance: none;
  border: none;
  background: var(--color-brand-fill);
  color: #fff;
  padding: 0 1.25rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s;
}
.hero-search__submit:hover { background: var(--color-brand-hover); }
.hero-search__submit span { transition: transform 0.15s; }
.hero-search__submit:hover span { transform: translateX(3px); }

/* HERO standards grid — now clickable RouterLinks */
.hero__standards {
  margin: 0 0 3rem;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(1fr);
  gap: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .hero__standards { border-top-color: #44403c; }
@media (min-width: 640px) { .hero__standards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .hero__standards { grid-template-columns: repeat(4, 1fr); } }

.hero__standard {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 1.25rem 1rem 1.25rem 0;
  border-bottom: 1px solid #e7e5e4;
  align-items: baseline;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
  position: relative;
}
.hero__standard:hover { background: rgb(30 58 138 / 0.03); }
.dark .hero__standard:hover { background: rgb(148 182 232 / 0.05); }
@media (min-width: 640px) {
  .hero__standard {
    border-right: 1px solid #e7e5e4;
    padding: 1.25rem;
  }
  .hero__standards li:nth-child(2n) .hero__standard { border-right: none; }
}
@media (min-width: 1024px) {
  .hero__standards li:nth-child(2n) .hero__standard { border-right: 1px solid #e7e5e4; }
  .hero__standards li:nth-child(4n) .hero__standard { border-right: none; }
}
.dark .hero__standard { border-bottom-color: #44403c; border-right-color: #44403c; }
.hero__standard::after {
  content: '→';
  position: absolute;
  top: 1.25rem;
  right: 1rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: #a8a29e;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
}
.hero__standard:hover::after {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-brand);
}

.hero__standard-num {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--color-brand);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.hero__standard-body {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.hero__standard-what {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1c1917;
  line-height: 1.2;
}
.dark .hero__standard-what { color: #fafaf9; }
.hero__standard-used {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: #78716c;
  line-height: 1.35;
}
.dark .hero__standard-used { color: #a8a29e; }

/* HERO CTAs (slotted into PageHero #actions) */
.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0;
  transition: all 0.2s;
}
.hero__cta--primary {
  background: var(--color-brand-fill);
  color: #fff;
  border: 1px solid var(--color-brand-fill);
}
.hero__cta--primary:hover {
  background: var(--color-brand-hover);
  border-color: var(--color-brand-hover);
  transform: translateY(-1px);
}
.hero__cta--primary span {
  transition: transform 0.2s;
}
.hero__cta--primary:hover span {
  transform: translateX(4px);
}
.hero__cta--secondary {
  background: transparent;
  color: #1c1917;
  border: 1px solid #d6d3d1;
}
.hero__cta--secondary:hover {
  border-color: #1c1917;
  background: #fafaf9;
}
.dark .hero__cta--secondary {
  color: #fafaf9;
  border-color: #44403c;
}
.dark .hero__cta--secondary:hover {
  border-color: #fafaf9;
  background: rgb(255 255 255 / 0.05);
}

/* STATS — full-bleed band, now clickable */
.stats {
  margin: 0 -1.5rem;
  padding: 4rem 1.5rem;
  background: #fafaf9;
  border-bottom: 1px solid #e7e5e4;
}
.dark .stats {
  background: #1a1a1a;
  border-bottom-color: #292524;
}
.stats__inner {
  max-width: 64rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(1fr);
  gap: 0;
}
@media (min-width: 640px) { .stats__inner { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .stats__inner { grid-template-columns: repeat(4, 1fr); } }

.stats__cell {
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.5rem;
  border-bottom: 1px solid #e7e5e4;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
  position: relative;
}
.stats__cell:hover { background: rgb(30 58 138 / 0.03); }
.dark .stats__cell:hover { background: rgb(148 182 232 / 0.05); }
@media (min-width: 640px) {
  .stats__cell { border-right: 1px solid #e7e5e4; }
  .stats__inner > :nth-child(2n) { border-right: none; }
}
@media (min-width: 1024px) {
  .stats__inner > :nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .stats__inner > :nth-child(4n) { border-right: none; }
}
.dark .stats__cell { border-bottom-color: #292524; border-right-color: #292524; }
.stats__cell::after {
  content: '→';
  position: absolute;
  top: 1.5rem;
  right: 1.25rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: #a8a29e;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
}
.stats__cell:hover::after {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-brand);
}

.stats__value {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
  font-variation-settings: 'opsz' 144;
}
.stats__label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #1c1917;
  margin-top: 0.875rem;
}
.dark .stats__label { color: #fafaf9; }
.stats__caption {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.875rem;
  color: #78716c;
  margin-top: 0.5rem;
  line-height: 1.45;
}
.dark .stats__caption { color: #a8a29e; }

/* CURRENT rail — next plenary, latest publication, open-for-comment */
.current {
  padding: 4rem 0 1rem;
  max-width: 80rem;
  margin: 0 auto;
}
.current__head {
  margin-bottom: 2rem;
}
.current__eyebrow {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #78716c;
  margin: 0 0 0.75rem;
}
.dark .current__eyebrow { color: #a8a29e; }
.current__title {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #1c1917;
  margin: 0;
}
.dark .current__title { color: #fafaf9; }

.current__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) { .current__grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .current__grid { grid-template-columns: repeat(3, 1fr); } }

.current-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, transform 0.15s;
}
.dark .current-card {
  border-color: #44403c;
  background: rgb(15 23 42 / 0.5);
}
.current-card:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-2px);
}
.dark .current-card:hover { border-color: #5379bf; }
.current-card__tag {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-brand);
  margin-bottom: 0.75rem;
}
.current-card__heading {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.15;
  color: #1c1917;
  margin: 0 0 0.375rem;
}
.dark .current-card__heading { color: #fafaf9; }
.current-card__title-line {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: #57534e;
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .current-card__title-line { color: #d6d3d1; }
.current-card__meta {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: #78716c;
  margin: 0;
}
.dark .current-card__meta { color: #a8a29e; }
.current-card__cta {
  align-self: flex-start;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-brand-fill);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: background 0.15s, transform 0.15s;
}
.current-card__cta:hover {
  background: var(--color-brand-hover);
  transform: translateY(-1px);
}
.current-card__intro {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.5;
  color: #57534e;
  margin: 0 0 0.75rem;
}
.dark .current-card__intro { color: #d6d3d1; }
.current-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .current-card__list { border-top-color: #44403c; }
.current-card__item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid #e7e5e4;
  text-decoration: none;
  color: inherit;
  transition: color 0.15s;
}
.dark .current-card__item { border-bottom-color: #44403c; }
.current-card__item:hover .current-card__item-name { color: var(--color-brand); }
.current-card__item-name {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1c1917;
  transition: color 0.15s;
}
.dark .current-card__item-name { color: #fafaf9; }
.current-card__item-stage {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: #78716c;
  flex-shrink: 0;
}
.dark .current-card__item-stage { color: #a8a29e; }

/* SECTIONS */
.sections {
  padding: 4rem 0 6rem;
}
.sections__inner {
  max-width: 80rem;
  margin: 0 auto;
}
.sections__head {
  margin-bottom: 3rem;
  max-width: 48rem;
}
.sections__eyebrow {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #78716c;
  margin: 0 0 1rem;
}
.dark .sections__eyebrow { color: #a8a29e; }
.sections__title {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #1c1917;
  margin: 0;
}
.dark .sections__title { color: #fafaf9; }
.sections__title-accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-brand);
}

.sections__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(1fr);
  gap: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .sections__list { border-top-color: #44403c; }
@media (min-width: 768px) { .sections__list { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .sections__list { grid-template-columns: repeat(3, 1fr); } }

.section-card {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  gap: 1.5rem;
  padding: 1.75rem 1.5rem;
  text-decoration: none;
  color: inherit;
  border-right: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
  position: relative;
  transition: background 0.2s;
}
.dark .section-card { border-right-color: #44403c; border-bottom-color: #44403c; }
.section-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--color-brand);
  transition: width 0.2s;
}
.section-card:hover { background: rgb(30 58 138 / 0.03); }
.section-card:hover::before { width: 3px; }
.dark .section-card:hover { background: rgb(148 182 232 / 0.05); }
@media (min-width: 1100px) {
  .sections__list > li:nth-child(3n) .section-card { border-right: none; }
}
@media (min-width: 768px) and (max-width: 1099px) {
  .sections__list > li:nth-child(2n) .section-card { border-right: none; }
}

.section-card__n {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
  padding-top: 0.375rem;
}

.section-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.section-card__heading {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #1c1917;
  margin: 0;
  line-height: 1.1;
}
.dark .section-card__heading { color: #fafaf9; }
.section-card__blurb {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #57534e;
  margin: 0;
}
.dark .section-card__blurb { color: #d6d3d1; }

.section-card__arrow {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  color: #78716c;
  align-self: center;
  transition: transform 0.2s, color 0.2s;
}
.section-card:hover .section-card__arrow {
  color: var(--color-brand);
  transform: translateX(4px);
}
.dark .section-card__arrow { color: #a8a29e; }
</style>
