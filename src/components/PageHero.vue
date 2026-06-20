<script setup lang="ts">
interface Props {
  variant?: 'landing' | 'index' | 'detail' | 'article'
  eyebrow?: string
  title?: string
  accent?: string
  lead?: string
  href?: string
  align?: 'start' | 'center'
}
withDefaults(defineProps<Props>(), { variant: 'index', align: 'start' })
</script>

<template>
  <header :class="['ph', `ph--${variant}`, `ph--${align}`]">
    <p v-if="eyebrow || $slots.eyebrow" class="ph__eyebrow hero-enter" style="--nth: 0;">
      <span class="ph__eyebrow-rule" aria-hidden="true"></span>
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </p>

    <h1 class="ph__title hero-enter" style="--nth: 1;">
      <a v-if="href" :href="href" class="ph__title-link">
        <slot name="title">
          <span v-if="title">{{ title }}</span>
          <span v-if="accent" class="ph__accent">{{ accent }}</span>
        </slot>
      </a>
      <slot v-else name="title">
        <span v-if="title">{{ title }}</span>
        <span v-if="accent" class="ph__accent">{{ accent }}</span>
      </slot>
    </h1>

    <p v-if="lead || $slots.lead" class="ph__lead hero-enter" style="--nth: 2;">
      <slot name="lead">{{ lead }}</slot>
    </p>

    <div v-if="$slots.default || $slots.stats" class="ph__extra hero-enter" style="--nth: 3;">
      <slot name="stats" />
      <slot />
    </div>
  </header>
</template>

<style scoped>
.ph {
  margin: 0 0 2.5rem;
  padding: 2rem 0 0;
  max-width: 48rem;
}
.ph--center { text-align: center; margin-left: auto; margin-right: auto; }
.ph--start { text-align: start; }

.ph__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-brand);
  margin: 0 0 1rem;
}
.dark .ph__eyebrow { color: #94b6e8; }
.ph__eyebrow-rule {
  display: inline-block;
  width: 2rem;
  height: 1px;
  background: currentColor;
  flex-shrink: 0;
}

.ph__title {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: #1c1917;
  margin: 0 0 1rem;
  font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 1;
}
.dark .ph__title { color: #fafaf9; }
.ph__title-link { color: inherit; text-decoration: none; }
.ph__accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-brand);
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
}
.dark .ph__accent { color: #94b6e8; }

.ph__lead {
  font-family: var(--font-sans);
  line-height: 1.6;
  color: #44403c;
  margin: 0 0 1.5rem;
  max-width: 42rem;
}
.dark .ph__lead { color: #d6d3d1; }

.ph__extra { margin-top: 0.5rem; }

/* Variant: landing — large display, generous spacing */
.ph--landing {
  max-width: 64rem;
  padding-top: 0;
}
.ph--landing .ph__title {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  line-height: 0.98;
  letter-spacing: -0.035em;
  margin-bottom: 2rem;
}
.ph--landing .ph__lead {
  font-size: clamp(1.0625rem, 1.5vw, 1.25rem);
  margin-bottom: 3rem;
}

/* Variant: index — medium, for list/section pages */
.ph--index .ph__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
}
.ph--index .ph__lead {
  font-size: 1.0625rem;
}

/* Variant: detail — compact, paired with back links and metadata */
.ph--detail {
  max-width: 52rem;
  padding-top: 0;
  margin-bottom: 2rem;
}
.ph--detail .ph__title {
  font-size: clamp(1.625rem, 2.75vw, 2.25rem);
  line-height: 1.15;
  margin-bottom: 0.75rem;
}

/* Variant: article — for AsciiDoc/news posts, editorial */
.ph--article {
  max-width: 48rem;
}
.ph--article .ph__title {
  font-size: clamp(1.875rem, 3.25vw, 2.5rem);
  line-height: 1.15;
  margin-bottom: 1rem;
}
.ph--article .ph__lead {
  font-size: 1.125rem;
  font-style: italic;
  color: #57534e;
}
.dark .ph--article .ph__lead { color: #a8a29e; }

@media (max-width: 640px) {
  .ph { padding-top: 1rem; margin-bottom: 2rem; }
  .ph__eyebrow { font-size: 0.6875rem; letter-spacing: 0.14em; }
}
</style>
