<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEvents } from '../composables/useEvents'
import { useResolutions } from '../composables/useResolutions'
import type { PlenaryEvent, PracticalSection, PracticalValue } from '../types/event'
import { formatDate } from '../utils/format'
import ScheduleCalendar from '../components/ScheduleCalendar.vue'

const route = useRoute()
const { events, isLoaded, loadData } = useEvents()
const { resolutions } = useResolutions()

onMounted(async () => { await loadData() })

const event = computed<PlenaryEvent | null>(() => {
  const id = String(route.params.id ?? '')
  return events.value.find(e => e.id === id) ?? null
})

const title = computed(() => {
  if (!event.value) return ''
  return `${event.value.ordinal}th plenary meeting · ${event.value.year}`
})

const dateRange = computed(() => {
  const ev = event.value
  if (!ev) return ''
  const from = ev.time?.from?.date
  const to = ev.time?.to?.date
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`
  return formatDate(from || to || '')
})

const meetingResolutions = computed(() => {
  const ev = event.value
  if (!ev) return []
  return resolutions.value.filter(r => r.source_type === 'plenary' && r.meeting_urn?.includes(ev.id))
})

const meetingResolutionsPath = computed(() => {
  if (!meetingResolutions.value.length) return null
  const sample = meetingResolutions.value[0]
  return `/resolutions/meetings/${sample.source_type}/${sample.source_file}/`
})

const scheduleByDate = computed(() => {
  const ev = event.value
  if (!ev?.schedule) return []
  const map = new Map<string, typeof ev.schedule>()
  for (const item of ev.schedule) {
    if (!item.date) continue
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date)!.push(item)
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
})

const venueMapUrl = computed(() => {
  const v = event.value?.venues?.[0]
  if (!v || v.lat == null || v.lon == null) return null
  return `https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=16/${v.lat}/${v.lon}`
})

const LABEL_OVERRIDES: Record<string, string> = {
  eu_schengen: 'EU Schengen',
  info_url: 'Information URL',
  invitation_contact: 'Invitation contact',
  invitation_email: 'Invitation email',
  required_info: 'Required information',
  badge_required: 'Badge required',
  badge_info: 'Badge',
  wifi: 'Wi-Fi',
  smoking: 'Smoking',
  electrical: 'Electrical',
  url: 'URL',
  museums_url: 'Museums URL',
  ifa_note: 'IFA note',
  ifa_url: 'IFA URL',
}

function practicalLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key]
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function isSection(v: PracticalValue): v is PracticalSection {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStringList(v: PracticalValue): v is string[] {
  return Array.isArray(v)
}

function practicalEntries(info: PracticalSection | undefined) {
  if (!info) return []
  return Object.entries(info).filter(([, v]) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }) as [string, PracticalValue][]
}

function sectionEntries(section: PracticalSection) {
  return Object.entries(section).filter(([, v]) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    if (typeof v === 'boolean' && v === false) return false
    return true
  }) as [string, PracticalValue][]
}

function isUrl(v: unknown): v is string {
  return typeof v === 'string' && /^https?:\/\//.test(v)
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function touristInfoAsSection(value: PracticalSection | { name?: string; link?: string; notes?: string }[]): PracticalSection {
  if (Array.isArray(value)) {
    const section: PracticalSection = {}
    value.forEach((item, i) => {
      section[item.name ?? `Item ${i + 1}`] = {
        link: item.link,
        notes: item.notes,
      } as PracticalSection
    })
    return section
  }
  return value
}
</script>

<template>
  <div v-if="!isLoaded" class="page"><p class="loading">Loading…</p></div>

  <article v-else-if="!event" class="page">
    <header class="page__header">
      <h1 class="page__title">Meeting not found</h1>
      <p>No plenary matches <code>{{ route.params.id }}</code>.</p>
      <RouterLink to="/meetings/" class="back-link">← All meetings</RouterLink>
    </header>
  </article>

  <article v-else class="event-detail">
    <header class="event-detail__hero">
      <div class="event-detail__hero-inner">
        <RouterLink to="/meetings/" class="back-link">← All meetings</RouterLink>
        <p class="event-detail__eyebrow">
          {{ event.status === 'upcoming' ? 'Upcoming plenary' : 'Past plenary' }}
        </p>
        <h1 class="event-detail__title">{{ title }}</h1>
        <p class="event-detail__area" v-if="event.general_area">{{ event.general_area }}</p>
        <p class="event-detail__host" v-if="event.host">Hosted by {{ event.host }}</p>
        <p class="event-detail__date" v-if="dateRange">{{ dateRange }}</p>
      </div>
    </header>

    <div class="event-detail__body">
      <section v-if="event.venues?.length" class="block">
        <h2 class="block__title">Venue</h2>
        <div v-for="(v, i) in event.venues" :key="i" class="venue-card">
          <div class="venue-card__main">
            <p v-if="v.name" class="venue-card__name">{{ v.name }}</p>
            <pre v-if="v.address" class="venue-card__address">{{ v.address }}</pre>
            <a v-if="v.link" :href="v.link" target="_blank" rel="noopener noreferrer" class="venue-card__link">
              Venue website →
            </a>
            <a v-if="venueMapUrl" :href="venueMapUrl" target="_blank" rel="noopener noreferrer" class="venue-card__link">
              Open in OpenStreetMap →
            </a>
          </div>
        </div>
      </section>

      <section v-if="event.secretariat" class="block">
        <h2 class="block__title">Secretariat</h2>
        <div class="secretary-card">
          <p v-if="event.secretariat.name" class="secretary-card__name">{{ event.secretariat.name }}</p>
          <p v-if="event.secretariat.organization" class="secretary-card__org">{{ event.secretariat.organization }}</p>
          <p v-if="event.secretariat.email" class="secretary-card__contact">
            <a :href="`mailto:${event.secretariat.email}`">{{ event.secretariat.email }}</a>
          </p>
          <p v-if="event.secretariat.phone" class="secretary-card__contact">{{ event.secretariat.phone }}</p>
        </div>
      </section>

      <section v-if="scheduleByDate.length" class="block">
        <h2 class="block__title">Agenda</h2>
        <ScheduleCalendar
          :schedule="event.schedule ?? []"
          :venue-name="event.venues?.[0]?.name"
          :general-area="event.general_area"
        />
      </section>

      <section v-if="event.accommodation_options?.length" class="block">
        <h2 class="block__title">Accommodation</h2>
        <ul class="list-card">
          <li v-for="(a, i) in event.accommodation_options" :key="i" class="list-card__item">
            <a v-if="a.link" :href="a.link" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ a.name }}</a>
            <span v-else class="list-card__name">{{ a.name }}</span>
            <p v-if="a.address" class="list-card__meta">{{ a.address }}</p>
            <p v-if="a.price" class="list-card__meta">{{ a.price }}</p>
            <p v-if="a.notes" class="list-card__notes">{{ a.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="event.practical_info" class="block">
        <h2 class="block__title">Practical information</h2>
        <div class="practical">
          <div
            v-for="([key, value]) in practicalEntries(event.practical_info)"
            :key="key"
            class="practical__entry"
          >
            <p class="practical__label">{{ practicalLabel(key) }}</p>

            <div v-if="isSection(value)" class="practical__section">
              <dl class="practical__dl">
                <template
                  v-for="([subKey, subVal]) in sectionEntries(value)"
                  :key="subKey"
                >
                  <dt class="practical__dt">{{ practicalLabel(subKey) }}</dt>
                  <dd class="practical__dd">
                    <template v-if="typeof subVal === 'boolean'">
                      {{ subVal ? 'Yes' : 'No' }}
                    </template>
                    <a
                      v-else-if="isUrl(subVal)"
                      :href="subVal"
                      target="_blank"
                      rel="noopener noreferrer"
                    >{{ subVal }}</a>
                    <a
                      v-else-if="isEmail(subVal)"
                      :href="`mailto:${subVal}`"
                    >{{ subVal }}</a>
                    <ul
                      v-else-if="isStringList(subVal)"
                      class="practical__list"
                    >
                      <li v-for="(item, i) in subVal" :key="i">{{ item }}</li>
                    </ul>
                    <template v-else>{{ subVal }}</template>
                  </dd>
                </template>
              </dl>
            </div>

            <p v-else class="practical__scalar">{{ value }}</p>
          </div>
        </div>
      </section>

      <section v-if="event.lunch_recommendations?.length" class="block">
        <h2 class="block__title">Lunch recommendations</h2>
        <ul class="list-card">
          <li v-for="(l, i) in event.lunch_recommendations" :key="i" class="list-card__item">
            <a v-if="l.link" :href="l.link" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ l.name }}</a>
            <span v-else class="list-card__name">{{ l.name }}</span>
            <p v-if="l.address" class="list-card__meta">{{ l.address }}</p>
            <p v-if="l.notes" class="list-card__notes">{{ l.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="event.biergartens?.length" class="block">
        <h2 class="block__title">Biergartens &amp; evenings</h2>
        <ul class="list-card">
          <li v-for="(b, i) in event.biergartens" :key="i" class="list-card__item">
            <a v-if="b.link" :href="b.link" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ b.name }}</a>
            <span v-else class="list-card__name">{{ b.name }}</span>
            <p v-if="b.address" class="list-card__meta">{{ b.address }}</p>
            <p v-if="b.notes" class="list-card__notes">{{ b.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="event.tourist_info && practicalEntries(touristInfoAsSection(event.tourist_info)).length" class="block">
        <h2 class="block__title">Things to see</h2>
        <div class="practical">
          <div
            v-for="([key, value]) in practicalEntries(touristInfoAsSection(event.tourist_info))"
            :key="key"
            class="practical__entry"
          >
            <p class="practical__label">{{ practicalLabel(key) }}</p>
            <p v-if="typeof value === 'string'" class="practical__scalar">
              <a
                v-if="isUrl(value)"
                :href="value"
                target="_blank"
                rel="noopener noreferrer"
              >{{ value }}</a>
              <template v-else>{{ value }}</template>
            </p>
            <div v-else-if="isSection(value)" class="practical__section">
              <dl class="practical__dl">
                <template
                  v-for="([subKey, subVal]) in sectionEntries(value)"
                  :key="subKey"
                >
                  <dt class="practical__dt">{{ practicalLabel(subKey) }}</dt>
                  <dd class="practical__dd">
                    <template v-if="typeof subVal === 'boolean'">{{ subVal ? 'Yes' : 'No' }}</template>
                    <a v-else-if="isUrl(subVal)" :href="subVal" target="_blank" rel="noopener noreferrer">{{ subVal }}</a>
                    <a v-else-if="isEmail(subVal)" :href="`mailto:${subVal}`">{{ subVal }}</a>
                    <ul v-else-if="isStringList(subVal)" class="practical__list">
                      <li v-for="(item, i) in subVal" :key="i">{{ item }}</li>
                    </ul>
                    <template v-else>{{ subVal }}</template>
                  </dd>
                </template>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section v-if="event.deadlines?.length" class="block">
        <h2 class="block__title">Key dates &amp; deadlines</h2>
        <ul class="deadlines">
          <li v-for="(d, i) in event.deadlines" :key="i" class="deadlines__item">
            <span v-if="d.date" class="deadlines__date">{{ formatDate(d.date) }}</span>
            <div>
              <p v-if="d.label" class="deadlines__label">{{ d.label }}</p>
              <p v-if="d.description" class="deadlines__desc">{{ d.description }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="meetingResolutions.length > 0" class="block">
        <h2 class="block__title">Resolutions adopted</h2>
        <p class="block__lead">
          This meeting adopted {{ meetingResolutions.length }} resolution{{ meetingResolutions.length === 1 ? '' : 's' }}.
        </p>
        <RouterLink v-if="meetingResolutionsPath" :to="meetingResolutionsPath!" class="cta">
          Browse this meeting's resolutions →
        </RouterLink>
      </section>
    </div>
  </article>
</template>

<style scoped>
.event-detail {
  max-width: 56rem; margin: 0 auto; padding: 0 0 4rem;
}
.event-detail__hero {
  background: linear-gradient(135deg, var(--color-brand) 0%, #b0000b 100%);
  color: #fff;
  padding: 3rem 1.5rem 2.5rem;
}
.event-detail__hero-inner { max-width: 48rem; margin: 0 auto; }
.event-detail__hero .back-link { color: rgba(255,255,255,0.85); }
.event-detail__hero .back-link:hover { color: #fff; }
.event-detail__eyebrow {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; margin: 1rem 0 0.5rem;
  color: rgba(255,255,255,0.9);
}
.event-detail__title {
  font-family: var(--font-serif);
  font-size: clamp(1.875rem, 4vw, 2.75rem);
  font-weight: 700; margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}
.event-detail__area { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.25rem; }
.event-detail__host { font-size: 1rem; margin: 0 0 0.5rem; opacity: 0.9; }
.event-detail__date {
  font-size: 0.9375rem; opacity: 0.85;
  font-family: ui-monospace, monospace;
}

.back-link {
  display: inline-block;
  font-size: 0.875rem; font-weight: 500;
  color: var(--color-blue-accent);
  text-decoration: none;
  margin-bottom: 1rem;
}
.back-link:hover { text-decoration: underline; }
.dark .back-link { color: #94b6e8; }

.event-detail__body { padding: 2.5rem 1.5rem 0; }

.block { margin-bottom: 2.5rem; }
.block__title {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: #78716c;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .block__title { color: #a8a29e; border-bottom-color: #292524; }
.block__lead { margin: 0 0 1rem; color: #57534e; }
.dark .block__lead { color: #d6d3d1; }

.venue-card {
  background: #fafaf9;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  border-left: 3px solid var(--color-blue-accent);
}
.dark .venue-card { background: #292524; border-left-color: #5379bf; }
.venue-card__name { font-weight: 700; margin: 0 0 0.5rem; color: #1c1917; }
.dark .venue-card__name { color: #fafaf9; }
.venue-card__address {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  margin: 0 0 0.625rem;
  color: #57534e;
}
.dark .venue-card__address { color: #d6d3d1; }
.venue-card__link {
  display: inline-block;
  font-size: 0.875rem;
  color: var(--color-blue-accent);
  text-decoration: none;
  margin-right: 1rem;
}
.venue-card__link:hover { text-decoration: underline; }
.dark .venue-card__link { color: #94b6e8; }

.secretary-card {
  background: #fafaf9; padding: 1rem 1.25rem;
  border-radius: 0.5rem; border-left: 3px solid var(--color-brand);
}
.dark .secretary-card { background: #292524; }
.secretary-card__name { font-weight: 700; margin: 0 0 0.125rem; color: #1c1917; }
.dark .secretary-card__name { color: #fafaf9; }
.secretary-card__org { font-size: 0.9375rem; color: #57534e; margin: 0 0 0.5rem; }
.dark .secretary-card__org { color: #d6d3d1; }
.secretary-card__contact { font-size: 0.875rem; margin: 0.125rem 0; color: #57534e; }
.dark .secretary-card__contact { color: #d6d3d1; }
.secretary-card__contact a { color: var(--color-blue-accent); }
.dark .secretary-card__contact a { color: #94b6e8; }

.schedule { display: flex; flex-direction: column; gap: 1.5rem; }
.schedule__date {
  font-size: 0.875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-brand);
  margin: 0 0 0.5rem;
}
.schedule__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.schedule__item {
  display: grid; grid-template-columns: 7rem 1fr;
  gap: 1rem;
  padding: 0.625rem 0.875rem;
  background: #fafaf9;
  border-radius: 0.375rem;
}
.dark .schedule__item { background: #292524; }
.schedule__time {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  color: #78716c;
}
.dark .schedule__time { color: #a8a29e; }
.schedule__event { font-weight: 600; margin: 0; color: #1c1917; }
.dark .schedule__event { color: #fafaf9; }
.schedule__desc { font-size: 0.875rem; color: #57534e; margin: 0.125rem 0 0; }
.dark .schedule__desc { color: #d6d3d1; }

.list-card {
  list-style: none; margin: 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  gap: 0.625rem;
}
.list-card__item {
  background: #fafaf9; padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}
.dark .list-card__item { background: #292524; }
.list-card__name { font-weight: 600; color: var(--color-blue-accent); }
.dark .list-card__name { color: #94b6e8; }
.list-card__name a { color: inherit; text-decoration: none; }
.list-card__name a:hover { text-decoration: underline; }
.list-card__meta { font-size: 0.8125rem; color: #78716c; margin: 0.25rem 0 0; }
.dark .list-card__meta { color: #a8a29e; }
.list-card__notes { font-size: 0.875rem; color: #57534e; margin: 0.25rem 0 0; }
.dark .list-card__notes { color: #d6d3d1; }

.practical {
  display: flex; flex-direction: column;
  gap: 1rem;
}
.practical__entry {
  background: #fafaf9;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  border-left: 3px solid var(--color-blue-accent);
}
.dark .practical__entry { background: #292524; border-left-color: #5379bf; }
.practical__label {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-brand);
  margin: 0 0 0.5rem;
}
.dark .practical__label { color: #94b6e8; }
.practical__scalar {
  margin: 0;
  color: #44403c;
  line-height: 1.6;
}
.dark .practical__scalar { color: #d6d3d1; }
.practical__dl {
  margin: 0;
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: 0.25rem 1rem;
}
.practical__dt {
  font-size: 0.8125rem; font-weight: 600;
  color: #57534e;
}
.dark .practical__dt { color: #a8a29e; }
.practical__dd {
  margin: 0;
  font-size: 0.9375rem;
  color: #1c1917;
  line-height: 1.55;
}
.dark .practical__dd { color: #e7e5e4; }
.practical__dd a {
  color: var(--color-blue-accent);
  text-decoration: none;
  word-break: break-all;
}
.practical__dd a:hover { text-decoration: underline; }
.dark .practical__dd a { color: #94b6e8; }
.practical__list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
  display: flex; flex-direction: column;
  gap: 0.125rem;
}
@media (max-width: 640px) {
  .practical__dl { grid-template-columns: 1fr; gap: 0.125rem 0; }
  .practical__dt { margin-top: 0.5rem; }
}

.deadlines { list-style: none; margin: 0; padding: 0; }
.deadlines__item {
  display: grid; grid-template-columns: 10rem 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .deadlines__item { border-bottom-color: #292524; }
.deadlines__date {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  color: var(--color-brand);
  font-weight: 600;
}
.deadlines__label { font-weight: 600; margin: 0; color: #1c1917; }
.dark .deadlines__label { color: #fafaf9; }
.deadlines__desc { font-size: 0.875rem; color: #57534e; margin: 0.125rem 0 0; }
.dark .deadlines__desc { color: #d6d3d1; }

.cta {
  display: inline-block;
  padding: 0.625rem 1rem;
  background: var(--color-blue-accent);
  color: #fff;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9375rem;
}
.cta:hover { background: #004d8a; }

.loading { color: #78716c; padding: 4rem 0; text-align: center; }

@media (max-width: 640px) {
  .schedule__item { grid-template-columns: 1fr; gap: 0.25rem; }
  .deadlines__item { grid-template-columns: 1fr; gap: 0.25rem; }
  .list-card { grid-template-columns: 1fr; }
}
</style>
