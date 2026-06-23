<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { committee } from '../data/committee'
import { useStandards } from '../composables/useStandards'
import { useGroups } from '../composables/useGroups'
import { useMembers } from '../composables/useMembers'
import { useCountUp } from '../composables/useCountUp'
import PageHero from '../components/PageHero.vue'

const standardsStore = useStandards()
const groupsStore = useGroups()
const membersStore = useMembers()

onMounted(() => {
  standardsStore.loadData()
  groupsStore.loadData()
  membersStore.loadData()
})

const statsRef = useTemplateRef<HTMLElement>('statsRef')
const statsReady = ref(false)

const membersCount = useCountUp(committee.totalMembers, statsReady)
const groupsCount = useCountUp(committee.activeGroups, statsReady)
const plenariesCount = useCountUp(45, statsReady)
const establishedYear = committee.established

onMounted(() => {
  const el = statsRef.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    statsReady.value = true
    return
  }
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          statsReady.value = true
          obs.disconnect()
        }
      }
    },
    { threshold: 0.25 },
  )
  obs.observe(el)
})

// Pull live totals when available; fall back to committee.ts constants.
const publishedCount = computed(() => {
  const list = standardsStore.all()
  if (!list.length) return committee.publishedStandards
  return list.filter((s) => {
    const stage = s.iso?.stage ?? ''
    const status = s.tc154?.status ?? ''
    return status === 'published' || /^60/.test(stage) || /^9[0-4]/.test(stage)
  }).length || committee.publishedStandards
})

// Concrete artifacts TC 154 has authored — provenance, not decoration.
const specimens = [
  {
    tag: 'ISO 8601',
    artifact: '2026-06-21T14:32:07+08:00',
    caption: 'The format every timestamp in your logs, every database row, every API response is required to use. Without it, no two systems could agree on when anything happened.',
    href: '/standards/iso-8601-1-2019/',
  },
  {
    tag: 'ISO 9735 (EDIFACT)',
    artifact: 'UNH+1+INVOIC:D:97B:UN',
    caption: 'The header segment that opens every electronic invoice, customs declaration, and order message crossing borders under the UN/EDIFACT syntax.',
    href: '/standards/iso-9735-1988/',
  },
  {
    tag: 'ISO 7372 (TDED)',
    artifact: '1004  Document message date',
    caption: 'A data element tag from the United Nations Trade Data Elements Directory — the controlled vocabulary every customs and trade system reads from.',
    href: '/standards/iso-7372-2005/',
  },
]

const scopeQuadrants = [
  {
    n: '01',
    label: 'Processes',
    body: 'Standardisation and registration of business and administration processes used for information interchange between and within organisations.',
    items: ['Process identification', 'Process specification'],
  },
  {
    n: '02',
    label: 'Data elements',
    body: 'The universal trade vocabulary — TDED (ISO 7372) — maintained jointly with UN/CEFACT. Every data field in a cross-border document traces back to a registered tag.',
    items: ['Data identification', 'Data specification with content'],
  },
  {
    n: '03',
    label: 'Documents',
    body: 'Layout keys and forms that paper and electronic trade documents have shared since the 1970s — still the backbone of customs and commercial paperwork.',
    items: ['Forms layout (paper / electronic)', 'Location of codes in trade documents'],
  },
  {
    n: '04',
    label: 'Syntax',
    body: 'Custodian of the EDIFACT syntax (ISO 9735) — the grammar that lets trading partners parse each other\'s messages without bilateral agreements.',
    items: ['EDIFACT application level syntax', 'Maintenance and versioning'],
  },
]

