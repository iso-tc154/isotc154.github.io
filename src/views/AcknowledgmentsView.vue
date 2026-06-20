<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMembers } from '../composables/useMembers'
import { formatDate } from '../utils/format'

interface AckEntry {
  name: string
  affiliation?: string
  date?: string
  standard?: string
  contribution?: string
  url?: string
}

const { get: getMember } = useMembers()

const acks = ref<AckEntry[]>([])

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/acknowledgments.json`)
    if (res.ok) acks.value = await res.json() as AckEntry[]
  } catch (e) {
    console.error('Failed to load acknowledgments', e)
  }
})

const grouped = computed(() => {
  const map = new Map<string, AckEntry[]>()
  for (const a of acks.value) {
    const key = a.standard || 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
})

function memberUrl(name: string): string | null {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const m = getMember(slug)
  return m ? `/members/${slug}/` : null
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="page__eyebrow">ISO/TC 154</p>
      <h1 class="page__title">Acknowledgments</h1>
      <p class="page__lead">
        ISO/TC 154 gratefully acknowledges the following individuals and
        organizations who have contributed errata reports, feedback, and
        improvements to our standards.
      </p>
    </header>

    <section v-if="grouped.length" class="acks">
      <section v-for="[standard, entries] in grouped" :key="standard" class="acks__group">
        <h2 class="acks__standard">{{ standard }}</h2>
        <ul class="acks__list">
          <li v-for="(ack, idx) in entries" :key="idx" class="acks__item">
            <p class="acks__name">
              <a v-if="ack.url" :href="ack.url" target="_blank" rel="noopener noreferrer">{{ ack.name }}</a>
              <RouterLink v-else-if="memberUrl(ack.name)" :to="memberUrl(ack.name)!">{{ ack.name }}</RouterLink>
              <template v-else>{{ ack.name }}</template>
              <span v-if="ack.affiliation" class="acks__aff"> · {{ ack.affiliation }}</span>
            </p>
            <p v-if="ack.date" class="acks__date">{{ formatDate(ack.date) }}</p>
            <p v-if="ack.contribution" class="acks__contribution">{{ ack.contribution }}</p>
          </li>
        </ul>
      </section>
    </section>

    <div v-else class="empty">
      <p>
        No errata reports or feedback acknowledgments yet. Contributions will
        be recognized here as they are received.
      </p>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
.page__eyebrow {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .page__eyebrow { color: #94b6e8; }
.page__title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  color: #1c1917;
}
.dark .page__title { color: #fafaf9; }
.page__lead {
  font-size: 1.0625rem; line-height: 1.65; color: #57534e;
  max-width: 36rem; margin: 0 0 2.5rem;
}
.dark .page__lead { color: #d6d3d1; }

.acks { display: flex; flex-direction: column; gap: 2rem; }
.acks__standard {
  font-family: var(--font-serif);
  font-size: 1.25rem; font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 0.75rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid #e7e5e4;
}
.dark .acks__standard { border-bottom-color: #44403c; }
.acks__list { list-style: none; margin: 0; padding: 0; }
.acks__item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f4;
}
.dark .acks__item { border-bottom-color: #292524; }
.acks__name {
  font-weight: 600;
  margin: 0 0 0.125rem;
  color: #1c1917;
}
.dark .acks__name { color: #fafaf9; }
.acks__name a {
  color: var(--color-blue-accent);
  text-decoration: none;
}
.acks__name a:hover { text-decoration: underline; }
.dark .acks__name a { color: #94b6e8; }
.acks__aff { font-weight: 400; color: #78716c; }
.dark .acks__aff { color: #a8a29e; }
.acks__date {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: #a8a29e;
  margin: 0 0 0.25rem;
}
.acks__contribution {
  font-size: 0.9375rem;
  color: #57534e;
  margin: 0;
}
.dark .acks__contribution { color: #d6d3d1; }

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #78716c;
  background: #fafaf9;
  border-radius: 0.5rem;
}
.dark .empty { background: #292524; color: #a8a29e; }
</style>
