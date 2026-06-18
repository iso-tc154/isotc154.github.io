<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { committee } from '../data/committee'
import { useCountUp } from '../composables/useCountUp'

const statsSectionRef = useTemplateRef<HTMLElement>('statsSection')
const statsReady = ref(false)

const standardsCount = useCountUp(committee.publishedStandards, statsReady)
const participatingCount = useCountUp(committee.participatingMembers, statsReady)
const establishedYear = useCountUp(committee.established, statsReady, 2200)
const yearsActive = useCountUp(new Date().getFullYear() - committee.established, statsReady)

const headlineStandards = [
  { num: 'ISO 8601', what: 'Date & time', used: 'Every timestamp on the internet' },
  { num: 'ISO 9735', what: 'EDIFACT', used: 'Electronic data interchange for global trade' },
  { num: 'ISO 20022', what: 'Financial messaging', used: 'How banks speak to each other' },
  { num: 'ISO 15000', what: 'ebXML', used: 'XML business frameworks for commerce' },
]

const stats = computed(() => [
  { value: establishedYear, label: 'Founded', caption: 'Geneva, 1972 — the UN/EDIFACT era begins.' },
  { value: yearsActive, label: 'Years active', caption: 'Continuous technical work across five decades.' },
  { value: standardsCount, label: 'Published standards', caption: 'Foundational infrastructure for global commerce.' },
  { value: participatingCount, label: 'P-members', caption: 'National bodies with voting rights.' },
])

const sections = [
  {
    n: '01',
    label: 'Standards',
    to: '/standards/',
    blurb: 'ISO 8601, EDIFACT, ISO 20022 — the syntax of international commerce. Browse the catalogue of every published and in-development standard.',
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
  <section class="hero">
    <div class="hero__grid" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>

    <div class="hero__inner">
      <p class="hero__eyebrow">
        <span class="hero__eyebrow-rule"></span>
        {{ committee.name }} · since {{ committee.established }}
      </p>

      <h1 class="hero__title">
        The syntax of
        <span class="hero__title-accent">international commerce</span>.
      </h1>

      <p class="hero__lead">
        TC 154 writes the standards you never think about — the date and time formats in
        every log file, the EDIFACT messages behind every customs declaration, the
        financial messaging schemas behind every cross-border payment. Since 1972.
      </p>

      <dl class="hero__standards">
        <div v-for="s in headlineStandards" :key="s.num" class="hero__standard">
          <dt class="hero__standard-num">{{ s.num }}</dt>
          <dd class="hero__standard-body">
            <span class="hero__standard-what">{{ s.what }}</span>
            <span class="hero__standard-used">{{ s.used }}</span>
          </dd>
        </div>
      </dl>

      <div class="hero__actions">
        <RouterLink to="/standards/" class="hero__cta hero__cta--primary">
          Browse the catalogue
          <span aria-hidden="true">→</span>
        </RouterLink>
        <RouterLink to="/about/" class="hero__cta hero__cta--secondary">
          About the committee
        </RouterLink>
      </div>
    </div>
  </section>

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
</template>

<style scoped>
.hero {
  position: relative;
  padding: 6rem 1.5rem 5rem;
  overflow: hidden;
  border-bottom: 1px solid #e7e5e4;
  background:
    radial-gradient(ellipse at top right, rgb(185 28 28 / 0.05), transparent 60%),
    radial-gradient(ellipse at bottom left, rgb(30 58 138 / 0.04), transparent 50%);
}
.dark .hero {
  border-bottom-color: #292524;
  background:
    radial-gradient(ellipse at top right, rgb(248 113 113 / 0.07), transparent 60%),
    radial-gradient(ellipse at bottom left, rgb(148 182 232 / 0.04), transparent 50%);
}

.hero__grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(2, 1fr);
  pointer-events: none;
  z-index: 0;
}
.hero__grid span {
  border-right: 1px solid rgb(120 113 108 / 0.06);
}
.dark .hero__grid span {
  border-right-color: rgb(255 255 255 / 0.025);
}

.hero__inner {
  position: relative;
  z-index: 1;
  max-width: 64rem;
  margin: 0 auto;
}

.hero__eyebrow {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-iso-red);
  margin: 0 0 2.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.dark .hero__eyebrow { color: #f87171; }
.hero__eyebrow-rule {
  display: inline-block;
  width: 2.5rem;
  height: 1px;
  background: currentColor;
}

.hero__title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  line-height: 0.98;
  letter-spacing: -0.035em;
  color: #1c1917;
  margin: 0 0 2rem;
  font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 1;
}
.dark .hero__title { color: #fafaf9; }
.hero__title-accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-iso-red);
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
}
.dark .hero__title-accent { color: #f87171; }

.hero__lead {
  font-family: var(--font-sans);
  font-size: clamp(1.0625rem, 1.5vw, 1.25rem);
  line-height: 1.6;
  color: #44403c;
  max-width: 42rem;
  margin: 0 0 3rem;
}
.dark .hero__lead { color: #d6d3d1; }

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
  color: var(--color-iso-red);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dark .hero__standard-num { color: #f87171; }
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

.hero__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}
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
  background: var(--color-iso-red);
  color: #fff;
  border: 1px solid var(--color-iso-red);
}
.hero__cta--primary:hover {
  background: #991b1b;
  border-color: #991b1b;
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

/* STATS */
.stats {
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
  color: var(--color-iso-red);
  font-variant-numeric: tabular-nums;
  font-variation-settings: 'opsz' 144;
}
.dark .stats__value { color: #f87171; }
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
  padding: 5rem 1.5rem 6rem;
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
  color: var(--color-iso-red);
}
.dark .sections__title-accent { color: #f87171; }

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
  background: var(--color-iso-red);
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
  color: var(--color-iso-red);
  font-variant-numeric: tabular-nums;
  padding-top: 0.375rem;
}
.dark .section-card__n { color: #f87171; }

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
  color: var(--color-iso-red);
  transform: translateX(4px);
}
.dark .section-card__arrow { color: #a8a29e; }
.dark .section-card:hover .section-card__arrow { color: #f87171; }
</style>