const marqueeStandards = [
  {
    num: 'ISO 8601',
    title: 'Date and time representations',
    powers: 'Every system clock, every API timestamp, every calendar application. Without it, no two computers could agree on when anything happened.',
    href: '/standards/iso-8601-1-2019/',
    pillar: 'Time',
  },
  {
    num: 'ISO 9735',
    title: 'EDIFACT — Application level syntax rules',
    powers: 'The grammar of B2B messaging. Every electronic invoice, customs declaration, and order message crossing a border under UN/EDIFACT speaks this syntax.',
    href: '/standards/iso-9735-1988/',
    pillar: 'Syntax',
  },
  {
    num: 'ISO 7372',
    title: 'Trade Data Elements Directory (TDED)',
    powers: 'The controlled vocabulary of trade data — every data element tag a customs system reads. Maintained jointly with UN/CEFACT as UNTDED.',
    href: '/standards/iso-7372-2005/',
    pillar: 'Data',
  },
  {
    num: 'ISO 14533',
    title: 'Long-term signature profiles',
    powers: 'Signature profiles (CAdES, XAdES, PAdES) that remain verifiable long after their original cryptography has weakened — the foundation of durable digital trust.',
    href: '/standards/iso-14533-1-2022/',
    pillar: 'Trust',
  },
  {
    num: 'ISO 15000',
    title: 'ebXML messaging and registry',
    powers: 'The backbone of SOAP-era electronic business interoperability, jointly developed with UN/CEFACT. Still runs critical logistics and government integrations.',
    href: '/standards/iso-15000-1-2021/',
    pillar: 'Transport',
  },
  {
    num: 'ISO 6422',
    title: 'Layout key for trade documents',
    powers: 'The UN Layout Key — the master template every paper and electronic trade document has followed since 1985. Co-authored with UNECE.',
    href: '/standards/iso-6422-1985/',
    pillar: 'Documents',
  },
  {
    num: 'ISO 8439',
    title: 'Forms design — Basic layout',
    powers: 'The geometric rules for official forms — margin widths, field placement, alignment zones — so a form printed in one country scans cleanly in another.',
    href: '/standards/iso-8439-1990/',
    pillar: 'Documents',
  },
  {
    num: 'ISO 8440',
    title: 'Location of codes in trade documents',
    powers: 'Where on a trade document the magic codes go — so customs agents the world over know exactly where to look. Pre-dates the barcode.',
    href: '/standards/iso-8440-1986/',
    pillar: 'Documents',
  },
]

// Three secretariats over five decades — a continuous chain of institutional stewardship.
const secretariats = [
  {
    period: '1972 — 2008',
    org: 'SNV',
    full: 'Swiss Association for Standardization',
    city: 'Zurich / Winterthur',
    country: 'Switzerland',
    note: 'Founding secretariat. Held the committee through its founding decade, the consolidation of the date/time standards into ISO 8601, and the original UN/EDIFACT syntax work.',
    chair: 'François Vuilleumier',
    chairRole: 'Chair and Committee Manager (1998 – 2008)',
    chairHref: '/members/francois-vuilleumier/',
  },
  {
    period: '2008 — 2014',
    org: 'NEN',
    full: 'Royal Netherlands Standardization Institute',
    city: 'Delft',
    country: 'Netherlands',
    note: 'A six-year Dutch interlude. Three successive committee managers supported two GS1- and DIN-affiliated chairs through the EDIFACT syntax revision era.',
    chair: 'Klaus-Dieter Naujok',
    chairRole: 'Chair (2011 – 2017, spanning the SAC handover)',
    chairHref: '/members/klaus-dieter-naujok/',
  },
  {
    period: '2014 — now',
    org: 'SAC',
    full: 'Standardization Administration of China',
    city: 'Beijing (hosted at CNIS)',
    country: 'China',
    note: 'Current secretariat, hosted at the China National Institute of Standards (CNIS). Three successive SAC-affiliated chairs; anchored by Committee Manager Jianfang Zhang since 2014.',
    chair: 'Ms. Pan Wei',
    chairRole: 'Chair and convenor of the CAG (2026 –)',
    chairHref: '/members/pan-wei/',
    current: true,
  },
]

const involvement = [
  {
    label: 'Browse the catalogue',
    blurb: 'Every published standard and every work item in development, with ISO stage codes and ISO Store links.',
    to: '/standards/',
    cta: 'See all standards →',
  },
  {
    label: 'Read every resolution',
    blurb: 'A complete, searchable record of every decision the committee has ever made — from the most recent plenary back to the founding decade.',
    to: '/resolutions/',
    cta: 'Open the archive →',
  },
  {
    label: 'Find your national body',
    blurb: 'ISO/TC 154 is shaped by 47 national bodies. Find yours and learn how your country participates (P-member or observer).',
    to: '/national-bodies/',
    cta: 'See member bodies →',
  },
  {
    label: 'Contact the secretariat',
    blurb: 'Questions about participation, liaisons, or reproducing committee content? Reach the SAC secretariat at CNIS.',
    to: '/contact/',
    cta: 'Get in touch →',
  },
]
</script>

