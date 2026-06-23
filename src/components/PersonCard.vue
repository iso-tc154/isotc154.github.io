<script setup lang="ts">
import { computed } from 'vue'
import { memberPath } from '../utils/urn'

type Variant = 'current' | 'past' | 'leader'

const props = withDefaults(defineProps<{
  id: string
  name: string
  variant?: Variant
  meta?: string
  size?: 'sm' | 'md'
}>(), {
  variant: 'current',
  size: 'md',
})

const href = computed(() => memberPath(props.id))

function initials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
</script>

<template>
  <RouterLink :to="href" :class="['pcard', `pcard--${variant}`, `pcard--${size}`]">
    <span class="pcard__avatar" aria-hidden="true">{{ initials(name) }}</span>
    <span class="pcard__body">
      <span class="pcard__name">{{ name }}</span>
      <span v-if="meta" class="pcard__meta">{{ meta }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.pcard {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.875rem 0.375rem 0.375rem;
  border-radius: 9999px;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  text-decoration: none;
  color: var(--color-slate-900);
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.pcard:hover {
  border-color: var(--color-blue-accent);
  background: var(--color-slate-50);
  transform: translateY(-1px);
}
.dark .pcard {
  background: rgba(15, 23, 42, 0.55);
  border-color: var(--color-slate-700);
  color: var(--color-slate-100);
}
.dark .pcard:hover {
  background: var(--color-slate-800);
  border-color: var(--color-blue-accent);
}
.pcard:hover .pcard__name { color: var(--color-blue-accent); }

.pcard--sm {
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  font-size: 0.8125rem;
  gap: 0.5rem;
}
.pcard--sm .pcard__avatar {
  width: 1.625rem;
  height: 1.625rem;
  font-size: 0.625rem;
}

.pcard__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: var(--color-blue-accent);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}
.dark .pcard__avatar { background: #5379bf; }

.pcard__body {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}
.pcard__name {
  font-weight: 500;
  color: inherit;
  white-space: nowrap;
}
.pcard__meta {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-slate-500);
}
.dark .pcard__meta { color: var(--color-slate-400); }

/* Variants — colour-only differences, no structural duplication */
.pcard--past .pcard__avatar { background: #a8a29e; }
.dark .pcard--past .pcard__avatar { background: #57534e; }
.pcard--past .pcard__name { opacity: 0.85; }

.pcard--leader .pcard__avatar { background: var(--color-slate-500); }
.dark .pcard--leader .pcard__avatar { background: var(--color-slate-500); }
</style>
