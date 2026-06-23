<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMeetings } from '../composables/useMeetings'
import { useResolutions } from '../composables/useResolutions'
import { useClipboard } from '../composables/useClipboard'
import { createNeighborNav } from '../composables/useNeighborNav'
import { committee } from '../data/committee'
import { venueToFlag } from '../data/countryFlags'
import { ordinalText } from '../utils/ordinal'
import { meetingDetailPathFromParts } from '../utils/urn'
import { groupScheduleByDate } from '../utils/schedule'
import {
  resolutionTypeLabel,
  sessionLabel,
  sessionLocation,
  sessionVirtual,
  associateRoleLabel,
} from '../utils/meetingFormat'
import { formatDateCompact } from '../utils/format'
import {
  practicalLabel,
  isSection,
  isStringList,
  isUrl,
  isEmail,
  practicalEntries,
  sectionEntries,
  touristInfoAsSection,
} from '../composables/usePracticalInfo'
import type { Meeting, ResolvedHost, RichMeetingData } from '../types/meeting'
import type { Resolution } from '../types/resolution'
import ScheduleCalendar from '../components/ScheduleCalendar.vue'
import PageHero from '../components/PageHero.vue'
import OrgLogo from '../components/OrgLogo.vue'
import PrevNextNav from '../components/PrevNextNav.vue'

const route = useRoute()
const { meetings, isLoaded, loadData } = useMeetings()
const { resolutions, loadData: loadResolutions } = useResolutions()
const { copied: urnCopied, copy: copyUrn } = useClipboard()

onMounted(async () => {
  await Promise.all([loadData(), loadResolutions()])
})

const ordinal = computed(() => Number(route.params.ordinal ?? 0))

const meeting = computed<Meeting | null>(() => {
  if (!isLoaded.value) return null
  return meetings.value.find(m => m.ordinal === ordinal.value) ?? null
})

const rich = computed<RichMeetingData | undefined>(() => meeting.value?.rich)

const meetingResolutions = computed<Resolution[]>(() => {
  const m = meeting.value
  if (!m || !m.resolutions_meeting_urn) return []
  const urn = m.resolutions_meeting_urn
  return resolutions.value.filter(r => r.meeting_urn === urn)
})

const ordinalYear = computed(() => {
  const m = meeting.value
  if (!m) return ''
  return m.year ? String(m.year) : '—'
})

function isUpcoming(m: Meeting): boolean {
  return m.status_label !== 'Concluded' && m.status_label !== 'Cancelled'
}

const venueFlag = computed(() => {
  const m = meeting.value
  if (!m) return ''
  const city = m.primary.city ?? ''
  const country = m.primary.country ?? ''
  return venueToFlag(country) || venueToFlag(city)
})

const venueMapUrl = computed(() => {
  const v = rich.value?.venues?.[0]
  if (!v || v.lat == null || v.lon == null) return null
  return `https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=16/${v.lat}/${v.lon}`
})

type GeoPoint = { lat?: number | null; lon?: number | null } | null | undefined