<template>
  <div>
    <!-- ─── 1. HERO ─────────────────────────────────────────── -->
    <PageHero
      variant="landing"
      bleed
      :eyebrow="`About the committee · since ${establishedYear}`"
      lead="From the timestamp on your last transaction to the syntax of every cross-border invoice — from the data tags customs agents scan to the signatures that have to hold up in court decades from now — ISO/TC 154 is where the world agrees on the format."
    >
      <template #decoration>
        <div class="hero__orbit"></div>
        <div class="hero__orbit hero__orbit--2"></div>
        <div class="hero__marquee">
          <span>ISO 8601</span>
          <span>ISO 9735</span>
          <span>ISO 7372</span>
          <span>ISO 14533</span>
          <span>ISO 15000</span>
          <span>ISO 6422</span>
          <span>ISO 8439</span>
          <span>ISO 8440</span>
          <span>ISO 8601</span>
          <span>ISO 9735</span>
          <span>ISO 7372</span>
          <span>ISO 14533</span>
        </div>
      </template>
      <template #title>
        For five decades, the rules behind
        <span class="ph__accent">every electronic handshake</span>
        in global trade have been written here.
      </template>
      <template #actions>
        <RouterLink to="/standards/" class="hero__cta hero__cta--primary">
          Browse the catalogue
          <span aria-hidden="true">→</span>
        </RouterLink>
        <RouterLink to="/history/" class="hero__cta hero__cta--secondary">
          See the five-decade story
        </RouterLink>
      </template>
    </PageHero>

    <div class="about">
    <!-- ─── 2. STATS ────────────────────────────────────────── -->
    <section id="stats" ref="statsRef" class="stats">
      <div class="stats__inner">
        <div class="stats__cell">
          <span class="stats__value">{{ establishedYear }}</span>
          <span class="stats__label">Founded</span>
          <span class="stats__caption">By ISO Council; first plenary in Stockholm, 1973.</span>
        </div>
        <div class="stats__cell">
          <span class="stats__value">{{ publishedCount }}</span>
          <span class="stats__label">Published standards</span>
          <span class="stats__caption">Currently maintained by the committee.</span>
        </div>
        <div class="stats__cell">
          <span class="stats__value">{{ groupsCount }}</span>
          <span class="stats__label">Active groups</span>
          <span class="stats__caption">Working groups, advisory groups, and joint groups.</span>
        </div>
        <div class="stats__cell">
          <span class="stats__value">{{ membersCount }}</span>
          <span class="stats__label">Member bodies</span>
          <span class="stats__caption">21 P-members and 26 observers across five continents.</span>
        </div>
        <div class="stats__cell">
          <span class="stats__value">{{ plenariesCount }}</span>
          <span class="stats__label">Plenary meetings</span>
          <span class="stats__caption">Across Europe, North America, and Asia since 1973.</span>
        </div>
        <div class="stats__cell">
          <span class="stats__value">3</span>
          <span class="stats__label">Secretariats</span>
          <span class="stats__caption">SNV → NEN → SAC. A continuous institutional chain.</span>
        </div>
      </div>
    </section>

    <!-- ─── 3. SPECIMENS ────────────────────────────────────── -->
    <section class="specimens">
      <div class="section-head">
        <p class="section-eyebrow">— What that means, concretely</p>
        <h2 class="section-title">
          Three artifacts
          <span class="section-accent">already in your life.</span>
        </h2>
        <p class="section-lead">
          ISO/TC 154 standards are not abstract documents on a shelf. They are
          the strings your systems already parse, the tags your customs forms
          already carry, the timestamps your database already stores. You have
          been using our work for years.
        </p>
      </div>

      <ol class="specimens__grid" role="list">
        <li v-for="(s, i) in specimens" :key="s.tag" class="specimen">
          <div class="specimen__case">
            <span class="specimen__index">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="specimen__stage">
              <code class="specimen__artifact">{{ s.artifact }}</code>
            </div>
            <span class="specimen__tag">{{ s.tag }}</span>
          </div>
          <p class="specimen__caption">{{ s.caption }}</p>
          <RouterLink :to="s.href" class="specimen__link">Read the standard →</RouterLink>
        </li>
      </ol>
    </section>

    <!-- ─── 4. MISSION & VISION ─────────────────────────────── -->
    <section class="mandate">
      <div class="section-head">
        <p class="section-eyebrow">— Why we exist</p>
        <h2 class="section-title">
          A common language is
          <span class="section-accent">infrastructure.</span>
        </h2>
      </div>

      <div class="mandate__grid">
        <article class="mandate__col">
          <header class="mandate__head">
            <span class="mandate__icon" aria-hidden="true">◐</span>
            <h3 class="mandate__heading">Vision</h3>
          </header>
          <blockquote class="mandate__quote">
            All parties in the supply and value chain use standardised data
            exchange to reduce the cost of managing processes in the private
            and public domain, and to foster trade facilitation.
          </blockquote>
        </article>

        <article class="mandate__col">
          <header class="mandate__head">
            <span class="mandate__icon" aria-hidden="true">◑</span>
            <h3 class="mandate__heading">Mission</h3>
          </header>
          <blockquote class="mandate__quote">
            To undertake and to facilitate the development and maintenance of
            international standards for electronic business in the supply and
            value chain — regardless of the media used.
          </blockquote>
        </article>
      </div>

      <p class="mandate__note">
        Wherever possible, ISO/TC 154 fosters harmonisation between and within
        international standards development organisations — particularly through
        the Memorandum of Understanding between
        <abbr title="International Electrotechnical Commission">IEC</abbr>,
        <abbr title="International Organization for Standardization">ISO</abbr>,
        <abbr title="International Telecommunication Union">ITU</abbr>, and
        <abbr title="United Nations Economic Commission for Europe">UNECE</abbr>
        concerning standardisation in the field of electronic business.
      </p>
    </section>

    <!-- ─── 5. SCOPE ────────────────────────────────────────── -->
    <section class="scope">
      <div class="section-head">
        <p class="section-eyebrow">— What we cover</p>
        <h2 class="section-title">
          Four pillars,
          <span class="section-accent">one committee.</span>
        </h2>
        <p class="section-lead">
          The official scope — international standardisation and registration
          of business, administration, and supporting data used for information
          interchange — resolves in practice into four interlocking domains.
        </p>
      </div>

      <ol class="scope__grid" role="list">
        <li v-for="q in scopeQuadrants" :key="q.n" class="quadrant">
          <span class="quadrant__n">{{ q.n }}</span>
          <h3 class="quadrant__label">{{ q.label }}</h3>
          <p class="quadrant__body">{{ q.body }}</p>
          <ul class="quadrant__items">
            <li v-for="item in q.items" :key="item">{{ item }}</li>
          </ul>
        </li>
      </ol>
    </section>

    <!-- ─── 6. STANDARDS WE STEWARD ─────────────────────────── -->
    <section class="marquee">
      <div class="section-head">
        <p class="section-eyebrow">— The portfolio</p>
        <h2 class="section-title">
          Eight standards
          <span class="section-accent">that hold up the world.</span>
        </h2>
        <p class="section-lead">
          ISO/TC 154 has published over 40 international standards. These eight
          are the load-bearing ones — the ones whose absence would break
          something billions of systems rely on tomorrow.
        </p>
      </div>

      <ul class="marquee__grid" role="list">
        <li v-for="s in marqueeStandards" :key="s.num" class="standard">
          <RouterLink :to="s.href" class="standard__link">
            <div class="standard__head">
              <span class="standard__pillar">{{ s.pillar }}</span>
              <span class="standard__num">{{ s.num }}</span>
            </div>
            <h3 class="standard__title">{{ s.title }}</h3>
            <p class="standard__powers">{{ s.powers }}</p>
            <span class="standard__arrow" aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>

      <div class="marquee__more">
        <RouterLink to="/standards/" class="more-link">
          See all {{ publishedCount }}+ standards in the catalogue
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>

    <!-- ─── 7. STRUCTURE & THREE SECRETARIATS ───────────────── -->
    <section class="structure">
      <div class="section-head">
        <p class="section-eyebrow">— How we are organised</p>
        <h2 class="section-title">
          A continuous chain of
          <span class="section-accent">institutional stewardship.</span>
        </h2>
        <p class="section-lead">
          ISO/TC 154 is chaired by Ms. Pan Wei (SAC) and managed by
          Jianfang Zhang (SAC/CNIS), supported by {{ groupsCount }} active
          working groups. The secretariat has changed hands three times in
          five decades — each transition a deliberate, peer-reviewed handover.
        </p>
      </div>

      <div class="structure__leadership">
        <article class="leader">
          <span class="leader__role">Chair</span>
          <h3 class="leader__name">Ms. Pan Wei</h3>
          <p class="leader__aff">SAC, China · Chair and convenor of the CAG since January 2026.</p>
          <RouterLink to="/members/pan-wei/" class="leader__link">Profile →</RouterLink>
        </article>
        <article class="leader">
          <span class="leader__role">Committee Manager</span>
          <h3 class="leader__name">Jianfang Zhang</h3>
          <p class="leader__aff">SAC, China · CNIS. Anchoring the secretariat since 2014.</p>
          <RouterLink to="/members/jianfang-zhang/" class="leader__link">Profile →</RouterLink>
        </article>
        <article class="leader">
          <span class="leader__role">Working groups</span>
          <h3 class="leader__name">{{ groupsCount }} active</h3>
          <p class="leader__aff">WG 5 (Date and time), JWG 1 (EDIFACT syntax), WG 6 (Trusted eComms), WG 7 (Digital Business), JWG 9 (Smart Trade), and more.</p>
          <RouterLink to="/groups/" class="leader__link">All groups →</RouterLink>
        </article>
      </div>

      <ol class="secretariats" role="list">
        <li v-for="(s, i) in secretariats" :key="s.org" class="secretariat" :class="{ 'secretariat--current': s.current }">
          <div class="secretariat__rail" aria-hidden="true">
            <span class="secretariat__node"></span>
            <span v-if="i < secretariats.length - 1" class="secretariat__stem"></span>
          </div>
          <article class="secretariat__card">
            <header class="secretariat__head">
              <span class="secretariat__period">{{ s.period }}</span>
              <span v-if="s.current" class="secretariat__badge">Current</span>
            </header>
            <h3 class="secretariat__org">
              {{ s.org }}
              <span class="secretariat__country">· {{ s.country }}</span>
            </h3>
            <p class="secretariat__full">{{ s.full }} — {{ s.city }}</p>
            <p class="secretariat__note">{{ s.note }}</p>
            <footer class="secretariat__foot">
              <RouterLink :to="s.chairHref" class="secretariat__chair">{{ s.chair }}</RouterLink>
              <span class="secretariat__role">{{ s.chairRole }}</span>
            </footer>
          </article>
        </li>
      </ol>

      <p class="structure__continuity">
        The committee's institutional memory passes from secretariat to
        secretariat through overlapping committee managers and shared working
        group convenors — most rules in force today trace back through all
        three stewards. The full chronology is on the
        <RouterLink to="/history/">history page</RouterLink>.
      </p>
    </section>

    <!-- ─── 8. GET INVOLVED ─────────────────────────────────── -->
    <section class="involve">
      <div class="section-head">
        <p class="section-eyebrow">— Get involved</p>
        <h2 class="section-title">
          The committee is open,
          <span class="section-accent">by design.</span>
        </h2>
        <p class="section-lead">
          ISO/TC 154 is built on consensus across national bodies, liaison
          organisations, and individual experts. There are several ways to
          participate — pick the one that fits you.
        </p>
      </div>

      <ul class="involve__grid" role="list">
        <li v-for="i in involvement" :key="i.to">
          <RouterLink :to="i.to" class="involve__card">
            <h3 class="involve__label">{{ i.label }}</h3>
            <p class="involve__blurb">{{ i.blurb }}</p>
            <span class="involve__cta">{{ i.cta }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 6rem;
}

