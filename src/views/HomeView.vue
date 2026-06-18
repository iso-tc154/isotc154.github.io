<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { committee } from '../data/committee'
import { useCountUp } from '../composables/useCountUp'

const statsSectionRef = useTemplateRef<HTMLElement>('statsSection')
const statsReady = ref(false)

const standardsCount = useCountUp(committee.publishedStandards, statsReady)
const participatingCount = useCountUp(committee.participatingMembers, statsReady)
const observingCount = useCountUp(committee.observingMembers, statsReady)
const establishedYear = useCountUp(committee.established, statsReady, 2200)

const stats = computed(() => [
  { label: 'Published standards', value: standardsCount },
  { label: 'Participating (P) members', value: participatingCount },
  { label: 'Observing (O) members', value: observingCount },
  { label: 'Established', value: establishedYear },
])

const cards = [
  {
    label: 'Standards',
    to: '/standards/',
    blurb: 'ISO standards for commerce, industry and administration — including ISO 8601, ISO 9735 (EDIFACT), and ISO 20022 message schemas.',
  },
  {
    label: 'Members',
    to: '/members/',
    blurb: 'Experts from national bodies, working group convenors, and the Committee Advisory Group (CAG) who drive TC 154 work.',
  },
  {
    label: 'Meetings',
    to: '/meetings/',
    blurb: 'Plenary meetings, working group sessions, and upcoming events with agendas and venue details.',
  },
  {
    label: 'Resolutions',
    to: '/resolutions/',
    blurb: 'Search every TC 154 resolution by number, action type, topic, or meeting — with full audit trail and URN permalinks.',
  },
  {
    label: 'News',
    to: '/posts/',
    blurb: 'Announcements, new publications, and member updates from the Committee.',
  },
  {
    label: 'Procedures',
    to: '/procedures/',
    blurb: 'Standing documents, committee rules, and how TC 154 conducts its work.',
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
    <div class="hero__bg" aria-hidden="true">
      <div class="hero__bg-image"></div>
      <div class="hero__bg-overlay"></div>
      <div class="hero__orb hero__orb--1"></div>
      <div class="hero__orb hero__orb--2"></div>
      <div class="hero__orb hero__orb--3"></div>
    </div>
    <div class="hero__inner">
      <p class="hero__badge">
        <span class="hero__badge-dot"></span>
        {{ committee.name }}
      </p>
      <h1 class="hero__title">
        Processes, data elements<br />
        and documents in
        <span class="hero__title-accent">commerce, industry<br />and administration</span>
      </h1>
      <p class="hero__lead">{{ committee.scope }}</p>
      <div class="hero__actions">
        <RouterLink to="/standards/" class="hero__cta hero__cta--primary">Browse Standards</RouterLink>
        <RouterLink to="/resolutions/" class="hero__cta hero__cta--secondary">Search Resolutions</RouterLink>
      </div>
    </div>
    <a href="#stats" class="hero__scroll" aria-label="Scroll to content">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </a>
  </section>

  <section id="stats" ref="statsSection" class="stats">
    <div class="stats__inner">
      <div v-for="stat in stats" :key="stat.label" class="stats__cell">
        <span class="stats__value">{{ stat.value.value }}</span>
        <span class="stats__label">{{ stat.label }}</span>
      </div>
    </div>
  </section>

  <section class="cards">
    <div class="cards__inner">
      <RouterLink v-for="card in cards" :key="card.to" :to="card.to" class="cards__item">
        <h3 class="cards__heading">{{ card.label }}</h3>
        <p class="cards__blurb">{{ card.blurb }}</p>
        <span class="cards__arrow">→</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: min(85vh, 48rem);
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 4rem 1.5rem 5rem;
}
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.hero__bg-image {
  position: absolute;
  inset: 0;
  background-image: url('/assets/img/welcome_illo.jpg');
  background-size: cover;
  background-position: center;
}
.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgb(30 58 138 / 0.92) 0%,
    rgb(0 31 57 / 0.88) 50%,
    rgb(0 46 86 / 0.92) 100%);
}
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  mix-blend-mode: multiply;
  animation: hero-orb-pulse 4s ease-in-out infinite;
}
.hero__orb--1 { top: 0; left: -1rem; width: 18rem; height: 18rem; background: #5379bf; }
.hero__orb--2 { top: 0; right: -1rem; width: 18rem; height: 18rem; background: #1e3a8a; animation-delay: 2s; }
.hero__orb--3 { bottom: -2rem; left: 5rem; width: 18rem; height: 18rem; background: #94b6e8; animation-delay: 4s; }
@keyframes hero-orb-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.hero__inner {
  position: relative;
  z-index: 10;
  max-width: 48rem;
  margin: 0 auto;
  text-align: center;
}
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgb(255 255 255 / 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #99c2eb;
  margin: 0 0 2rem;
}
.hero__badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--color-iso-red);
  border-radius: 50%;
  animation: hero-orb-pulse 2s ease-in-out infinite;
}
.hero__title {
  font-family: var(--font-serif);
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0 0 1.5rem;
}
.hero__title-accent {
  background: linear-gradient(90deg, #99c2eb, #5379bf, #cce0f5);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero__lead {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  color: #cce0f5;
  max-width: 42rem;
  margin: 0 auto 2rem;
}
.hero__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.hero__cta--primary {
  background: #1e3a8a;
  color: #fff;
  box-shadow: 0 10px 15px -3px rgb(30 58 138 / 0.25);
}
.hero__cta--primary:hover {
  background: #172554;
  transform: translateY(-2px);
  box-shadow: 0 15px 25px -3px rgb(30 58 138 / 0.4);
}
.hero__cta--secondary {
  background: rgb(255 255 255 / 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgb(255 255 255 / 0.2);
  color: #fff;
}
.hero__cta--secondary:hover {
  background: rgb(255 255 255 / 0.2);
}
.hero__scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgb(255 255 255 / 0.5);
  z-index: 10;
  animation: hero-bounce 2s infinite;
}
.hero__scroll svg { width: 1.5rem; height: 1.5rem; }
@keyframes hero-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.stats {
  padding: 2rem 1.5rem;
  border-top: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
  background: #fff;
}
.dark .stats {
  border-top-color: #292524;
  border-bottom-color: #292524;
  background: rgb(2 6 23 / 0.5);
}
.stats__inner {
  max-width: 64rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}
@media (min-width: 768px) {
  .stats__inner { grid-template-columns: repeat(4, 1fr); }
}
.stats__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.stats__value {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  color: var(--color-blue-accent);
  line-height: 1;
}
.dark .stats__value { color: #94b6e8; }
.stats__label {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #78716c;
}
.dark .stats__label { color: #a8a29e; }

.cards { padding: 3rem 1.5rem 4rem; }
.cards__inner {
  max-width: 80rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}
@media (min-width: 640px) {
  .cards__inner { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .cards__inner { grid-template-columns: repeat(3, 1fr); }
}
.cards__item {
  display: block;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
}
.dark .cards__item {
  background: rgb(15 23 42 / 0.5);
  border-color: #44403c;
}
.cards__item:hover {
  border-color: #99c2eb;
  box-shadow: 0 4px 12px rgb(30 58 138 / 0.06);
  transform: translateY(-2px);
}
.dark .cards__item:hover {
  border-color: rgb(51 133 214 / 0.3);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
}
.cards__heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1c1917;
  margin: 0 0 0.5rem;
}
.dark .cards__heading { color: #fff; }
.cards__blurb {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #57534e;
  margin: 0;
}
.dark .cards__blurb { color: #d6d3d1; }
.cards__arrow {
  display: inline-block;
  margin-top: 0.875rem;
  font-size: 1.125rem;
  color: var(--color-blue-accent);
  transition: transform 0.2s;
}
.dark .cards__arrow { color: #94b6e8; }
.cards__item:hover .cards__arrow { transform: translateX(4px); }
</style>
