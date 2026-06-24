<script setup lang="ts">
interface Props {
  modelValue: string
  searchPlaceholder?: string
  searchLabel?: string
  showing?: number | null
  total?: number | null
  totalLabel?: string
  clearable?: boolean
  elevated?: boolean
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search…',
  searchLabel: 'Search',
  showing: null,
  total: null,
  totalLabel: 'items',
  clearable: false,
  elevated: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="lvf" :class="{ 'lvf--elevated': elevated }">
    <div class="lvf__search">
      <svg class="lvf__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="search"
        :value="modelValue"
        @input="onInput"
        class="lvf__input"
        :placeholder="searchPlaceholder"
        :aria-label="searchLabel"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div class="lvf__controls" v-if="$slots.facets || $slots.sort">
      <div class="lvf__facets">
        <slot name="facets" />
      </div>
      <div class="lvf__sort" v-if="$slots.sort">
        <slot name="sort" />
      </div>
    </div>

    <div class="lvf__active" v-if="$slots['active-filters']">
      <span class="lvf__active-label">Active</span>
      <div class="lvf__active-chips">
        <slot name="active-filters" />
      </div>
    </div>

    <div class="lvf__meta">
      <span v-if="showing !== null && total !== null" class="lvf__count">
        <strong>{{ showing }}</strong><span class="lvf__count-sep">/</span>{{ total }} {{ totalLabel }}
      </span>
      <div class="lvf__meta-extra">
        <slot name="meta-extra" />
      </div>
      <button v-if="clearable" class="lvf__clear" @click="emit('clear')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        Clear all
      </button>
    </div>
  </div>
</template>

<style scoped>
.lvf {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  padding: 1.25rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}
.dark .lvf {
  background: rgb(15 23 42 / 0.5);
  border-color: #44403c;
}
.lvf--elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border-color: rgba(226, 232, 240, 0.9);
  margin-top: -2.5rem;
  z-index: 20;
}
.dark .lvf--elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  border-color: rgba(51, 65, 85, 0.8);
}

/* Search input — the dominant control */
.lvf__search {
  position: relative;
}
.lvf__search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a8a29e;
  pointer-events: none;
}
.lvf__input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.625rem;
  font-family: inherit;
  font-size: 0.9375rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.5rem;
  background: #fafaf9;
  color: #1c1917;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  -webkit-appearance: none;
  appearance: textfield;
}
.lvf__input::-webkit-search-cancel-button { -webkit-appearance: none; }
.lvf__input:focus {
  outline: none;
  border-color: var(--color-blue-accent);
  background: #fff;
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}
.dark .lvf__input {
  background: #292524;
  border-color: #57534e;
  color: #fafaf9;
}
.dark .lvf__input:focus {
  border-color: #5379bf;
  background: #1c1917;
}

/* Controls row — facets on left, sort on right */
.lvf__controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 768px) {
  .lvf__controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
}
.lvf__facets {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}
.lvf__sort {
  margin-left: auto;
  align-self: flex-start;
}

/* Active filter strip */
.lvf__active {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px dashed #e7e5e4;
  flex-wrap: wrap;
}
.dark .lvf__active { border-top-color: #44403c; }
.lvf__active-label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #a8a29e;
}
.dark .lvf__active-label { color: #d6d3d1; }
.lvf__active-chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

/* Meta row — count on left, extras + clear on right */
.lvf__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.875rem;
  border-top: 1px solid #f5f5f4;
  flex-wrap: wrap;
}
.dark .lvf__meta { border-top-color: #292524; }
.lvf__count {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: #78716c;
  font-variant-numeric: tabular-nums;
}
.dark .lvf__count { color: #a8a29e; }
.lvf__count strong {
  color: var(--color-blue-accent);
  font-weight: 700;
  font-size: 0.9375rem;
}
.dark .lvf__count strong { color: #94b6e8; }
.lvf__count-sep {
  margin: 0 0.25rem;
  color: #d6d3d1;
}
.dark .lvf__count-sep { color: #57534e; }
.lvf__meta-extra {
  margin-right: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lvf__clear {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  padding: 0.25rem 0;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-blue-accent);
  cursor: pointer;
  transition: opacity 0.15s;
}
.dark .lvf__clear { color: #94b6e8; }
.lvf__clear:hover { opacity: 0.7; }
</style>
