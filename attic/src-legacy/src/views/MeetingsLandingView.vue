<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEvents } from '../composables/useEvents'
import { useResolutions } from '../composables/useResolutions'
import type { PlenaryEvent } from '../types/event'
import { formatDate } from '../utils/format'
import PageHero from '../components/PageHero.vue'

const { events, isLoaded, loadData } = useEvents()
const { resolutions } = useResolutions()

onMounted(async () => { await loadData() })

const upcoming = computed(() => events.value.filter(e => e.status === 'upcoming'))
const past = computed(() => events.value
  .filter(e => e.status !== 'upcoming')
  .sort((a, b) => b.year - a.year))

const stats = computed(() => ({
  total: events.value.length,
  upcoming: upcoming.value.length,
  past: past.value.length,
  latest: past.value[0]?.year ?? '—',
}))

function dateRange(ev: PlenaryEvent): string {
  const from = ev.time?.from?.date
  const to = ev.time?.to?.date
  if (!from && !to) return String(ev.year)
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`
  return formatDate(from || to || '')
}

function resolutionCount(ev: PlenaryEvent): number {
  if (!ev.id) return 0
  return resolutions.value.filter(r => r.source_type === 'plenary' && r.meeting_urn?.includes(ev.id)).length
}
</script>

<template>
  <div>
    <PageHero
      variant="index"
      bleed
      eyebrow="Plenary meetings"
      title="Plenary Meetings"
      lead="The committee meets annually in plenary session, hosted by a national body. Each plenary week is the focal point for resolving technical decisions, adopting resolutions, and shaping the committee's work programme."
    >
      <dl class="page__stats" v-if="isLoaded && stats.total">
        <div><dt>{{ stats.total }}</dt><dd>plenaries</dd></div>
        <div><dt>{{ stats.upcoming }}</dt><dd>upcoming</dd></div>
        <div><dt>{{ stats.latest }}</dt><dd>most recent</dd></div>
      </dl>
    </PageHero>

    <div class="page page--wide meetings-landing">
      <div class="meetings-shell">
        <section v-if="upcoming.length" class="upcoming-section">
          <h2 class="section-title">Upcoming</h2>
          <div class="upcoming-list">
            <article v-for="ev in upcoming" :key="ev.id" class="upcoming-card">
              <RouterLink :to="ev.url" class="upcoming-card__main">
                <span class="upcoming-card__ordinal">{{ ev.ordinal }}<sup>th</sup></span>
                <div class="upcoming-card__body">
                  <h3 class="upcoming-card__title">ISO/TC 154 Plenary · {{ ev.year }}</h3>
                  <p class="upcoming-card__meta">
                    <span class="upcoming-card__date">{{ dateRange(ev) }}</span>
                    <span v-if="ev.general_area" class="upcoming-card__area">{{ ev.general_area }}</span>
                  </p>
                  <p v-if="ev.host" class="upcoming-card__host">Hosted by {{ ev.host }}</p>
                </div>
              </RouterLink>
            </article>
          </div>
        </section>

        <section v-if="past.length" class="past-section">
          <h2 class="section-title">Past plenaries</h2>
          <ul class="past-list">
            <li v-for="ev in past" :key="ev.id" class="past-row">
              <RouterLink :to="ev.url" class="past-row__link">
                <span class="past-row__year">{{ ev.year }}</span>
                <span class="past-row__ordinal">{{ ev.ordinal }}<sup>th</sup> plenary</span>
                <span v-if="ev.general_area" class="past-row__area">{{ ev.general_area }}</span>
                <span v-if="ev.host" class="past-row__host">{{ ev.host }}</span>
                <span v-if="resolutionCount(ev) > 0" class="past-row__res">
                  {{ resolutionCount(ev) }} resolutions
                </span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <div v-if="isLoaded && !events.length" class="empty">
          <p>No plenary meeting data available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meetings-shell { max-width: 48rem; }

.section-title {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: #78716c;
  margin: 0 0 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .section-title { color: #a8a29e; border-bottom-color: #292524; }

.upcoming-section { margin-bottom: 3.5rem; }
.upcoming-list { display: flex; flex-direction: column; gap: 1rem; }
.upcoming-card {
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #fff, #fafaf9);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.dark .upcoming-card {
  background: linear-gradient(135deg, #292524, #1c1917);
  border-color: #44403c;
}
.upcoming-card:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(0, 97, 173, 0.18);
}
.upcoming-card__main {
  display: flex; gap: 1.5rem; padding: 1.5rem;
  text-decoration: none; color: inherit;
}
.upcoming-card__ordinal {
  font-family: var(--font-serif);
  font-size: 3rem; font-weight: 700;
  color: var(--color-brand);
  line-height: 1; flex-shrink: 0;
}
.upcoming-card__body { flex: 1; min-width: 0; }
.upcoming-card__title {
  font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;
  color: #1c1917;
}
.dark .upcoming-card__title { color: #fafaf9; }
.upcoming-card__meta {
  display: flex; gap: 1rem; flex-wrap: wrap;
  margin: 0 0 0.375rem;
  font-size: 0.9375rem; color: #57534e;
}
.dark .upcoming-card__meta { color: #d6d3d1; }
.upcoming-card__date { font-weight: 600; }
.upcoming-card__host {
  font-size: 0.875rem; color: #78716c; margin: 0;
}
.dark .upcoming-card__host { color: #a8a29e; }

.past-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column;
}
.past-row { border-bottom: 1px solid #e7e5e4; }
.dark .past-row { border-bottom-color: #292524; }
.past-row__link {
  display: grid;
  grid-template-columns: 4rem 1fr auto;
  gap: 0.75rem 1.5rem;
  align-items: baseline;
  padding: 0.875rem 0.25rem;
  text-decoration: none; color: inherit;
  transition: background 0.15s;
  border-radius: 0.375rem;
}
.past-row__link:hover { background: #fafaf9; padding-left: 0.75rem; padding-right: 0.75rem; }
.dark .past-row__link:hover { background: #292524; }
.past-row__year {
  font-family: var(--font-serif);
  font-size: 1.25rem; font-weight: 700;
  color: var(--color-brand);
}
.past-row__ordinal { font-size: 0.9375rem; font-weight: 600; color: #1c1917; }
.dark .past-row__ordinal { color: #fafaf9; }
.past-row__area { font-size: 0.875rem; color: #78716c; }
.dark .past-row__area { color: #a8a29e; }
.past-row__host {
  font-size: 0.75rem; color: #a8a29e;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.past-row__res {
  font-size: 0.75rem; font-weight: 600;
  color: var(--color-blue-accent);
  background: rgba(0, 97, 173, 0.08);
  padding: 0.25rem 0.625rem; border-radius: 9999px;
  white-space: nowrap;
}
.dark .past-row__res { background: rgba(102, 163, 224, 0.12); }

@media (max-width: 640px) {
  .past-row__link { grid-template-columns: 3rem 1fr; }
  .past-row__area, .past-row__host, .past-row__res { grid-column: 2; }
  .upcoming-card__main { flex-direction: column; gap: 0.5rem; }
  .upcoming-card__ordinal { font-size: 2.25rem; }
}

.empty { text-align: center; padding: 3rem 0; color: #78716c; }
</style>
