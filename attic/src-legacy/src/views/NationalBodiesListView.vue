<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNationalBodies } from '../composables/useNationalBodies'
import { membershipLabel, type NationalBody } from '../types/organization'
import { nationalBodyPath } from '../utils/urn'
import PageHero from '../components/PageHero.vue'
import OrgLogo from '../components/OrgLogo.vue'

const { nationalBodies, isLoaded, loadData } = useNationalBodies()
const router = useRouter()

const searchQuery = ref('')
const selectedMembership = ref('')
const selectedStatus = ref<'all' | 'current' | 'former'>('all')

onMounted(() => { loadData() })

const memberships = computed(() => {
  const set = new Set<string>()
  for (const nb of nationalBodies.value) if (nb.membership) set.add(nb.membership)
  return Array.from(set).sort()
})

const currentBodies = computed<NationalBody[]>(() =>
  nationalBodies.value.filter(nb => !nb.former),
)

const formerBodies = computed<NationalBody[]>(() =>
  nationalBodies.value
    .filter(nb => nb.former)
    .sort((a, b) => ((Number(a.former_until) || 0) < (Number(b.former_until) || 0) ? 1 : -1)),
)

const stats = computed(() => ({
  total: nationalBodies.value.length,
  pMembers: currentBodies.value.filter(nb => nb.membership === 'P').length,
  oMembers: currentBodies.value.filter(nb => nb.membership === 'O').length,
  former: formerBodies.value.length,
}))

function applySearch(list: NationalBody[]): NationalBody[] {
  const q = searchQuery.value.trim().toLowerCase()
  return list
    .filter(nb => !selectedMembership.value || nb.membership === selectedMembership.value)
    .filter(nb => {
      if (!q) return true
      return `${nb.name} ${nb.short_name ?? ''} ${nb.country ?? ''}`.toLowerCase().includes(q)
    })
    .sort((a, b) => (a.country ?? a.name).localeCompare(b.country ?? b.name))
}

const filteredCurrent = computed(() => applySearch(currentBodies.value))
const filteredFormer = computed(() => applySearch(formerBodies.value))

const filteredCount = computed(() => {
  if (selectedStatus.value === 'current') return filteredCurrent.value.length
  if (selectedStatus.value === 'former') return filteredFormer.value.length
  return filteredCurrent.value.length + filteredFormer.value.length
})

const showCurrent = computed(() => selectedStatus.value !== 'former')
const showFormer = computed(() => selectedStatus.value !== 'current')

function bodyUrl(nb: NationalBody): string {
  return nationalBodyPath(nb.id)
}

function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}
</script>