function venueEmbedSrc(v: GeoPoint): string | null {
  if (!v || v.lat == null || v.lon == null) return null
  const d = 0.008
  const lon1 = (v.lon - d).toFixed(6)
  const lon2 = (v.lon + d).toFixed(6)
  const lat1 = (v.lat - d).toFixed(6)
  const lat2 = (v.lat + d).toFixed(6)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${v.lat}%2C${v.lon}`
}

type OrgCard = ResolvedHost

const resolvedHosts = computed<OrgCard[]>(() => {
  const r = rich.value?.hosts
  if (Array.isArray(r) && r.length) return r
  const legacy = rich.value?.host
  if (!legacy) return []
  return [{ name: legacy, kind: 'unknown' }]
})

const resolvedAssociates = computed(() => rich.value?.associates ?? [])

function rateLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const scheduleByDate = computed(() => groupScheduleByDate(rich.value?.schedule))

const registrationUrl = computed(() => rich.value?.registration_url ?? null)

const sortedMeetings = computed(() => {
  return [...meetings.value].sort((a, b) => a.ordinal - b.ordinal)
})

function meetingNavItem(m: Meeting) {
  const loc = m.rich?.general_area || m.location_label || ''
  const year = m.year ? String(m.year) : ''
  const caption = [loc, year].filter(Boolean).join(' · ')
  return {
    to: meetingDetailPathFromParts('plenary', `plenary-${m.ordinal}`),
    numeral: String(m.ordinal),
    label: ordinalText(m.ordinal),
    caption,
  }
}

const { prev: prevMeetingRaw, next: nextMeetingRaw } = createNeighborNav<Meeting>(
  sortedMeetings,
  m => m.ordinal === ordinal.value,
)
const prevMeeting = computed(() => prevMeetingRaw.value ? meetingNavItem(prevMeetingRaw.value) : null)
const nextMeeting = computed(() => nextMeetingRaw.value ? meetingNavItem(nextMeetingRaw.value) : null)

</script>

<template>
  <div class="page" v-if="!isLoaded">
    <p class="loading">Loading plenary meeting…</p>
  </div>

  <div v-else-if="!meeting" class="page">
    <PageHero
      variant="detail"
      bleed
      eyebrow="Not found"
      title="Meeting not found"
      :lead="`No plenary matches ordinal ${ordinal}.`"
    >
      <template #actions>
        <RouterLink to="/meetings/" class="back">← All plenary meetings</RouterLink>
      </template>
    </PageHero>
  </div>

  <article v-else class="md">
    <PageHero
      variant="detail"
      bleed
      :class="['md-hero', { 'md-hero--upcoming': isUpcoming(meeting), 'md-hero--cancelled': meeting.status_label === 'Cancelled' }]"
      :eyebrow="`${ordinalText(meeting.ordinal)} plenary · ${ordinalYear}${venueFlag ? ' ' + venueFlag : ''}`"
      title="Plenary Meeting"
      :lead="rich?.general_area || meeting.location_label || `A plenary of ${committee.name}.`"
    >
      <template #breadcrumb>
        <RouterLink to="/meetings/">
          Plenary Index
        </RouterLink>
      </template>

      <template #decoration>
        <div class="md-hero__bg" aria-hidden="true"></div>
        <div class="md-hero__grid" aria-hidden="true"></div>
      </template>

      <dl class="md-hero__stats">
        <div v-if="meeting.date_label" class="md-hero__stat">
          <dt>Dates</dt>
          <dd>{{ meeting.date_label }}</dd>
        </div>
        <div v-if="meeting.primary.country" class="md-hero__stat">
          <dt>Host country</dt>
          <dd>{{ meeting.primary.country }}</dd>
        </div>
        <div v-if="rich?.host" class="md-hero__stat">
          <dt>Host</dt>
          <dd>{{ rich.host }}</dd>
        </div>
        <div class="md-hero__stat">
          <dt>Format</dt>
          <dd>{{ meeting.type_label }}</dd>
        </div>
      </dl>

      <div class="md-hero__badges" v-if="!registrationUrl || meeting.participant_total || meeting.resolution_count > 0">
        <span v-if="meeting.status_label === 'Cancelled'" class="pill pill--cancelled">Cancelled</span>
        <span v-else-if="isUpcoming(meeting) && !registrationUrl" class="pill pill--upcoming">Upcoming</span>
        <span v-else-if="!isUpcoming(meeting)" class="pill pill--concluded">Concluded</span>
        <span v-if="meeting.participant_total" class="pill pill--meta">{{ meeting.participant_total }} participants</span>
        <span v-if="meeting.resolution_count > 0" class="pill pill--res">{{ meeting.resolution_count }} resolution{{ meeting.resolution_count === 1 ? '' : 's' }}</span>
      </div>

      <template #actions>
        <a v-if="registrationUrl && isUpcoming(meeting)" :href="registrationUrl" target="_blank" rel="noopener noreferrer" class="reg-cta">
          <span class="reg-cta__status">
            <span class="reg-cta__pulse" aria-hidden="true"></span>
            Registration open
          </span>
          <span class="reg-cta__action">
            <span class="reg-cta__verb">Register</span>
            <span class="reg-cta__arrow" aria-hidden="true">→</span>
          </span>
        </a>
      </template>
    </PageHero>

    <div class="md__nav">
      <PrevNextNav
        :prev="prevMeeting"
        :next="nextMeeting"
        context-label="Other plenary meetings"
      />
    </div>

    <div class="md__body">
      <nav v-if="meeting.primary.iso_meeting_url || meeting.resolutions_meeting_urn" class="md__quick-links" aria-label="Meeting actions">
        <a v-if="meeting.primary.iso_meeting_url" :href="meeting.primary.iso_meeting_url" target="_blank" rel="noopener noreferrer" class="quick-link">
          ISO committee meeting
          <span aria-hidden="true">↗</span>
        </a>
        <div v-if="meeting.resolutions_meeting_urn" class="urn-bar">
          <span class="urn-bar__label">URN</span>
          <code class="urn-bar__value">{{ meeting.resolutions_meeting_urn }}</code>
          <button @click="copyUrn(meeting.resolutions_meeting_urn!)" class="urn-bar__copy" :aria-label="urnCopied ? 'Copied' : 'Copy URN'">
            <svg v-if="!urnCopied" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
      </nav>

      <section v-if="meeting.primary.cancellation_comment" class="alert alert--cancelled">
        <h3 class="alert__title">This meeting was cancelled</h3>
        <p class="alert__body">{{ meeting.primary.cancellation_comment }}</p>
      </section>

      <section v-if="meeting.primary.reschedule_note" class="alert alert--reschedule">
        <h3 class="alert__title">Rescheduled</h3>
        <p class="alert__body">
          {{ meeting.primary.reschedule_note }}
          <span v-if="meeting.primary.reschedule_timeframe"> ({{ meeting.primary.reschedule_timeframe }})</span>
        </p>
      </section>

      <section v-if="resolvedHosts.length || rich?.host" class="block">
        <h2 class="block__title">Hosted by</h2>
        <div class="host-grid">
          <component
            :is="h.path ? 'RouterLink' : 'div'"
            v-for="(h, i) in resolvedHosts"
            :key="i"
            :to="h.path || undefined"
            :class="['host-card', { 'host-card--linkable': !!h.path }]"
          >
            <OrgLogo
              v-if="h.logo || h.logo_light || h.logo_dark"
              :logo="h.logo"
              :logo_light="h.logo_light"
              :logo_dark="h.logo_dark"
              size="md"
              radius="0.375rem"
              class="host-card__logo"
              :fallback-text="h.short_name ?? h.name"
              :alt="h.name"
            />
            <div v-else class="host-card__monogram" aria-hidden="true">
              {{ (h.name || '?').slice(0, 2).toUpperCase() }}
            </div>
            <div class="host-card__meta">
              <p class="host-card__name">{{ h.name }}</p>
              <p v-if="h.kind === 'liaison'" class="host-card__kind">Liaison organization</p>
              <p v-else-if="h.kind === 'national-body'" class="host-card__kind">National body</p>
              <p v-if="h.contact?.name" class="host-card__contact">
                <span class="host-card__contact-name">{{ h.contact.name }}</span>
                <span v-if="h.contact.title" class="host-card__contact-title">{{ h.contact.title }}</span>
              </p>
              <p v-if="h.path" class="host-card__link">View profile <span aria-hidden="true">→</span></p>
              <a v-else-if="h.url" :href="h.url" target="_blank" rel="noopener noreferrer" class="host-card__link" @click.stop>
                Visit website
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </component>
          <p v-if="!resolvedHosts.length && rich?.host" class="host-grid__plain">{{ rich.host }}</p>
        </div>
      </section>

      <section v-if="resolvedAssociates.length" class="block">
        <h2 class="block__title">In association with</h2>
        <ul class="assoc-list">
          <li
            v-for="(a, i) in resolvedAssociates"
            :key="i"
            class="assoc"
            :class="[`assoc--${a.kind}`, { 'assoc--linkable': !!(a.path || a.url) }]"
          >
            <component
              :is="a.path ? 'RouterLink' : (a.url ? 'a' : 'div')"
              :to="a.path || undefined"
              :href="a.url || undefined"
              :target="a.url && !a.path ? '_blank' : undefined"
              :rel="a.url && !a.path ? 'noopener noreferrer' : undefined"
              class="assoc__main"
              @click="a.path || a.url ? '' : null"
            >
              <OrgLogo
                v-if="a.logo || a.logo_light || a.logo_dark"
                :logo="a.logo"
                :logo_light="a.logo_light"
                :logo_dark="a.logo_dark"
                size="sm"
                radius="0.3125rem"
                class="assoc__logo"
                :fallback-text="a.short_name ?? a.name"
                :alt="a.name"
              />
              <div v-else class="assoc__monogram" aria-hidden="true">
                {{ (a.name || '?').slice(0, 2).toUpperCase() }}
              </div>

              <div class="assoc__text">
                <div class="assoc__name-row">
                  <span class="assoc__name">{{ a.name }}</span>
                  <span v-if="a.role" class="assoc__role">{{ associateRoleLabel(a.role) }}</span>
                </div>
                <p v-if="a.kind === 'liaison'" class="assoc__kind">Liaison organization</p>
                <p v-else-if="a.kind === 'national-body'" class="assoc__kind">National body</p>
                <p v-else-if="a.country" class="assoc__kind">{{ a.country }}</p>
                <p v-if="a.contact?.name" class="assoc__contact">
                  <span class="assoc__contact-name">{{ a.contact.name }}</span>
                  <span v-if="a.contact.title" class="assoc__contact-title"> · {{ a.contact.title }}</span>
                </p>
                <p v-if="a.path" class="assoc__link">View profile <span aria-hidden="true">→</span></p>
                <p v-else-if="a.url" class="assoc__link">
                  Visit website <span aria-hidden="true">↗</span>
                </p>
              </div>
            </component>
          </li>
        </ul>
      </section>

      <section v-if="rich?.venues?.length" class="block">
        <h2 class="block__title">Venue</h2>
        <div v-for="(v, i) in rich.venues" :key="i" class="venue-layout">
          <div class="venue-card venue-card--stacked">
            <div class="venue-card__main">
              <p v-if="v.name" class="venue-card__name">{{ v.name }}</p>
              <pre v-if="v.address" class="venue-card__address">{{ v.address }}</pre>
              <p v-if="v.note" class="venue-card__note">{{ v.note }}</p>
              <div class="venue-card__links">
                <a v-if="v.link" :href="v.link" target="_blank" rel="noopener noreferrer">Venue website →</a>
                <a v-if="venueMapUrl" :href="venueMapUrl" target="_blank" rel="noopener noreferrer">OpenStreetMap →</a>
              </div>
            </div>
          </div>
          <div v-if="venueEmbedSrc(v)" class="venue-map">
            <iframe
              :src="venueEmbedSrc(v) || ''"
              :title="`Map showing ${v.name ?? 'meeting venue'}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <small class="venue-map__credit">
              Map data &copy;
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
              contributors
            </small>
          </div>
        </div>
      </section>

      <section v-else-if="meeting.location_label" class="block">
        <h2 class="block__title">Location</h2>
        <p class="block__scalar">{{ meeting.location_label }}</p>
      </section>

      <section v-if="rich?.secretariat" class="block">
        <h2 class="block__title">Secretariat</h2>
        <div class="secretary-card">
          <p v-if="rich.secretariat.name" class="secretary-card__name">{{ rich.secretariat.name }}</p>
          <p v-if="rich.secretariat.organization" class="secretary-card__org">{{ rich.secretariat.organization }}</p>
          <p v-if="rich.secretariat.email" class="secretary-card__contact">
            <a :href="`mailto:${rich.secretariat.email}`">{{ rich.secretariat.email }}</a>
          </p>
          <p v-if="rich.secretariat.phone" class="secretary-card__contact">{{ rich.secretariat.phone }}</p>
        </div>
      </section>

      <section v-if="scheduleByDate.length" class="block">
        <h2 class="block__title">Agenda</h2>
        <ScheduleCalendar
          :schedule="rich?.schedule ?? []"
          :venue-name="rich?.venues?.[0]?.name"
          :general-area="rich?.general_area"
        />
      </section>

      <section v-if="rich?.accommodation_options?.length" class="block">
        <h2 class="block__title">Accommodation</h2>
        <ul class="list-card">
          <li v-for="(a, i) in rich.accommodation_options" :key="i" class="list-card__item list-card__item--rich">
            <div class="list-card__head">
              <a v-if="a.link" :href="a.link" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ a.name }}</a>
              <span v-else class="list-card__name">{{ a.name }}</span>
              <span v-if="a.distance" class="list-card__chip">{{ a.distance }}</span>
              <span v-if="a.code" class="list-card__chip list-card__chip--code">Booking code: {{ a.code }}</span>
            </div>
            <p v-if="a.address" class="list-card__meta">{{ a.address }}</p>
            <p v-if="a.email" class="list-card__meta">
              <a :href="`mailto:${a.email}`">{{ a.email }}</a>
            </p>
            <dl v-if="a.rates" class="list-card__rates">
              <template v-for="(val, key) in a.rates" :key="key">
                <dt>{{ rateLabel(String(key)) }}</dt>
                <dd>{{ val }}</dd>
              </template>
            </dl>
            <p v-else-if="a.price" class="list-card__meta">{{ a.price }}</p>
            <p v-if="a.breakfast" class="list-card__meta list-card__meta--soft">Breakfast: {{ a.breakfast }}</p>
            <p v-if="a.notes" class="list-card__notes">{{ a.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="rich?.practical_info" class="block">
        <h2 class="block__title">Practical information</h2>
        <div class="practical">
          <div
            v-for="([key, value]) in practicalEntries(rich.practical_info)"
            :key="key"
            class="practical__entry"
          >
            <p class="practical__label">{{ practicalLabel(key) }}</p>

            <div v-if="isSection(value)" class="practical__section">
              <dl class="practical__dl">
                <template v-for="([subKey, subVal]) in sectionEntries(value)" :key="subKey">
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

            <ul v-else-if="isStringList(value)" class="practical__list practical__list--top">
              <li v-for="(item, i) in value" :key="i">{{ item }}</li>
            </ul>

            <p v-else class="practical__scalar">
              <a v-if="isUrl(value)" :href="value" target="_blank" rel="noopener noreferrer">{{ value }}</a>
              <template v-else>{{ value }}</template>
            </p>
          </div>
        </div>
      </section>

      <section v-if="rich?.lunch_recommendations?.length" class="block">
        <h2 class="block__title">Lunch recommendations</h2>
        <ul class="list-card">
          <li v-for="(l, i) in rich.lunch_recommendations" :key="i" class="list-card__item">
            <a v-if="l.link || l.url" :href="l.link || l.url" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ l.name }}</a>
            <span v-else class="list-card__name">{{ l.name }}</span>
            <p v-if="l.address" class="list-card__meta">{{ l.address }}</p>
            <p v-if="l.notes" class="list-card__notes">{{ l.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="rich?.biergartens?.length" class="block">
        <h2 class="block__title">Biergartens &amp; evenings</h2>
        <ul class="list-card">
          <li v-for="(b, i) in rich.biergartens" :key="i" class="list-card__item list-card__item--rich">
            <div class="list-card__head">
              <a v-if="b.link || b.url" :href="b.link || b.url" target="_blank" rel="noopener noreferrer" class="list-card__name">{{ b.name }}</a>
              <span v-else class="list-card__name">{{ b.name }}</span>
              <span v-if="b.walk_minutes" class="list-card__chip">{{ b.walk_minutes }} min walk</span>
            </div>
            <p v-if="b.address" class="list-card__meta">{{ b.address }}</p>
            <p v-if="b.style" class="list-card__meta list-card__meta--soft">{{ b.style }}</p>
            <p v-if="b.notes" class="list-card__notes">{{ b.notes }}</p>
          </li>
        </ul>
      </section>

      <section v-if="rich?.tourist_info && practicalEntries(touristInfoAsSection(rich.tourist_info)).length" class="block">
        <h2 class="block__title">Things to see</h2>
        <div class="practical">
          <div
            v-for="([key, value]) in practicalEntries(touristInfoAsSection(rich.tourist_info))"
            :key="key"
            class="practical__entry"
          >
            <p class="practical__label">{{ key }}</p>
            <p v-if="typeof value === 'string'" class="practical__scalar">
              <a v-if="isUrl(value)" :href="value" target="_blank" rel="noopener noreferrer">{{ value }}</a>
              <template v-else>{{ value }}</template>
            </p>
            <div v-else-if="isSection(value)" class="practical__section">
              <dl class="practical__dl">
                <template v-for="([subKey, subVal]) in sectionEntries(value)" :key="subKey">
                  <dt class="practical__dt">{{ practicalLabel(subKey) }}</dt>
                  <dd class="practical__dd">
                    <template v-if="typeof subVal === 'boolean'">{{ subVal ? 'Yes' : 'No' }}</template>
                    <a v-else-if="isUrl(subVal)" :href="subVal" target="_blank" rel="noopener noreferrer">{{ subVal }}</a>
                    <a v-else-if="isEmail(subVal)" :href="`mailto:${subVal}`">{{ subVal }}</a>
                    <template v-else>{{ subVal }}</template>
                  </dd>
                </template>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section v-if="rich?.deadlines?.length" class="block">
        <h2 class="block__title">Key dates &amp; deadlines</h2>
        <ul class="deadlines">
          <li v-for="(d, i) in rich.deadlines" :key="i" class="deadlines__item">
            <span v-if="d.date" class="deadlines__date">{{ formatDateCompact(d.date) }}</span>
            <div>
              <p v-if="d.label" class="deadlines__label">{{ d.label }}</p>
              <p v-if="d.description" class="deadlines__desc">{{ d.description }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="meeting.sessions.length > 1" class="block">
        <h2 class="block__title">All sessions ({{ meeting.sessions.length }})</h2>
        <ul class="sessions">
          <li v-for="(s, i) in meeting.sessions" :key="i" class="sessions__item">
            <div class="sessions__meta">
              <span class="sessions__type">{{ s.type === 'hybrid' ? 'Hybrid' : s.type === 'virtual' ? 'Virtual' : 'In person' }}</span>
              <a v-if="s.iso_meeting_url" :href="s.iso_meeting_url" target="_blank" rel="noopener noreferrer" class="sessions__link">ISO #{{ s.iso_meeting_id }} ↗</a>
              <span v-else-if="s.iso_meeting_id" class="sessions__link sessions__link--plain">ISO #{{ s.iso_meeting_id }}</span>
            </div>
            <p v-if="sessionLabel(s)" class="sessions__date">{{ sessionLabel(s) }}</p>
            <p v-if="sessionLocation(s)" class="sessions__loc">{{ sessionLocation(s) }}</p>
            <p v-if="sessionVirtual(s)" class="sessions__virtual">Online · {{ sessionVirtual(s) }}</p>
          </li>
        </ul>
      </section>

      <section v-if="meetingResolutions.length > 0" class="block">
        <h2 class="block__title">
          {{ meetingResolutions.length }} resolution{{ meetingResolutions.length === 1 ? '' : 's' }} adopted
        </h2>
        <p class="block__lead">
          Adopted at the {{ ordinalText(meeting.ordinal) }} plenary of {{ committee.name }}.
        </p>
        <ul class="res-list">
          <li v-for="res in meetingResolutions" :key="res.id">
            <RouterLink :to="res.path" class="res-card">
              <div class="res-card__head">
                <span v-if="res.is_acclamation" class="res-card__kind res-card__kind--acclamation">Acclamation</span>
                <template v-else>
                  <span class="res-card__id">{{ res.id }}</span>
                  <span class="res-card__kind">{{ resolutionTypeLabel(res.source_type) }}</span>
                </template>
              </div>
              <p class="res-card__title">{{ res.is_acclamation ? 'Acclamation' : (res.title || `Resolution ${res.id}`) }}</p>
              <p v-if="res.snippet" class="res-card__snippet">{{ res.snippet }}</p>
              <span v-if="res.subject" class="res-card__subject">{{ res.subject }}</span>
              <span class="res-card__arrow" aria-hidden="true">→</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section v-else-if="meeting.resolution_count === 0 && meeting.status_label === 'Concluded'" class="block">
        <h2 class="block__title">Resolutions</h2>
        <p class="block__lead">No resolutions were recorded for this plenary in the archive.</p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.page { max-width: 56rem; margin: 0 auto; padding: 0 1.5rem 4rem; }
.loading { padding: 4rem 1rem; text-align: center; color: #78716c; }
.dark .loading { color: #a8a29e; }
.back { display: inline-block; color: var(--color-blue-accent); text-decoration: none; font-weight: 500; font-size: 0.875rem; }
.back:hover { text-decoration: underline; }

/* HERO (PageHero overrides for gradient + grid + white text) */
.md-hero :deep(.ph) { margin-bottom: 0; }
.md-hero :deep(.ph__inner) {
  max-width: 48rem;
  position: relative;
  z-index: 1;
}
.md-hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at top right, rgb(185 28 28 / 0.35), transparent 60%),
    linear-gradient(135deg, #2a1012 0%, #5a1818 50%, #1e3a8a 130%);
  z-index: 0;
}
.md-hero--upcoming .md-hero__bg {
  background:
    radial-gradient(ellipse at top right, rgb(30 58 138 / 0.45), transparent 60%),
    linear-gradient(135deg, #0f1e3a 0%, #1e3a8a 60%, #3b82f6 140%);
}
.md-hero--cancelled .md-hero__bg {
  background: linear-gradient(135deg, #44403c 0%, #1c1917 100%);
}
.md-hero__grid {
  position: absolute;
  inset: -2rem;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 2.5rem 2.5rem;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at top right, black, transparent 70%);
  z-index: 0;
}
.md-hero :deep(.ph__eyebrow),
.md-hero :deep(.ph__eyebrow-rule) {
  color: rgba(255, 255, 255, 0.9);
}
.md-hero :deep(.ph__eyebrow-rule) {
  background: rgba(255, 255, 255, 0.9);
}
.md-hero :deep(.ph__title) { color: #fff; }
.md-hero :deep(.ph__lead) { color: rgba(255, 255, 255, 0.92); }
.md-hero :deep(.ph__extra) { margin-top: 1.25rem; }
.md-hero :deep(.ph__actions) {
  margin-top: 1.75rem;
  align-items: center;
}

/* Breadcrumb sits on the dark gradient hero — needs light treatment
   regardless of theme. */
.md-hero :deep(.ph__breadcrumb) {
  color: rgba(255, 255, 255, 0.78);
}
.md-hero :deep(.ph__breadcrumb a) {
  color: rgba(255, 255, 255, 0.78);
}
.md-hero :deep(.ph__breadcrumb a:hover) {
  color: #fff;
}

/* Registration CTA — a "live status" card that absorbs the upcoming state.
   The pulse dot signals registration is currently open; the serif "Register"
   verb gives the action weight against the editorial hero typography.
   Sits on the dark gradient hero, so the card is always white. */
.reg-cta {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.75rem 1.25rem 0.875rem;
  background: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow:
    0 4px 16px rgb(0 0 0 / 0.22),
    0 0 0 1px rgb(255 255 255 / 0.6) inset;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s;
  position: relative;
  overflow: hidden;
}
.reg-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgb(16 185 129 / 0.06), transparent 60%);
  pointer-events: none;
}
.reg-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 28px rgb(0 0 0 / 0.3),
    0 0 0 1px rgb(255 255 255 / 0.8) inset;
}
.reg-cta__status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #047857;
  position: relative;
}
.reg-cta__pulse {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #10b981;
  position: relative;
  flex-shrink: 0;
}
.reg-cta__pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #10b981;
  animation: reg-pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes reg-pulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  70%  { transform: scale(2.6); opacity: 0;   }
  100% { transform: scale(2.6); opacity: 0;   }
}
.reg-cta__action {
  display: inline-flex;
  align-items: baseline;
  gap: 0.625rem;
  position: relative;
}
.reg-cta__verb {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--color-blue-accent);
  font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 1;
}
.reg-cta__arrow {
  font-family: var(--font-sans);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-blue-accent);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.reg-cta:hover .reg-cta__arrow { transform: translateX(4px); }
