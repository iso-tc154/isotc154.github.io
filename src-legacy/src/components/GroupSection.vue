<script setup lang="ts">
defineProps<{
  sectionId: string
  title: string
  intro?: string
  tabbed: boolean
  visible: boolean
}>()
</script>

<template>
  <section
    v-if="visible"
    :id="sectionId"
    :role="tabbed ? 'tabpanel' : undefined"
    :aria-labelledby="tabbed ? `tab-${sectionId}` : undefined"
    class="gsec"
  >
    <h2 class="gsec__title">{{ title }}</h2>
    <p v-if="intro" class="gsec__intro">{{ intro }}</p>
    <slot />
  </section>
</template>

<style scoped>
.gsec {
  margin-bottom: 3rem;
  scroll-margin-top: 9rem;
}
.gsec:last-child { margin-bottom: 0; }

.gsec__title {
  font-family: var(--font-serif);
  font-size: 1.625rem;
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0 0 1.25rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-200);
  letter-spacing: -0.018em;
  line-height: 1.15;
  font-variation-settings: 'opsz' 32;
}
.dark .gsec__title {
  color: var(--color-slate-100);
  border-top-color: var(--color-slate-700);
}
.gsec:first-of-type .gsec__title {
  border-top: none;
  padding-top: 0;
}

.gsec__intro {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-500);
  font-style: italic;
  margin: 0 0 1.5rem;
  line-height: 1.55;
  max-width: 42rem;
}
.dark .gsec__intro { color: var(--color-slate-400); }
</style>
