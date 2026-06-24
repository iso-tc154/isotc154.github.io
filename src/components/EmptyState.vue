<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  icon?: 'search' | 'empty' | 'inbox'
}

withDefaults(defineProps<Props>(), {
  title: 'No matches',
  message: 'Try a different search term or adjust the filters above.',
  icon: 'search',
})
</script>

<template>
  <div class="lvempty" role="status">
    <div class="lvempty__mark" aria-hidden="true">
      <svg v-if="icon === 'search'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="14" cy="14" r="9"/>
        <line x1="21" y1="21" x2="28" y2="28"/>
      </svg>
      <svg v-else-if="icon === 'inbox'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 13l3-9h18l3 9v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V13z"/>
        <path d="M4 13h7l2 3h6l2-3h7"/>
      </svg>
      <svg v-else viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="5" width="22" height="22" rx="2"/>
        <line x1="5" y1="12" x2="27" y2="12"/>
        <line x1="11" y1="18" x2="21" y2="18"/>
      </svg>
    </div>

    <p class="lvempty__eyebrow" v-if="$slots.eyebrow">
      <slot name="eyebrow" />
    </p>

    <h3 class="lvempty__title">{{ title }}</h3>
    <p class="lvempty__msg">{{ message }}</p>

    <div class="lvempty__actions" v-if="$slots.default || $slots.suggestions">
      <div class="lvempty__suggestions" v-if="$slots.suggestions">
        <span class="lvempty__suggestions-label">Try</span>
        <div class="lvempty__suggestions-chips">
          <slot name="suggestions" />
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lvempty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5rem 2rem;
  background: #fff;
  border: 1px dashed #d6d3d1;
  border-radius: 1rem;
}
.dark .lvempty {
  background: rgb(15 23 42 / 0.4);
  border-color: #44403c;
}
.lvempty__mark {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a8a29e;
  margin-bottom: 1.5rem;
  border-radius: 50%;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
}
.dark .lvempty__mark {
  color: #78716c;
  background: #1c1917;
  border-color: #44403c;
}
.lvempty__mark svg { width: 1.75rem; height: 1.75rem; }

.lvempty__eyebrow {
  margin: 0 0 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-blue-accent);
}
.dark .lvempty__eyebrow { color: #94b6e8; }

.lvempty__title {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 2.5vw, 1.875rem);
  font-weight: 600;
  font-style: italic;
  letter-spacing: -0.01em;
  color: #1c1917;
  margin: 0 0 0.625rem;
  line-height: 1.15;
}
.dark .lvempty__title { color: #fafaf9; }
.lvempty__msg {
  font-size: 0.9375rem;
  color: #78716c;
  margin: 0;
  max-width: 32rem;
}
.dark .lvempty__msg { color: #a8a29e; }

.lvempty__actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
}
.lvempty__suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
}
.lvempty__suggestions-label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #a8a29e;
}
.dark .lvempty__suggestions-label { color: #78716c; }
.lvempty__suggestions-chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