@media (prefers-reduced-motion: reduce) {
  .reg-cta__pulse::after { animation: none; }
  .reg-cta:hover { transform: none; }
  .reg-cta:hover .reg-cta__arrow { transform: none; }
}

.md-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.125rem;
  margin: 0 0 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}
@media (min-width: 768px) {
  .md-hero__stats { grid-template-columns: repeat(4, 1fr); }
}
.md-hero__stat {
  margin: 0;
  padding: 0.875rem 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
}
.md-hero__stat:first-child { border-left: 0; }
.md-hero__stat dt {
  font-size: 0.625rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 0.25rem;
}
.md-hero__stat dd {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
}

.md-hero__badges { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.pill {
  display: inline-flex; align-items: center;
  padding: 0.3125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  backdrop-filter: blur(6px);
}
.pill--cancelled { background: rgba(0, 0, 0, 0.4); }
.pill--upcoming { background: #fff; color: var(--color-brand); }
.pill--concluded { background: rgba(255, 255, 255, 0.15); }
.pill--meta, .pill--res { background: rgba(255, 255, 255, 0.12); }

/* BODY */
.md__nav {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.md__nav :deep(.pnn) {
  margin-top: 0;
}

.md__body {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.md__quick-links {
  display: flex; flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed #e7e5e4;
}
.dark .md__quick-links { border-bottom-color: #292524; }
.quick-link {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.375rem;
  font-size: 0.875rem; font-weight: 600;
  color: var(--color-blue-accent);
  text-decoration: none;
  transition: all 0.15s;
}
.dark .quick-link { background: #292524; border-color: #44403c; }
.quick-link:hover { border-color: var(--color-blue-accent); box-shadow: 0 1px 4px rgb(30 58 138 / 0.1); }

.urn-bar {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.375rem 0.5rem 0.375rem 0.75rem;
  border: 1px dashed #d6d3d1;
  border-radius: 0.375rem;
  background: #fafaf9;
  font-size: 0.8125rem;
}
.dark .urn-bar { background: #1c1917; border-color: #57534e; }
.urn-bar__label {
  font-size: 0.625rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: #a8a29e;
}
.urn-bar__value {
  font-family: ui-monospace, monospace;
  color: #57534e;
  font-size: 0.8125rem;
}
.dark .urn-bar__value { color: #d6d3d1; }
.urn-bar__copy {
  background: none; border: 0; padding: 0.25rem;
  cursor: pointer; color: #78716c;
  border-radius: 0.25rem;
  display: inline-flex;
}
.urn-bar__copy:hover { color: var(--color-brand); background: rgb(185 28 28 / 0.08); }

/* ALERTS */
.alert {
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  border-left: 3px solid;
}
.alert--cancelled {
  background: #fef2f2;
  border-left-color: var(--color-iso-red);
}
.dark .alert--cancelled { background: rgb(185 28 28 / 0.08); }
.alert--reschedule {
  background: #fffbeb;
  border-left-color: #d97706;
}
.dark .alert--reschedule { background: rgb(217 119 6 / 0.1); }
.alert__title {
  font-size: 0.875rem; font-weight: 700;
  margin: 0 0 0.25rem;
  color: #1c1917;
}
.dark .alert__title { color: #fafaf9; }
.alert__body {
  margin: 0;
  font-size: 0.9375rem;
  color: #57534e;
}
.dark .alert__body { color: #d6d3d1; }

/* BLOCKS */
.block { margin-bottom: 2.5rem; }
.block__title {
  font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.14em; color: #78716c;
  margin: 0 0 1rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .block__title { color: #a8a29e; border-bottom-color: #292524; }
.block__lead { margin: 0 0 1rem; color: #57534e; font-size: 0.9375rem; }
.dark .block__lead { color: #d6d3d1; }
.block__scalar { margin: 0; font-size: 1.0625rem; color: #1c1917; font-weight: 500; }
.dark .block__scalar { color: #fafaf9; }

/* VENUE / SECRETARY */
.venue-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: stretch;
}
@media (min-width: 720px) {
  .venue-layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); }
}

.venue-card {
  background: #fafaf9;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  border-left: 3px solid var(--color-blue-accent);
}
.venue-card--stacked { display: flex; flex-direction: column; }
.dark .venue-card { background: #292524; border-left-color: #5379bf; }
.venue-card__main { display: flex; flex-direction: column; gap: 0.5rem; }
.venue-card__name { font-weight: 700; margin: 0; color: #1c1917; font-size: 1.0625rem; }
.dark .venue-card__name { color: #fafaf9; }
.venue-card__address {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  margin: 0;
  color: #57534e;
  line-height: 1.5;
}
.dark .venue-card__address { color: #d6d3d1; }
.venue-card__note {
  margin: 0;
  font-size: 0.8125rem;
  color: #78716c;
  line-height: 1.5;
  padding-top: 0.5rem;
  border-top: 1px dashed #e7e5e4;
}
.dark .venue-card__note { color: #a8a29e; border-top-color: #44403c; }
.venue-card__links { display: flex; flex-wrap: wrap; gap: 0.875rem; margin-top: auto; padding-top: 0.5rem; }
.venue-card__links a {
  font-size: 0.8125rem;
  color: var(--color-blue-accent);
  text-decoration: none;
}
.venue-card__links a:hover { text-decoration: underline; }

.venue-map {
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #e7e5e4;
  min-height: 14rem;
  position: relative;
}
.dark .venue-map { background: #1c1917; }
.venue-map iframe {
  width: 100%;
  flex: 1;
  border: 0;
  min-height: 12rem;
  display: block;
}
.venue-map__credit {
  padding: 0.375rem 0.625rem;
  font-size: 0.625rem;
  color: #78716c;
  background: rgba(255, 255, 255, 0.7);
  text-align: right;
}
.dark .venue-map__credit { background: rgba(0, 0, 0, 0.4); color: #a8a29e; }
.venue-map__credit a { color: inherit; text-decoration: underline; }

/* HOST CARDS */
.host-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
  gap: 0.75rem;
}
.host-grid__plain { margin: 0; color: #57534e; font-size: 1rem; }
.dark .host-grid__plain { color: #d6d3d1; }
.host-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  text-decoration: none;
  color: inherit;
}
.host-card--linkable { cursor: pointer; }
.host-card--linkable:hover {
  border-color: var(--color-amber-warm, #b45309);
  box-shadow: 0 4px 12px rgb(180 83 9 / 0.1);
  transform: translateY(-1px);
}
.dark .host-card { background: #292524; border-color: #44403c; }
.host-card__logo {
  border: 1px solid #e7e5e4;
}
.dark .host-card__logo { border-color: #44403c; }
.host-card__monogram {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 0.375rem;
  background: linear-gradient(135deg, var(--color-brand), var(--color-amber-warm, #b45309));
  color: #fff;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.host-card__meta { min-width: 0; }
.host-card__name { margin: 0; font-weight: 600; font-size: 0.9375rem; color: #1c1917; }
.dark .host-card__name { color: #fafaf9; }
.host-card__kind { margin: 0.125rem 0 0; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; font-weight: 600; }
.dark .host-card__kind { color: #a8a29e; }
.host-card__link { display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; font-size: 0.8125rem; color: var(--color-blue-accent); text-decoration: none; }
.host-card__link:hover { text-decoration: underline; }

.host-card__contact {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #57534e;
  line-height: 1.4;
}
.dark .host-card__contact { color: #a8a29e; }
.host-card__contact-name { font-weight: 600; color: #1c1917; }
.dark .host-card__contact-name { color: #fafaf9; }
.host-card__contact-title { color: #78716c; margin-left: 0.25rem; }
.dark .host-card__contact-title { color: #a8a29e; }

/* ASSOCIATES (co-organizers, sponsors, partners) */
.assoc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(13rem, 100%), 1fr));
  gap: 0.5rem;
}
.assoc {
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.dark .assoc { background: rgb(28 25 23 / 0.6); border-color: #44403c; }
.assoc--linkable:hover {
  border-color: var(--color-amber-warm, #b45309);
  box-shadow: 0 4px 10px rgb(180 83 9 / 0.08);
  transform: translateY(-1px);
}
.assoc__main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  text-decoration: none;
  color: inherit;
}
.assoc__logo {
  border: 1px solid #e7e5e4;
}
.dark .assoc__logo { border-color: #44403c; }
.assoc__monogram {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.3125rem;
  background: linear-gradient(135deg, #78716c, #57534e);
  color: #fff;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.assoc__text { min-width: 0; flex: 1; }
.assoc__name-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.125rem;
}
.assoc__name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1c1917;
  line-height: 1.25;
}
.dark .assoc__name { color: #fafaf9; }
.assoc__role {
  display: inline-block;
  padding: 0.0625rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.1875rem;
  background: rgb(180 83 9 / 0.12);
  color: var(--color-amber-warm, #b45309);
}
.dark .assoc__role {
  background: rgb(180 83 9 / 0.22);
  color: #fbbf24;
}
.assoc__kind {
  margin: 0;
  font-size: 0.75rem;
  color: #78716c;
}
.dark .assoc__kind { color: #a8a29e; }
.assoc__contact {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #57534e;
}
.dark .assoc__contact { color: #d6d3d1; }
.assoc__contact-name { font-weight: 600; color: #1c1917; }
.dark .assoc__contact-name { color: #fafaf9; }
.assoc__contact-title { color: #78716c; }
.dark .assoc__contact-title { color: #a8a29e; }
.assoc__link {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--color-blue-accent);
}

.secretary-card {
  background: #fafaf9;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--color-brand);
}
.dark .secretary-card { background: #292524; }
.secretary-card__name { font-weight: 700; margin: 0 0 0.125rem; color: #1c1917; }
.dark .secretary-card__name { color: #fafaf9; }
.secretary-card__org { font-size: 0.9375rem; color: #57534e; margin: 0 0 0.5rem; }
.dark .secretary-card__org { color: #d6d3d1; }
.secretary-card__contact { font-size: 0.875rem; margin: 0.125rem 0; color: #57534e; }
.dark .secretary-card__contact { color: #d6d3d1; }
.secretary-card__contact a { color: var(--color-blue-accent); }

/* SCHEDULE */
.schedule { display: flex; flex-direction: column; gap: 1.5rem; }
.schedule__date {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
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
.schedule__time { font-family: ui-monospace, monospace; font-size: 0.8125rem; color: #78716c; }
.dark .schedule__time { color: #a8a29e; }
.schedule__event { font-weight: 600; margin: 0; color: #1c1917; }
.dark .schedule__event { color: #fafaf9; }
.schedule__desc { font-size: 0.875rem; color: #57534e; margin: 0.125rem 0 0; }
.dark .schedule__desc { color: #d6d3d1; }

/* LISTS */
.list-card {
  list-style: none; margin: 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  gap: 0.625rem;
}
.list-card__item {
  background: #fafaf9;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}
.list-card__item--rich { padding: 0.875rem 1.125rem; }
.dark .list-card__item { background: #292524; }
.list-card__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; margin-bottom: 0.25rem; }
.list-card__chip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 0.25rem;
  background: rgb(30 58 138 / 0.08);
  color: var(--color-blue-accent);
}
.dark .list-card__chip { background: rgb(148 182 232 / 0.12); }
.list-card__chip--code { background: rgb(180 83 9 / 0.08); color: var(--color-amber-warm, #b45309); }
.dark .list-card__chip--code { background: rgb(180 83 9 / 0.16); color: #fbbf24; }
.list-card__rates {
  margin: 0.375rem 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.125rem 0.625rem;
  font-size: 0.8125rem;
}
.list-card__rates dt { color: #78716c; text-transform: capitalize; }
.dark .list-card__rates dt { color: #a8a29e; }
.list-card__rates dd { margin: 0; color: #1c1917; font-weight: 600; font-family: ui-monospace, monospace; }
.dark .list-card__rates dd { color: #fafaf9; }
.list-card__name { font-weight: 600; color: var(--color-blue-accent); }
.list-card__name a { color: inherit; text-decoration: none; }
.list-card__name a:hover { text-decoration: underline; }
.list-card__meta { font-size: 0.8125rem; color: #78716c; margin: 0.25rem 0 0; }
.dark .list-card__meta { color: #a8a29e; }
.list-card__meta--soft { font-style: italic; }
.list-card__meta a { color: inherit; text-decoration: underline; }
.list-card__notes { font-size: 0.875rem; color: #57534e; margin: 0.25rem 0 0; }
.dark .list-card__notes { color: #d6d3d1; }

/* PRACTICAL */
.practical {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  gap: 0.625rem;
}
.practical__entry {
  background: #fafaf9;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}
.dark .practical__entry { background: #292524; }
.practical__label {
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #78716c;
  margin: 0 0 0.375rem;
}
.dark .practical__label { color: #a8a29e; }
.practical__scalar { margin: 0; color: #57534e; font-size: 0.875rem; word-break: break-word; }
.dark .practical__scalar { color: #d6d3d1; }
.practical__scalar a { color: var(--color-blue-accent); }
.practical__dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.625rem; }
.practical__dt { font-size: 0.75rem; color: #78716c; font-weight: 500; }
.dark .practical__dt { color: #a8a29e; }
.practical__dd { margin: 0; font-size: 0.875rem; color: #57534e; word-break: break-word; }
.dark .practical__dd { color: #d6d3d1; }
.practical__dd a { color: var(--color-blue-accent); }
.practical__list { margin: 0; padding-left: 1.125rem; }
.practical__list--top { font-size: 0.875rem; color: #57534e; }
.dark .practical__list--top { color: #d6d3d1; }

/* DEADLINES */
.deadlines { list-style: none; margin: 0; padding: 0; }
.deadlines__item {
  display: grid; grid-template-columns: 12rem 1fr;
  gap: 1rem;
  padding: 0.625rem 0;
  border-bottom: 1px dashed #e7e5e4;
}
.dark .deadlines__item { border-bottom-color: #292524; }
.deadlines__item:last-child { border-bottom: 0; }
.deadlines__date {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-brand);
  letter-spacing: -0.01em;
}
.deadlines__label { font-weight: 600; margin: 0; color: #1c1917; }
.dark .deadlines__label { color: #fafaf9; }
.deadlines__desc { font-size: 0.875rem; color: #57534e; margin: 0.125rem 0 0; }
.dark .deadlines__desc { color: #d6d3d1; }

/* SESSIONS */
.sessions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem; }
.sessions__item {
  background: #fafaf9;
  padding: 0.875rem 1rem;
  border-radius: 0.375rem;
  border-left: 3px solid #d6d3d1;
}
.dark .sessions__item { background: #292524; border-left-color: #57534e; }
.sessions__meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; gap: 0.625rem; }
.sessions__type {
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #57534e;
}
.dark .sessions__type { color: #a8a29e; }
.sessions__link { font-size: 0.8125rem; color: var(--color-blue-accent); text-decoration: none; }
.sessions__link:hover { text-decoration: underline; }
.sessions__link--plain { color: #a8a29e; }
.sessions__date { margin: 0; font-weight: 600; color: #1c1917; font-size: 0.9375rem; }
.dark .sessions__date { color: #fafaf9; }
.sessions__loc { margin: 0.125rem 0 0; font-size: 0.875rem; color: #57534e; }
.dark .sessions__loc { color: #d6d3d1; }
.sessions__virtual { margin: 0.125rem 0 0; font-size: 0.8125rem; color: #78716c; }
.dark .sessions__virtual { color: #a8a29e; }

/* RESOLUTIONS */
.res-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.res-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1rem;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.dark .res-card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.res-card:hover {
  border-color: var(--color-brand);
  box-shadow: 0 4px 12px rgb(185 28 28 / 0.08);
  transform: translateY(-1px);
}
.dark .res-card:hover { box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }
.res-card__head { display: flex; align-items: baseline; gap: 0.5rem; }
.res-card__id { font-family: ui-monospace, monospace; font-size: 0.8125rem; font-weight: 700; color: var(--color-brand); }
.res-card__kind {
  font-size: 0.6875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: #78716c;
}
.dark .res-card__kind { color: #a8a29e; }
.res-card__kind--acclamation {
  background: #6366f1; color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}
.res-card__title {
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1c1917;
  line-height: 1.4;
}
.dark .res-card__title { color: #fafaf9; }
.res-card:hover .res-card__title { color: var(--color-brand); }
.res-card__snippet {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.875rem;
  color: #57534e;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .res-card__snippet { color: #d6d3d1; }
.res-card__subject {
  font-size: 0.6875rem; font-weight: 600;
  color: #78716c;
  background: #f5f5f4;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 18rem;
}
.dark .res-card__subject { background: #292524; color: #d6d3d1; }
.res-card__arrow {
  font-size: 1.125rem;
  color: #d6d3d1;
  align-self: center;
  transition: transform 0.15s, color 0.15s;
}
.res-card:hover .res-card__arrow { color: var(--color-brand); transform: translateX(2px); }

@media (max-width: 640px) {
  .md-hero__stats { grid-template-columns: 1fr 1fr; }
  .schedule__item { grid-template-columns: 1fr; gap: 0.25rem; }
  .deadlines__item { grid-template-columns: 1fr; gap: 0.25rem; }
}
</style>
