<script setup lang="ts">
import { ref } from 'vue'

type Scope = 'standards' | 'resolutions' | 'members'
const scope = ref<Scope>('standards')
const term = ref('')
const targets: Record<Scope, string> = {
  standards: '/standards/',
  resolutions: '/resolutions/',
  members: '/members/',
}

function submit() {
  const q = term.value.trim()
  const path = targets[scope.value]
  window.location.href = q ? `${path}?q=${encodeURIComponent(q)}` : path
}
</script>

<template>
  <form class="hero-search" @submit.prevent="submit">
    <div class="hero-search__scopes" role="tablist" aria-label="Search scope">
      <button
        v-for="s in (['standards', 'resolutions', 'members'] as const)"
        :key="s"
        type="button"
        role="tab"
        :aria-selected="scope === s"
        :class="['hero-search__scope', { 'hero-search__scope--active': scope === s }]"
        @click="scope = s"
      >{{ s[0].toUpperCase() + s.slice(1) }}</button>
    </div>
    <div class="hero-search__row">
      <svg class="hero-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="term"
        type="search"
        class="hero-search__input"
        :placeholder="`Search ${scope}…`"
        aria-label="Search the catalogue"
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="hero-search__submit">
        Search <span aria-hidden="true">→</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.hero-search { margin: 2rem 0 2.5rem; max-width: 36rem; }
.hero-search__scopes { display: inline-flex; gap: 0.125rem; margin-bottom: 0.5rem; border-bottom: 1px solid #e7e5e4; padding-bottom: 0.25rem; }
:global(.dark) .hero-search__scopes { border-bottom-color: #44403c; }
.hero-search__scope {
  appearance: none; background: transparent; border: none;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #78716c; cursor: pointer; transition: color 0.15s;
}
:global(.dark) .hero-search__scope { color: #a8a29e; }
.hero-search__scope:hover { color: #1c1917; }
:global(.dark) .hero-search__scope:hover { color: #fafaf9; }
.hero-search__scope--active { color: var(--color-brand); position: relative; }
.hero-search__scope--active::after {
  content: ''; position: absolute; left: 0.5rem; right: 0.5rem; bottom: -0.3rem;
  height: 2px; background: var(--color-brand);
}
.hero-search__row {
  display: flex; align-items: stretch; gap: 0;
  border: 1px solid #d6d3d1; background: #fafaf9;
}
:global(.dark) .hero-search__row { border-color: #44403c; background: rgb(15 23 42 / 0.6); }
.hero-search__row:focus-within {
  border-color: var(--color-blue-accent);
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.15);
}
.hero-search__icon { align-self: center; margin-left: 0.875rem; color: #78716c; pointer-events: none; flex-shrink: 0; }
:global(.dark) .hero-search__icon { color: #a8a29e; }
.hero-search__input {
  flex: 1; border: none; background: transparent;
  padding: 0.75rem 0.875rem;
  font-family: var(--font-serif); font-size: 1.0625rem;
  color: #1c1917; outline: none;
}
:global(.dark) .hero-search__input { color: #fafaf9; }
.hero-search__input::placeholder { color: #78716c; font-style: italic; }
:global(.dark) .hero-search__input::placeholder { color: #a8a29e; }
.hero-search__submit {
  appearance: none; border: none;
  background: var(--color-brand-fill); color: #fff;
  padding: 0 1.25rem;
  font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600;
  letter-spacing: 0.02em; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.5rem; transition: background 0.15s;
}
.hero-search__submit:hover { background: var(--color-brand-hover); }
.hero-search__submit span { transition: transform 0.15s; }
.hero-search__submit:hover span { transform: translateX(3px); }
</style>