/* ─── HERO decoration (orbits + marquee, layered behind PageHero) ─── */
.hero__orbit,
.hero__orbit--2 {
  position: absolute;
  border-radius: 50%;
  filter: blur(0.5px);
}
.hero__orbit {
  width: 34rem;
  height: 34rem;
  right: -12rem;
  top: -12rem;
  border: 1px solid rgb(30 58 138 / 0.15);
}
.hero__orbit--2 {
  width: 22rem;
  height: 22rem;
  right: -4rem;
  top: -4rem;
  border: 1px dashed rgb(185 28 28 / 0.15);
}
.dark .hero__orbit { border-color: rgb(148 182 232 / 0.15); }
.dark .hero__orbit--2 { border-color: rgb(248 113 113 / 0.15); }

.hero__marquee {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 2.5rem;
  white-space: nowrap;
  overflow: hidden;
  opacity: 0.4;
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  animation: marquee 60s linear infinite;
}
.dark .hero__marquee { opacity: 0.25; }
.hero__marquee span {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
  font-style: italic;
}
@keyframes marquee {
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .hero__marquee { animation: none; opacity: 0.25; }
}

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
.hero__cta--primary span { transition: transform 0.2s; }
.hero__cta--primary:hover span { transform: translateX(4px); }
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

/* ─── STATS ──────────────────────────────────────────────── */
.stats {
  padding: 3rem 0;
  border-top: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
  margin-bottom: 5rem;
}
.dark .stats { border-top-color: #292524; border-bottom-color: #292524; }
.stats__inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
}
@media (min-width: 768px) { .stats__inner { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1100px) { .stats__inner { grid-template-columns: repeat(6, 1fr); } }
.stats__cell {
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid #e7e5e4;
}
@media (min-width: 768px) {
  .stats__cell { border-right: 1px solid #e7e5e4; }
  .stats__cell:nth-child(3n) { border-right: none; }
}
@media (min-width: 1100px) {
  .stats__cell:nth-child(3n) { border-right: 1px solid #e7e5e4; }
  .stats__cell:nth-child(6n) { border-right: none; }
  .stats__cell:nth-last-child(-n+3) { border-bottom: none; }
}
.dark .stats__cell { border-color: #292524; }

.stats__value {
  display: block;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
  font-variation-settings: 'opsz' 144;
}
.stats__label {
  display: block;
  margin-top: 0.625rem;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #1c1917;
}
.dark .stats__label { color: #fafaf9; }
.stats__caption {
  display: block;
  margin-top: 0.375rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.8125rem;
  color: #78716c;
  line-height: 1.45;
}
.dark .stats__caption { color: #a8a29e; }

/* ─── SECTION HEAD ───────────────────────────────────────── */
.section-head {
  max-width: 48rem;
  margin-bottom: 3rem;
}
.section-eyebrow {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #78716c;
  margin: 0 0 0.875rem;
}
.dark .section-eyebrow { color: #a8a29e; }
.section-title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: clamp(1.625rem, 3vw, 2.5rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: #1c1917;
  margin: 0 0 1rem;
  font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 1;
}
.dark .section-title { color: #fafaf9; }
.section-accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-brand);
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
}
.section-lead {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.65;
  color: #44403c;
  margin: 0;
}
.dark .section-lead { color: #d6d3d1; }

/* ─── SPECIMENS ──────────────────────────────────────────── */
.specimens {
  padding: 5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .specimens { border-bottom-color: #292524; }
.specimens__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .specimens__grid { grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
}
.specimen {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.5rem;
}
.specimen__case {
  position: relative;
  border: 1px solid #d6d3d1;
  background: linear-gradient(180deg, #fafaf9, #fff);
  padding: 3rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s;
}
.specimen__case::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-brand);
  opacity: 0.85;
}
.dark .specimen__case {
  border-color: #44403c;
  background: linear-gradient(180deg, rgb(35 35 32 / 0.6), rgb(28 25 23 / 0.9));
}
.specimen:hover .specimen__case {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.08);
}
.specimen__index {
  position: absolute;
  top: 0.75rem;
  left: 0.875rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.75rem;
  font-weight: 700;
  color: #a8a29e;
  font-variant-numeric: tabular-nums;
}
.dark .specimen__index { color: #78716c; }
.specimen__stage {
  width: 100%;
  padding: 1.5rem 0;
  border-top: 1px dashed #e7e5e4;
  border-bottom: 1px dashed #e7e5e4;
  margin-bottom: 0.5rem;
}
.dark .specimen__stage { border-color: #44403c; }
.specimen__artifact {
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: clamp(0.75rem, 1.4vw, 0.9375rem);
  font-weight: 600;
  color: var(--color-brand);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
}
.specimen__tag {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #b91c1c;
}
.dark .specimen__tag { color: #f87171; }
.specimen__caption {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #44403c;
  margin: 0;
  flex-grow: 1;
}
.dark .specimen__caption { color: #d6d3d1; }
.specimen__link {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-brand);
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
  align-self: flex-start;
}
.specimen__link:hover { border-bottom-color: currentColor; }

/* ─── MANDATE ────────────────────────────────────────────── */
.mandate {
  padding: 5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .mandate { border-bottom-color: #292524; }
.mandate__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-bottom: 2.5rem;
  border-top: 1px solid #e7e5e4;
}
@media (min-width: 768px) { .mandate__grid { grid-template-columns: 1fr 1fr; } }
.dark .mandate__grid { border-top-color: #44403c; }
.mandate__col {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid #e7e5e4;
  position: relative;
}
@media (min-width: 768px) {
  .mandate__col:first-child { border-right: 1px solid #e7e5e4; }
}
.dark .mandate__col { border-bottom-color: #44403c; border-right-color: #44403c; }
.mandate__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.mandate__icon {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-brand);
  line-height: 1;
}
.mandate__heading {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #1c1917;
  margin: 0;
}
.dark .mandate__heading { color: #fafaf9; }
.mandate__quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(1.0625rem, 1.6vw, 1.3125rem);
  line-height: 1.5;
  color: #1c1917;
  margin: 0;
  font-variation-settings: 'opsz' 144, 'SOFT' 50;
  quotes: none;
}
.dark .mandate__quote { color: #fafaf9; }
.mandate__note {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #57534e;
  max-width: 56rem;
  margin: 0;
}
.dark .mandate__note { color: #b8b3a9; }
.mandate__note abbr {
  cursor: help;
  border-bottom: 1px dotted #a8a29e;
}

/* ─── SCOPE ──────────────────────────────────────────────── */
.scope {
  padding: 5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .scope { border-bottom-color: #292524; }
.scope__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .scope__grid { border-top-color: #44403c; }
@media (min-width: 768px) { .scope__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .scope__grid { grid-template-columns: repeat(4, 1fr); } }

.quadrant {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid #e7e5e4;
  border-right: 1px solid #e7e5e4;
  position: relative;
  transition: background 0.2s;
}
.quadrant:hover { background: rgb(30 58 138 / 0.025); }
.dark .quadrant:hover { background: rgb(148 182 232 / 0.04); }
@media (min-width: 768px) {
  .quadrant:nth-child(2n) { border-right: none; }
}
@media (min-width: 1100px) {
  .quadrant:nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .quadrant:nth-child(4n) { border-right: none; }
}
.dark .quadrant { border-bottom-color: #44403c; border-right-color: #44403c; }

.quadrant__n {
  display: block;
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 700;
  font-style: italic;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.875rem;
}
.quadrant__label {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: -0.015em;
  color: #1c1917;
  margin: 0 0 0.75rem;
  line-height: 1.1;
}
.dark .quadrant__label { color: #fafaf9; }
.quadrant__body {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #44403c;
  margin: 0 0 1rem;
}
.dark .quadrant__body { color: #d6d3d1; }
.quadrant__items {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: #78716c;
}
.dark .quadrant__items { color: #a8a29e; }
.quadrant__items li {
  padding: 0.375rem 0;
  border-top: 1px dashed #e7e5e4;
}
.dark .quadrant__items li { border-top-color: #44403c; }
.quadrant__items li::before {
  content: '+ ';
  color: var(--color-brand);
  font-weight: 700;
}

/* ─── MARQUEE STANDARDS ──────────────────────────────────── */
.marquee {
  padding: 5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .marquee { border-bottom-color: #292524; }
.marquee__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .marquee__grid { border-top-color: #44403c; }
@media (min-width: 640px) { .marquee__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .marquee__grid { grid-template-columns: repeat(4, 1fr); } }

.standard {
  border-right: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
}
@media (min-width: 640px) {
  .standard:nth-child(2n) { border-right: none; }
}
@media (min-width: 1100px) {
  .standard:nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .standard:nth-child(4n) { border-right: none; }
}
.dark .standard { border-color: #44403c; }
.standard__link {
  display: block;
  position: relative;
  padding: 1.75rem 1.5rem 1.75rem;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
  height: 100%;
}
.standard__link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--color-brand);
  transition: width 0.2s;
}
.standard__link:hover { background: rgb(185 28 28 / 0.025); }
.standard__link:hover::before { width: 3px; }
.dark .standard__link:hover { background: rgb(248 113 113 / 0.05); }
.standard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.standard__pillar {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #b91c1c;
  background: rgb(185 28 28 / 0.08);
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
}
.dark .standard__pillar {
  color: #f87171;
  background: rgb(248 113 113 / 0.12);
}
.standard__num {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
}

.standard__title {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.012em;
  color: #1c1917;
  margin: 0 0 0.625rem;
}
.dark .standard__title { color: #fafaf9; }
.standard__powers {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.55;
  color: #57534e;
  margin: 0;
}
.dark .standard__powers { color: #d6d3d1; }
.standard__arrow {
  display: inline-block;
  margin-top: 1rem;
  font-family: var(--font-sans);
  color: #78716c;
  font-size: 0.875rem;
  transition: transform 0.2s, color 0.2s;
}
.standard__link:hover .standard__arrow {
  color: var(--color-brand);
  transform: translateX(4px);
}
.dark .standard__arrow { color: #a8a29e; }

.marquee__more {
  margin-top: 2.5rem;
  text-align: center;
}
.more-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--color-brand);
  border: 1px solid var(--color-brand);
  transition: all 0.2s;
}
.more-link:hover {
  background: var(--color-brand-fill);
  color: #fff;
}
.dark .more-link:hover { background: var(--color-brand-fill); color: #fff; }

/* ─── STRUCTURE & SECRETARIATS ───────────────────────────── */
.structure {
  padding: 5rem 0;
  border-bottom: 1px solid #e7e5e4;
}
.dark .structure { border-bottom-color: #292524; }

.structure__leadership {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-bottom: 4rem;
  border-top: 1px solid #e7e5e4;
}
.dark .structure__leadership { border-top-color: #44403c; }
@media (min-width: 768px) { .structure__leadership { grid-template-columns: repeat(3, 1fr); } }
.leader {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid #e7e5e4;
  border-right: 1px solid #e7e5e4;
}
@media (min-width: 768px) {
  .leader:last-child { border-right: none; }
}
.dark .leader { border-color: #44403c; }
.leader__role {
  display: block;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #b91c1c;
  margin-bottom: 0.5rem;
}
.dark .leader__role { color: #f87171; }
.leader__name {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 2.5vw, 1.875rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1c1917;
  margin: 0 0 0.625rem;
  line-height: 1.1;
}
.dark .leader__name { color: #fafaf9; }
.leader__aff {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #57534e;
  margin: 0 0 1rem;
}
.dark .leader__aff { color: #d6d3d1; }
.leader__link {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-brand);
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
.leader__link:hover { border-bottom-color: currentColor; }

.secretariats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.secretariat {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: 1rem;
}
.secretariat__rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 1.5rem;
}
.secretariat__node {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--color-brand);
  border: 3px solid #fafaf9;
  box-shadow: 0 0 0 2px var(--color-brand);
  position: relative;
  z-index: 2;
  margin-left: 0;
}
.dark .secretariat__node { border-color: #1c1917; }
.secretariat--current .secretariat__node { background: #b91c1c; box-shadow: 0 0 0 2px #b91c1c; }
.dark .secretariat--current .secretariat__node { background: #f87171; box-shadow: 0 0 0 2px #f87171; }
.secretariat__stem {
  flex-grow: 1;
  width: 1px;
  background: linear-gradient(to bottom, var(--color-brand), transparent);
  opacity: 0.35;
  margin-top: 0.5rem;
  margin-left: 0.4375rem;
  min-height: 2rem;
}
.secretariat__card {
  padding: 1.5rem 0 2rem;
}
.secretariat__head {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}
.secretariat__period {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-brand);
  font-variant-numeric: tabular-nums;
}
.secretariat__badge {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #fff;
  background: #b91c1c;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.125rem;
}
.dark .secretariat__badge { background: #f87171; color: #1c1917; }
.secretariat__org {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #1c1917;
  margin: 0 0 0.375rem;
  line-height: 1.05;
  font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 1;
}
.dark .secretariat__org { color: #fafaf9; }
.secretariat__country {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;
  color: #78716c;
}
.dark .secretariat__country { color: #a8a29e; }
.secretariat__full {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: 600;
  color: #44403c;
  margin: 0 0 0.75rem;
}
.dark .secretariat__full { color: #d6d3d1; }
.secretariat__note {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #57534e;
  max-width: 56rem;
  margin: 0 0 1rem;
}
.dark .secretariat__note { color: #b8b3a9; }
.secretariat__foot {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.secretariat__chair {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-brand);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
.secretariat__chair:hover { border-bottom-color: currentColor; }
.secretariat__role {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: #78716c;
}
.dark .secretariat__role { color: #a8a29e; }

.structure__continuity {
  margin-top: 3rem;
  padding: 1.75rem 1.5rem;
  background: rgb(30 58 138 / 0.04);
  border-left: 3px solid var(--color-brand);
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1rem;
  line-height: 1.65;
  color: #44403c;
}
.dark .structure__continuity {
  background: rgb(148 182 232 / 0.06);
  border-left-color: var(--color-brand);
  color: #d6d3d1;
}
.structure__continuity a {
  color: var(--color-brand);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}

/* ─── GET INVOLVED ───────────────────────────────────────── */
.involve {
  padding: 5rem 0 0;
}
.involve__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  border-top: 1px solid #e7e5e4;
}
.dark .involve__grid { border-top-color: #44403c; }
@media (min-width: 640px) { .involve__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .involve__grid { grid-template-columns: repeat(4, 1fr); } }

.involve__card {
  display: block;
  padding: 1.75rem 1.5rem;
  text-decoration: none;
  color: inherit;
  border-right: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
  position: relative;
  transition: background 0.2s;
}
@media (min-width: 640px) {
  .involve__card:nth-child(2n) { border-right: none; }
}
@media (min-width: 1100px) {
  .involve__card:nth-child(2n) { border-right: 1px solid #e7e5e4; }
  .involve__card:nth-child(4n) { border-right: none; }
}
.dark .involve__card { border-color: #44403c; }
.involve__card:hover { background: rgb(30 58 138 / 0.03); }
.dark .involve__card:hover { background: rgb(148 182 232 / 0.04); }

.involve__label {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #1c1917;
  margin: 0 0 0.5rem;
  line-height: 1.2;
}
.dark .involve__label { color: #fafaf9; }
.involve__blurb {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #57534e;
  margin: 0 0 1rem;
}
.dark .involve__blurb { color: #d6d3d1; }
.involve__cta {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-brand);
  transition: transform 0.15s;
  display: inline-block;
}
.involve__card:hover .involve__cta { transform: translateX(3px); }

/* ─── RESPONSIVE TUNING ──────────────────────────────────── */
@media (max-width: 640px) {
  .stats__inner { gap: 0; }
}
</style>
