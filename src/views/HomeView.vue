<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { committee } from '../data/committee'
import { useCountUp } from '../composables/useCountUp'
import PageHero from '../components/PageHero.vue'

const statsSectionRef = useTemplateRef<HTMLElement>('statsSection')
const statsReady = ref(false)

const standardsCount = useCountUp(committee.publishedStandards, statsReady)
const totalMembersCount = useCountUp(committee.totalMembers, statsReady)
// Founded year is a fixed historical fact — never animate it as a count-up.
const establishedYear = ref(committee.established)
const activeGroupsCount = useCountUp(committee.activeGroups, statsReady)

const headlineStandards = [
  { num: 'ISO 8601', what: 'Date & time', used: 'Every timestamp on the internet' },
  { num: 'ISO 9735', what: 'EDIFACT', used: 'Every electronic data interchange message' },
  { num: 'ISO 7372', what: 'Trade Data Elements', used: 'Every data field in a customs declaration' },
  { num: 'ISO 14533', what: 'Long-term signatures', used: 'Every verifiable electronic signature' },
]

const stats = computed(() => [
  { value: establishedYear, label: 'Founded', caption: 'Five decades of continuous technical work.' },
  { value: standardsCount, label: 'Published standards', caption: 'Deployed across global trade infrastructure.' },
  { value: activeGroupsCount, label: 'Active groups', caption: 'Working groups driving today’s programmes.' },
  { value: totalMembersCount, label: 'Member bodies', caption: 'National bodies shaping every standard.' },
])

const sections = [
  {
    n: '01',
    label: 'Standards',
    to: '/standards/',
    blurb: 'ISO 8601, EDIFACT, ISO 7372, ISO 14533 — the rules behind global trade. Browse every published and in-development standard.',
    accent: 'time',
  },
  {
    n: '02',
    label: 'Resolutions',
    to: '/resolutions/',
    blurb: 'Every decision the committee has ever made — searchable by number, topic, meeting, or action type. With URN permalinks and a full audit trail.',
    accent: 'resolve',
  },
  {
    n: '03',
    label: 'Members',
    to: '/members/',
    blurb: 'Experts from 47 national bodies and liaison organisations, the working group convenors, and the Committee Advisory Group.',
    accent: 'people',
  },
  {
    n: '04',
    label: 'Meetings',
    to: '/meetings/',
    blurb: 'Plenary meetings since 1972 — host cities, venues, agendas, briefings, and every resolution adopted.',
    accent: 'meet',
  },
  {
    n: '05',
    label: 'History',
    to: '/history/',
    blurb: 'Five decades of milestones — founding, chairs and secretariats, structural changes, published standards, and meetings.',
    accent: 'history',
  },
  {
    n: '06',
    label: 'Procedures',
    to: '/procedures/',
    blurb: 'How the committee conducts its work — standing documents, submission processes, and the rules of consensus.',
    accent: 'process',
  },
]

onMounted(() => {
  const el = statsSectionRef.value
  if (!el) return
  if (typeof IntersectionObserver === 'undefined') {
    statsReady.value = true
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          statsReady.value = true
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
      <dl class="hero__standards">
        <div v-for="s in headlineStandards" :key="s.num" class="hero__standard">
          <dt class="hero__standard-num">{{ s.num }}</dt>
          <dd class="hero__standard-body">
            <span class="hero__standard-what">{{ s.what }}</span>
            <span class="hero__standard-used">{{ s.used }}</span>
          </dd>
        </div>
      </dl>
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
          <div v-for="stat in stats" :key="stat.label" class="stats__cell">
            <span class="stats__value">{{ stat.value.value }}</span>
            <span class="stats__label">{{ stat.label }}</span>
            <span class="stats__caption">{{ stat.caption }}</span>
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

/* HERO standards grid (slotted into PageHero default slot) */
.hero__standards {
  margin: 0 0 3rem;
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
}
@media (min-width: 640px) {
  .hero__standard {
    border-right: 1px solid #e7e5e4;
    padding: 1.25rem;
  }
  .hero__standard:nth-child(2n) { border-right: none; }
}
@media (min-width: 1024px) {
  .hero__standard:nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .hero__standard:nth-child(4n) { border-right: none; }
}
.dark .hero__standard { border-bottom-color: #44403c; border-right-color: #44403c; }

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

/* STATS — full-bleed band inside the page container */
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
}
@media (min-width: 640px) {
  .stats__cell:nth-child(2n) { border-right: none; }
  .stats__cell { border-right: 1px solid #e7e5e4; }
}
@media (min-width: 1024px) {
  .stats__cell:nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .stats__cell:nth-child(4n) { border-right: none; }
}
.dark .stats__cell { border-bottom-color: #292524; border-right-color: #292524; }

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

/* SECTIONS */
.sections {
  padding: 5rem 0 6rem;
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
.section-card:hover { background: rgb(185 28 28 / 0.03); }
.section-card:hover::before { width: 3px; }
.dark .section-card:hover { background: rgb(248 113 113 / 0.05); }
@media (min-width: 1100px) {
  .section-card:nth-child(3n) { border-right: none; }
}
@media (min-width: 768px) and (max-width: 1099px) {
  .section-card:nth-child(2n) { border-right: none; }
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