<template>
  <div>
    <PageHero
      variant="index"
      bleed
      eyebrow="National member bodies"
      title="National Bodies"
      lead="National standards bodies that participate in ISO/TC 154 as Participating (P) or Observing (O) members."
    >
      <template #decoration>
        <div class="hero-pattern hero-pattern--dots hero-pattern--tr"></div>
      </template>
      <dl class="page__stats" v-if="isLoaded">
        <div><dt>{{ stats.pMembers }}</dt><dd>P-members</dd></div>
        <div><dt>{{ stats.oMembers }}</dt><dd>O-members</dd></div>
        <div><dt>{{ stats.former }}</dt><dd>former</dd></div>
        <div><dt>{{ stats.total }}</dt><dd>total</dd></div>
      </dl>
    </PageHero>

    <div class="page page--wide">
    <div class="filter">
      <div class="filter__search-wrap">
        <svg class="filter__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          v-model="searchQuery"
          class="filter__search"
          placeholder="Search by country or body name…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search national bodies"
        />
      </div>
      <div class="filter__controls">
        <div class="filter__field">
          <span class="filter__label">Membership</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedMembership === '' }" @click="selectedMembership = ''">All</button>
            <button v-for="m in memberships" :key="m"
              class="chip" :class="{ 'chip--active': selectedMembership === m }"
              @click="selectedMembership = m">{{ membershipLabel(m).short }} — {{ membershipLabel(m).long }}</button>
          </div>
        </div>
        <div class="filter__field">
          <span class="filter__label">Status</span>
          <div class="filter__chips">
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'all' }" @click="selectedStatus = 'all'">All</button>
            <button class="chip" :class="{ 'chip--active': selectedStatus === 'current' }" @click="selectedStatus = 'current'">Current</button>
            <button class="chip chip--former" :class="{ 'chip--active': selectedStatus === 'former' }" @click="selectedStatus = 'former'">Former</button>
          </div>
        </div>
      </div>
      <div class="filter__meta">
        <span>{{ filteredCount }} of {{ nationalBodies.length }} bodies</span>
      </div>
    </div>

    <div v-if="!isLoaded" class="loading">Loading national bodies…</div>
    <div v-else-if="filteredCount === 0" class="empty">
      <h3>No bodies match your filters</h3>
      <button class="chip" @click="searchQuery=''; selectedMembership=''; selectedStatus='all'">Clear filters</button>
    </div>

    <div v-else class="bodies">
      <section v-if="showCurrent && filteredCurrent.length" class="bodies__section">
        <header class="bodies__section-header">
          <h2 class="bodies__section-title">Current members</h2>
          <p class="bodies__section-meta">
            {{ filteredCurrent.length }} active {{ filteredCurrent.length === 1 ? 'body' : 'bodies' }}
          </p>
        </header>
        <ul class="grid">
          <li v-for="nb in filteredCurrent" :key="nb.id">
            <a :href="bodyUrl(nb)" class="card" @click.prevent="router.push(bodyUrl(nb))">
              <OrgLogo
                :logo="nb.logo"
                :logo_light="nb.logo_light"
                :logo_dark="nb.logo_dark"
                asset-prefix="/assets/images/national-bodies/"
                size="xl"
                radius="0.5rem"
                :fallback="flagEmoji(nb.iso_country_code) ? 'flag' : 'monogram'"
                :fallback-text="flagEmoji(nb.iso_country_code) || (nb.short_name ?? nb.name)"
                :alt="nb.short_name ?? nb.name"
              />
              <div class="card__body">
                <h3 class="card__name">
                  <span v-if="nb.short_name && nb.name && nb.short_name !== nb.name">{{ nb.name }} <span class="card__abbr">({{ nb.short_name }})</span></span>
                  <span v-else>{{ nb.name ?? nb.short_name }}</span>
                </h3>
                <p class="card__country">
                  <span v-if="nb.iso_country_code">{{ flagEmoji(nb.iso_country_code) }}</span>
                  {{ nb.country ?? nb.name }}
                </p>
                <span class="card__membership" :class="`card__membership--${nb.membership}`" :title="membershipLabel(nb.membership).long">{{ membershipLabel(nb.membership).short }}</span>
              </div>
            </a>
          </li>
        </ul>
      </section>

      <section v-if="showFormer && filteredFormer.length" class="bodies__section bodies__section--former">
        <header class="bodies__section-header">
          <h2 class="bodies__section-title bodies__section-title--former">Former members</h2>
          <p class="bodies__section-meta">
            {{ filteredFormer.length }} {{ filteredFormer.length === 1 ? 'body has' : 'bodies have' }} withdrawn from TC 154
          </p>
        </header>
        <ul class="grid">
          <li v-for="nb in filteredFormer" :key="nb.id">
            <a :href="bodyUrl(nb)" class="card card--former" @click.prevent="router.push(bodyUrl(nb))">
              <OrgLogo
                :logo="nb.logo"
                :logo_light="nb.logo_light"
                :logo_dark="nb.logo_dark"
                asset-prefix="/assets/images/national-bodies/"
                size="xl"
                radius="0.5rem"
                class="card__logo--former"
                :fallback="flagEmoji(nb.iso_country_code) ? 'flag' : 'monogram'"
                :fallback-text="flagEmoji(nb.iso_country_code) || (nb.short_name ?? nb.name)"
                :alt="nb.short_name ?? nb.name"
              />
              <div class="card__body">
                <div class="card__name-row">
                  <h3 class="card__name">
                    <span v-if="nb.short_name && nb.name && nb.short_name !== nb.name">{{ nb.name }} <span class="card__abbr">({{ nb.short_name }})</span></span>
                    <span v-else>{{ nb.name ?? nb.short_name }}</span>
                  </h3>
                  <span class="card__former-badge">Former</span>
                </div>
                <p class="card__country">
                  <span v-if="nb.iso_country_code">{{ flagEmoji(nb.iso_country_code) }}</span>
                  {{ nb.country ?? nb.name }}
                </p>
                <p v-if="nb.former_until" class="card__former-until">Member until {{ nb.former_until }}</p>
              </div>
            </a>
          </li>
        </ul>
      </section>
    </div>
    </div>
  </div>
</template>

<style scoped>

