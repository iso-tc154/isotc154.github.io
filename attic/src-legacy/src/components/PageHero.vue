<script setup lang="ts">
interface Props {
  variant?: 'landing' | 'index' | 'detail' | 'article'
  eyebrow?: string
  title?: string
  accent?: string
  lead?: string
  href?: string
  align?: 'start' | 'center'
  bleed?: boolean
}
withDefaults(defineProps<Props>(), { variant: 'index', align: 'start', bleed: false })
</script>

<template>
  <header :class="['ph', `ph--${variant}`, `ph--${align}`, { 'ph--bleed': bleed }]">
    <div v-if="$slots.decoration" class="ph__decoration" aria-hidden="true">
      <slot name="decoration" />
    </div>

    <div class="ph__inner">
      <nav v-if="$slots.breadcrumb" class="ph__breadcrumb hero-enter" style="--nth: 0;">
        <span class="ph__breadcrumb-arrow" aria-hidden="true"></span>
        <slot name="breadcrumb" />
      </nav>

      <p v-if="eyebrow || $slots.eyebrow" class="ph__eyebrow hero-enter" style="--nth: 1;">
        <span class="ph__eyebrow-rule" aria-hidden="true"></span>
        <slot name="eyebrow">{{ eyebrow }}</slot>
      </p>

      <h1 class="ph__title hero-enter" style="--nth: 2;">
        <a v-if="href" :href="href" class="ph__title-link">
          <slot name="title">
            <span v-if="title">{{ title }}</span><span v-if="title && accent">&nbsp;</span><span v-if="accent" class="ph__accent">{{ accent }}</span>
          </slot>
        </a>
        <slot v-else name="title">
          <span v-if="title">{{ title }}</span><span v-if="title && accent">&nbsp;</span><span v-if="accent" class="ph__accent">{{ accent }}</span>
        </slot>
      </h1>

      <p v-if="lead || $slots.lead" class="ph__lead hero-enter" style="--nth: 3;">
        <slot name="lead">{{ lead }}</slot>
      </p>

      <div v-if="$slots.default || $slots.stats" class="ph__extra hero-enter" style="--nth: 4;">
        <slot name="stats" />
        <slot />
      </div>

      <div v-if="$slots.actions" class="ph__actions hero-enter" style="--nth: 5;">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.ph {
  position: relative;
  margin: 0 0 2.5rem;
  padding: 2rem 0 0;
  max-width: 48rem;
  overflow: hidden;
}
.ph--center { text-align: center; margin-left: auto; margin-right: auto; }
.ph--start { text-align: start; }

.ph__decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.ph__inner {
  position: relative;
  z-index: 1;
}
.ph--center .ph__inner { display: flex; flex-direction: column; align-items: center; }

.ph__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.2;
  color: #57534e;
  margin: 0 0 1.25rem;
  opacity: 0.85;
}
.dark .ph__breadcrumb { color: #a8a29e; }
.ph__breadcrumb :where(a, button) {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0.25rem 0;
  color: inherit;
  text-decoration: none;
  background: none;
  border: 0;
  font: inherit;
  letter-spacing: 0.005em;
  transition: color 180ms ease, transform 180ms ease;
}
.ph__breadcrumb :where(a, button):hover {
  color: var(--color-brand);
}
.ph__breadcrumb :where(a, button):hover .ph__breadcrumb-arrow {
  transform: translateX(-3px);
}
.ph__breadcrumb-arrow {
  display: inline-block;
  width: 0.625rem;
  height: 1px;
  background: currentColor;
  position: relative;
  flex-shrink: 0;
  transition: transform 180ms ease;
}
.ph__breadcrumb-arrow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 5px;
  height: 5px;
  border-left: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: translateY(-50%) rotate(45deg);
}
.ph--center .ph__breadcrumb { justify-content: center; }

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
  font-variation-settings: 'opsz' 60;
}
.dark .ph__title { color: #fafaf9; }
.ph__title-link { color: inherit; text-decoration: none; }
.ph__accent {
  font-style: italic;
  font-weight: 400;
  color: var(--color-brand);
  font-variation-settings: 'opsz' 60;
}

.ph__lead {
  font-family: var(--font-sans);
  line-height: 1.6;
  color: #44403c;
  margin: 0 0 1.5rem;
  max-width: 42rem;
}
.dark .ph__lead { color: #d6d3d1; }

.ph__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin: 0 0 1.5rem;
}

.ph__extra { margin-top: 0.5rem; }

/* Variant: landing — large display, generous spacing, supports decorative bg */
.ph--landing {
  max-width: 64rem;
  padding: 5rem 0 4rem;
}
.ph--landing .ph__inner { max-width: 56rem; }
.ph--landing .ph__title {
  font-size: clamp(2rem, 5vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 1.75rem;
}
.ph--landing .ph__lead {
  font-size: clamp(1rem, 1.4vw, 1.1875rem);
  margin-bottom: 2.25rem;
  max-width: 42rem;
}

/* Variant: index — medium, for list/section pages */
.ph--index {
  padding-top: 5rem;
}
.ph--index .ph__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
}
.ph--index .ph__lead {
  font-size: 1.0625rem;
}

/* Variant: detail — compact, paired with back links and metadata */
.ph--detail {
  max-width: 56rem;
  padding-top: 5rem;
  margin-bottom: 2rem;
}
.ph--detail .ph__title {
  font-size: clamp(1.625rem, 2.75vw, 2.25rem);
  line-height: 1.15;
  margin-bottom: 0.75rem;
}
.ph--detail .ph__lead {
  font-size: 1rem;
  margin-bottom: 1.25rem;
}

/* Variant: article — for AsciiDoc/news posts, editorial */
.ph--article {
  max-width: 48rem;
  padding-top: 5rem;
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

/* Bleed mode: decoration spans its parent (use a viewport-wide parent),
   while content stays contained at the standard page width. */
.ph--bleed {
  max-width: none;
}
.ph--bleed .ph__inner {
  max-width: 80rem;
  margin-inline: auto;
  padding-inline: 1.5rem;
}
.ph--bleed .ph__lead {
  margin-inline: auto;
}
.ph--bleed.ph--start .ph__lead {
  margin-inline: 0;
}
.ph--bleed.ph--center .ph__lead {
  max-width: 42rem;
}

@media (max-width: 640px) {
  .ph { padding-top: 1rem; margin-bottom: 2rem; }
  .ph--landing { padding: 3rem 0 2.5rem; }
  .ph--index, .ph--article, .ph--detail { padding-top: 3rem; }
  .ph__eyebrow { font-size: 0.6875rem; letter-spacing: 0.14em; }
  .ph__breadcrumb { font-size: 0.75rem; margin-bottom: 1rem; }
}
</style>
