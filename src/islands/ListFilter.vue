<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{
  targetSelector: string
  itemSelector: string
  fields: { attr: string; label: string; placeholder?: string }[]
  searchFields?: string[]
}>()

const query = ref('')
const fieldFilters = ref<Record<string, string>>({})
const itemCount = ref(0)
const visibleCount = ref(0)

function applyFilter() {
  const items = document.querySelectorAll(`${props.targetSelector} ${props.itemSelector}`)
  itemCount.value = items.length
  let visible = 0
  items.forEach((el) => {
    const elem = el as HTMLElement
    let pass = true
    const q = query.value.trim().toLowerCase()
    if (q && props.searchFields) {
      const haystack = props.searchFields.map((f) => (elem.getAttribute(`data-${f}`) || '').toLowerCase()).join(' ')
      if (!haystack.includes(q)) pass = false
    }
    for (const [k, v] of Object.entries(fieldFilters.value)) {
      if (v && elem.getAttribute(`data-${k}`) !== v) pass = false
    }
    elem.style.display = pass ? '' : 'none'
    if (pass) visible++
  })
  visibleCount.value = visible
}

function clearAll() {
  query.value = ''
  fieldFilters.value = {}
  applyFilter()
}

onMounted(() => applyFilter())
</script>

<template>
  <div class="list-filter">
    <div class="list-filter__row">
      <input
        v-if="searchFields"
        v-model="query"
        type="search"
        class="list-filter__search"
        placeholder="Search…"
        @input="applyFilter"
        aria-label="Search"
      />
      <select
        v-for="f in fields"
        :key="f.attr"
        v-model="fieldFilters[f.attr]"
        class="list-filter__select"
        @change="applyFilter"
        :aria-label="f.label"
      >
        <option value="">{{ f.label }}: all</option>
      </select>
      <button type="button" class="list-filter__clear" @click="clearAll">Clear</button>
    </div>
    <p class="list-filter__count">{{ visibleCount }} of {{ itemCount }}</p>
  </div>
</template>

<style scoped>
.list-filter { margin: 1.5rem 0; }
.list-filter__row {
  display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
}
.list-filter__search, .list-filter__select {
  font-family: var(--font-sans); font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d6d3d1; background: #fff;
  color: #1c1917; outline: none;
}
:global(.dark) .list-filter__search, :global(.dark) .list-filter__select {
  border-color: #44403c; background: rgb(15 23 42 / 0.6); color: #fafaf9;
}
.list-filter__search { flex: 1; min-width: 16rem; }
.list-filter__search:focus, .list-filter__select:focus {
  border-color: var(--color-blue-accent);
}
.list-filter__clear {
  font-family: var(--font-sans); font-size: 0.8125rem;
  color: #78716c; background: none; border: none; cursor: pointer;
  text-decoration: underline; padding: 0.5rem;
}
:global(.dark) .list-filter__clear { color: #a8a29e; }
.list-filter__count {
  font-family: var(--font-sans); font-size: 0.75rem;
  color: #78716c; margin: 0.625rem 0 0;
}
:global(.dark) .list-filter__count { color: #a8a29e; }
</style>
