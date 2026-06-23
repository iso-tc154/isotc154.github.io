<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface NavItem {
  to: string
  numeral?: string
  label?: string
  caption?: string
}
interface Props {
  prev?: NavItem | null
  next?: NavItem | null
  contextLabel?: string
  align?: 'split' | 'stack'
}
withDefaults(defineProps<Props>(), { align: 'split' })
</script>

<template>
  <nav v-if="prev || next" class="pnn" :class="[`pnn--${align}`]" aria-label="Pagination">
    <div v-if="contextLabel" class="pnn__rail">
      <span class="pnn__rail-rule" aria-hidden="true"></span>
      <span class="pnn__rail-label">{{ contextLabel }}</span>
    </div>

    <div class="pnn__grid">
      <RouterLink v-if="prev" :to="prev.to" class="pnn__cell pnn__cell--prev" rel="prev">
        <span class="pnn__arrow pnn__arrow--prev" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5" />
            <path d="M12 5l-7 7 7 7" />
          </svg>
        </span>
        <span class="pnn__body">
          <span class="pnn__hint">Previous</span>
          <span v-if="prev.numeral" class="pnn__numeral">{{ prev.numeral }}</span>
          <span v-if="prev.label" class="pnn__label">{{ prev.label }}</span>
          <span v-if="prev.caption" class="pnn__caption">{{ prev.caption }}</span>
        </span>
      </RouterLink>
      <span v-else class="pnn__cell pnn__cell--muted" aria-hidden="true">
        <span class="pnn__arrow pnn__arrow--prev pnn__arrow--silent" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5" />
            <path d="M12 5l-7 7 7 7" />
          </svg>
        </span>
        <span class="pnn__body">
          <span class="pnn__hint pnn__hint--silent">Beginning</span>
        </span>
      </span>

      <span class="pnn__divider" aria-hidden="true"></span>

      <RouterLink v-if="next" :to="next.to" class="pnn__cell pnn__cell--next" rel="next">
        <span class="pnn__body">
          <span class="pnn__hint">Next</span>
          <span v-if="next.numeral" class="pnn__numeral">{{ next.numeral }}</span>
          <span v-if="next.label" class="pnn__label">{{ next.label }}</span>
          <span v-if="next.caption" class="pnn__caption">{{ next.caption }}</span>
        </span>
        <span class="pnn__arrow pnn__arrow--next" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </span>
      </RouterLink>
      <span v-else class="pnn__cell pnn__cell--muted" aria-hidden="true">
        <span class="pnn__body">
          <span class="pnn__hint pnn__hint--silent">Latest</span>
        </span>
        <span class="pnn__arrow pnn__arrow--next pnn__arrow--silent" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </span>
      </span>
    </div>
  </nav>
</template>

<style scoped>
.pnn {
  display: block;
  margin-top: 2.5rem;
  font-family: var(--font-sans);
}

.pnn__rail {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}
.pnn__rail-rule {
  display: inline-block;
  width: 1.5rem;
  height: 1px;
  background: var(--color-brand);
  flex-shrink: 0;
}
.pnn__rail-label {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-brand);
}

.pnn__grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: stretch;
  border-top: 1px solid #e7e5e4;
  border-bottom: 1px solid #e7e5e4;
}
.dark .pnn__grid {
  border-color: #44403c;
}

.pnn__divider {
  display: block;
  background: #e7e5e4;
}
.dark .pnn__divider {
  background: #44403c;
}

.pnn__cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: background 220ms ease;
}
.pnn__cell--prev {
  padding-right: 0.875rem;
  text-align: left;
}
.pnn__cell--next {
  padding-left: 0.875rem;
  text-align: right;
  flex-direction: row-reverse;
  justify-content: flex-start;
}
.pnn__cell--muted {
  opacity: 0.35;
  pointer-events: none;
}

a.pnn__cell:hover {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.06), transparent);
}
a.pnn__cell--next:hover {
  background: linear-gradient(270deg, rgba(251, 191, 36, 0.06), transparent);
}

.pnn__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  color: #57534e;
  transition: color 220ms ease, transform 220ms ease;
}
.dark .pnn__arrow { color: #a8a29e; }
.pnn__arrow svg { width: 100%; height: 100%; }

.pnn__arrow--silent {
  color: #a8a29e;
}
.dark .pnn__arrow--silent { color: #57534e; }

a.pnn__cell:hover .pnn__arrow {
  color: var(--color-brand);
}
a.pnn__cell--prev:hover .pnn__arrow--prev {
  transform: translateX(-3px);
}
a.pnn__cell--next:hover .pnn__arrow--next {
  transform: translateX(3px);
}

.pnn__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.pnn__cell--next .pnn__body {
  align-items: flex-end;
}

.pnn__hint {
  font-family: var(--font-sans);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-brand);
  opacity: 0.7;
  transition: opacity 220ms ease;
}
.pnn__hint--silent {
  color: #a8a29e;
  opacity: 1;
}
.dark .pnn__hint--silent { color: #78716c; }

a.pnn__cell:hover .pnn__hint {
  opacity: 1;
}

.pnn__numeral {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #1c1917;
  font-style: italic;
  transition: color 220ms ease;
  margin: 0.0625rem 0;
}
.dark .pnn__numeral { color: #fafaf9; }
a.pnn__cell:hover .pnn__numeral {
  color: var(--color-brand);
}

.pnn__label {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  color: #292524;
  line-height: 1.3;
  transition: color 220ms ease;
}
.dark .pnn__label { color: #e7e5e4; }
a.pnn__cell:hover .pnn__label {
  color: var(--color-brand);
}

.pnn__caption {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-style: italic;
  color: #78716c;
  line-height: 1.4;
}
.dark .pnn__caption { color: #a8a29e; }

/* Stack variant: tighter, single column on narrow screens is handled by media query */
.pnn--stack .pnn__grid {
  grid-template-columns: 1fr 1px 1fr;
}

@media (max-width: 640px) {
  .pnn__grid {
    grid-template-columns: 1fr;
    border-top: 1px solid #e7e5e4;
  }
  .pnn__divider {
    display: none;
  }
  .pnn__cell {
    padding: 0.625rem 0;
    border-bottom: 1px solid #e7e5e4;
  }
  .dark .pnn__cell {
    border-bottom-color: #44403c;
  }
  .pnn__cell--next {
    padding-left: 0;
    flex-direction: row;
    justify-content: space-between;
  }
  .pnn__cell--next .pnn__body {
    align-items: flex-start;
  }
  .pnn__cell--muted:last-child {
    border-bottom: none;
  }
  .pnn__numeral {
    font-size: 1.375rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pnn__cell,
  .pnn__arrow,
  .pnn__hint,
  .pnn__numeral,
  .pnn__label {
    transition: none;
  }
}
</style>