.filter { background: #fff; border: 1px solid #e7e5e4; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 2rem; }
.dark .filter { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.filter__search-wrap { position: relative; margin-bottom: 1rem; }
.filter__search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #a8a29e; pointer-events: none; }
.filter__search { width: 100%; padding: 0.625rem 0.875rem 0.625rem 2.25rem; border-radius: 0.5rem; border: 1px solid #d6d3d1; background: #fafaf9; color: #1c1917; font-size: 0.9375rem; font-family: inherit; }
.filter__search:focus { outline: none; border-color: var(--color-blue-accent); background: #fff; box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15); }
.dark .filter__search { background: #292524; border-color: #57534e; color: #fafaf9; }
.dark .filter__search:focus { border-color: #5379bf; background: #1c1917; }
.filter__controls { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-end; }
.filter__field { display: flex; flex-direction: column; gap: 0.5rem; }
.filter__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; }
.dark .filter__label { color: #a8a29e; }
.filter__chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip { display: inline-flex; align-items: center; padding: 0.375rem 0.75rem; border-radius: 9999px; border: 1px solid #d6d3d1; background: #fff; color: #57534e; font-size: 0.8125rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.chip:hover { border-color: var(--color-blue-accent); color: var(--color-blue-accent); }
.chip--active { background: var(--color-blue-accent); border-color: var(--color-blue-accent); color: #fff; }
.dark .chip { background: #292524; border-color: #57534e; color: #d6d3d1; }
.dark .chip:hover { border-color: #5379bf; }
.dark .chip--active { background: #5379bf; border-color: #5379bf; color: #fff; }
.filter__meta { margin-top: 1rem; font-size: 0.875rem; color: #78716c; }
.dark .filter__meta { color: #a8a29e; }

.loading, .empty { padding: 3rem 1rem; text-align: center; color: #78716c; }
.empty h3 { color: #1c1917; margin: 0 0 0.75rem; }
.dark .empty h3 { color: #fafaf9; }
.dark .loading, .dark .empty { color: #a8a29e; }

.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.75rem; }
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.card { display: flex; gap: 1rem; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e7e5e4; background: #fff; text-decoration: none; color: inherit; transition: all 0.2s; height: 100%; }
.dark .card { background: rgb(15 23 42 / 0.5); border-color: #44403c; }
.card:hover { border-color: var(--color-blue-accent); box-shadow: 0 4px 12px rgb(30 58 138 / 0.08); transform: translateY(-2px); }
.dark .card:hover { border-color: #5379bf; box-shadow: 0 4px 12px rgb(0 0 0 / 0.25); }

.card__body { flex: 1; min-width: 0; }
.card__name { font-size: 1rem; font-weight: 600; color: #1c1917; margin: 0 0 0.125rem; }
.dark .card__name { color: #fafaf9; }
.card__abbr {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #57534e;
  letter-spacing: 0;
  white-space: nowrap;
}
.dark .card__abbr { color: #a8a29e; }
.card__country { font-size: 0.8125rem; color: #78716c; margin: 0 0 0.5rem; }
.dark .card__country { color: #a8a29e; }
.card__membership { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; }
.card__membership--P { background: rgb(16 185 129 / 0.15); color: #047857; }
.dark .card__membership--P { background: rgb(16 185 129 / 0.2); color: #6ee7b7; }
.card__membership--O { background: #f5f5f4; color: #78716c; }
.dark .card__membership--O { background: #292524; color: #a8a29e; }

/* SECTIONS */
.bodies { display: flex; flex-direction: column; gap: 3rem; }
.bodies__section { display: flex; flex-direction: column; gap: 1rem; }
.bodies__section-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .bodies__section-header { border-bottom-color: #44403c; }
.bodies__section-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #1c1917;
  margin: 0;
  letter-spacing: -0.01em;
}
.dark .bodies__section-title { color: #fafaf9; }
.bodies__section-title--former { color: #78716c; }
.dark .bodies__section-title--former { color: #a8a29e; }
.bodies__section-meta {
  font-size: 0.875rem;
  color: #78716c;
  margin: 0;
}
.dark .bodies__section-meta { color: #a8a29e; }

/* FORMER CARD */
.card--former {
  background: #fafaf9;
  border-style: dashed;
  border-color: #d6d3d1;
}
.dark .card--former { background: rgb(28 25 23 / 0.4); border-color: #57534e; }
.card--former:hover {
  border-color: #78716c;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.04);
  transform: translateY(-1px);
}
.dark .card--former:hover { border-color: #78716c; }
.card__logo--former { filter: grayscale(0.8); opacity: 0.7; }
.card__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0 0 0.125rem;
}
.card__name-row .card__name { margin: 0; }
.card__former-badge {
  display: inline-block;
  padding: 0.0625rem 0.4375rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 0.1875rem;
  background: #fee2e2;
  color: #991b1b;
}
.dark .card__former-badge { background: rgb(185 28 28 / 0.2); color: #fca5a5; }
.card__former-until {
  font-size: 0.75rem;
  color: #78716c;
  margin: 0.25rem 0 0;
  font-style: italic;
}
.dark .card__former-until { color: #a8a29e; }

/* FORMER filter chip variant */
.chip--former.active,
.chip--former.chip--active {
  background: #78716c;
  border-color: #78716c;
  color: #fff;
}
.dark .chip--former.chip--active { background: #57534e; border-color: #57534e; }
</style>
