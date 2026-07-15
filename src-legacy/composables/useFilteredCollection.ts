import { computed, ref, type ComputedRef, type Ref } from 'vue'

// Filter + text-search + sort a reactive collection.
//
// Every list view on the site follows the same shape: a `searchQuery` ref,
// a handful of facet refs (status, group, year, action-type, ...), and a
// `computed` that runs `items.filter(...).filter(...).sort(...)`. The
// predicates differ per view but the wiring is identical -- this composable
// absorbs the wiring so the view only declares the shape of its filters.
//
// Facets are either single-select (default) or multi-select (`multiple: true`).
// Single-select facets read/write through `selection[id].value` as a string
// ('' = any). Multi-select facets read/write through `selectionSets[id].value`
// as a Set<string> (empty = any).
//
// What stays in the view:
//   - URL sync (per-view query-param layout)
//   - Pagination (loadMore + reset-on-filter-change -- intertwined with the
//     filter UI, only Resolutions uses it)
//   - Grouping / partition (Meetings splits upcoming vs past, then groups by
//     decade -- this happens AFTER filtering and is presentation)

export interface SingleSelectFacetConfig<T> {
  id: string
  values: ComputedRef<string[]>
  test: (item: T, value: string) => boolean
  multiple?: false
  initialValue?: string
}

export interface MultiSelectFacetConfig<T> {
  id: string
  values: ComputedRef<string[]>
  test: (item: T, value: string) => boolean
  multiple: true
  initialValue?: string[]
}

export type FacetConfig<T> = SingleSelectFacetConfig<T> | MultiSelectFacetConfig<T>

export interface TextSearchConfig<T> {
  // One of `haystack` or `match`. `haystack` is the simple case: substring
  // match against a lowercased string built from the item. `match` is the
  // escape hatch for views that need indexed or tokenized search.
  haystack?: (item: T) => string
  match?: (item: T, lowerQuery: string) => boolean
  initialQuery?: string
}

export interface FilteredCollectionConfig<T> {
  text?: TextSearchConfig<T>
  facets?: FacetConfig<T>[]
  sort?: (a: T, b: T) => number
}

export interface FilteredCollection<T> {
  searchQuery: Ref<string>
  selection: Record<string, Ref<string>>
  selectionSets: Record<string, Ref<Set<string>>>
  available: Record<string, ComputedRef<string[]>>
  filtered: ComputedRef<T[]>
  hasActiveFilters: ComputedRef<boolean>
  clearAll: () => void
}

export function useFilteredCollection<T>(
  items: ComputedRef<T[]> | Ref<T[]>,
  config: FilteredCollectionConfig<T>,
): FilteredCollection<T> {
  const searchQuery = ref(config.text?.initialQuery ?? '')

  const selection: Record<string, Ref<string>> = {}
  const selectionSets: Record<string, Ref<Set<string>>> = {}
  const available: Record<string, ComputedRef<string[]>> = {}
  for (const facet of config.facets ?? []) {
    available[facet.id] = facet.values
    if (facet.multiple) {
      const initial = facet.initialValue ?? []
      selectionSets[facet.id] = ref(new Set(initial))
    } else {
      selection[facet.id] = ref(facet.initialValue ?? '')
    }
  }

  const filtered = computed<T[]>(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const activeSingle = (config.facets ?? []).filter(
      (f): f is SingleSelectFacetConfig<T> => !f.multiple && selection[f.id].value !== '',
    )
    const activeMulti = (config.facets ?? []).filter(
      (f): f is MultiSelectFacetConfig<T> => f.multiple === true && selectionSets[f.id].value.size > 0,
    )

    const out = items.value.filter(item => {
      for (const facet of activeSingle) {
        if (!facet.test(item, selection[facet.id].value)) return false
      }
      for (const facet of activeMulti) {
        const chosen = selectionSets[facet.id].value
        let matched = false
        for (const v of chosen) {
          if (facet.test(item, v)) { matched = true; break }
        }
        if (!matched) return false
      }
      if (q && config.text) {
        if (config.text.match) {
          if (!config.text.match(item, q)) return false
        } else if (config.text.haystack) {
          if (!config.text.haystack(item).toLowerCase().includes(q)) return false
        }
      }
      return true
    })

    if (config.sort) out.sort(config.sort)
    return out
  })

  const hasActiveFilters = computed(() => {
    if (searchQuery.value.trim() !== '') return true
    for (const facet of config.facets ?? []) {
      if (facet.multiple) {
        if (selectionSets[facet.id].value.size > 0) return true
      } else {
        if (selection[facet.id].value !== '') return true
      }
    }
    return false
  })

  function clearAll() {
    searchQuery.value = ''
    for (const facet of config.facets ?? []) {
      if (facet.multiple) {
        selectionSets[facet.id].value = new Set()
      } else {
        selection[facet.id].value = ''
      }
    }
  }

  return { searchQuery, selection, selectionSets, available, filtered, hasActiveFilters, clearAll }
}
