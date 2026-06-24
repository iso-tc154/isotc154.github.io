import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { useFilteredCollection } from './useFilteredCollection'

interface Item { id: number; name: string; tags: string[] }

const ITEMS: Item[] = [
  { id: 1, name: 'Apple', tags: ['fruit', 'red'] },
  { id: 2, name: 'Banana', tags: ['fruit', 'yellow'] },
  { id: 3, name: 'Celery', tags: ['veg', 'green'] },
  { id: 4, name: 'Date', tags: ['fruit', 'brown'] },
]

const itemsRef = ref(ITEMS)

describe('useFilteredCollection', () => {
  describe('text search via haystack', () => {
    it('matches items by lowercased substring across the haystack', () => {
      const { searchQuery, filtered } = useFilteredCollection(itemsRef, {
        text: { haystack: i => `${i.name} ${i.tags.join(' ')}` },
      })
      expect(filtered.value).toHaveLength(4)
      searchQuery.value = 'an'
      // "an" appears only inside "banana" -- the haystack is name + tags
      expect(filtered.value.map(i => i.id)).toEqual([2])
    })
  })

  describe('text search via match', () => {
    it('delegates to the custom matcher when provided', () => {
      const { searchQuery, filtered } = useFilteredCollection(itemsRef, {
        text: { match: (item, q) => item.tags.some(t => t === q) },
      })
      searchQuery.value = 'red'
      expect(filtered.value.map(i => i.id)).toEqual([1])
    })
  })

  describe('single-select facet', () => {
    it('filters items where the test returns true for the selected value', () => {
      const { selection, filtered, available } = useFilteredCollection(itemsRef, {
        facets: [
          {
            id: 'tag',
            values: computed(() => ['fruit', 'veg']),
            test: (item, v) => item.tags.includes(v),
          },
        ],
      })
      expect(available.tag.value).toEqual(['fruit', 'veg'])
      selection.tag.value = 'veg'
      expect(filtered.value.map(i => i.id)).toEqual([3])
    })

    it('treats empty string as "any" (facet inactive)', () => {
      const { selection, filtered } = useFilteredCollection(itemsRef, {
        facets: [
          {
            id: 'tag',
            values: computed(() => ['fruit']),
            test: (item, v) => item.tags.includes(v),
          },
        ],
      })
      expect(filtered.value).toHaveLength(4)
      selection.tag.value = 'fruit'
      expect(filtered.value).toHaveLength(3)
      selection.tag.value = ''
      expect(filtered.value).toHaveLength(4)
    })
  })

  describe('multi-select facet', () => {
    it('keeps items matching ANY selected value (OR semantics)', () => {
      const { selectionSets, filtered } = useFilteredCollection(itemsRef, {
        facets: [
          {
            id: 'tags',
            values: computed(() => ['red', 'yellow', 'green', 'brown']),
            test: (item, v) => item.tags.includes(v),
            multiple: true,
          },
        ],
      })
      selectionSets.tags.value = new Set(['red', 'green'])
      expect(filtered.value.map(i => i.id)).toEqual([1, 3]) // Apple, Celery
    })

    it('is inactive when the selection set is empty', () => {
      const { selectionSets, filtered } = useFilteredCollection(itemsRef, {
        facets: [
          {
            id: 'tags',
            values: computed(() => ['red']),
            test: (item, v) => item.tags.includes(v),
            multiple: true,
          },
        ],
      })
      expect(filtered.value).toHaveLength(4)
      selectionSets.tags.value = new Set(['red'])
      expect(filtered.value).toHaveLength(1)
      selectionSets.tags.value = new Set()
      expect(filtered.value).toHaveLength(4)
    })
  })

  describe('sort', () => {
    it('applies the sort function after filtering', () => {
      const { filtered } = useFilteredCollection(itemsRef, {
        sort: (a, b) => a.name.localeCompare(b.name),
      })
      expect(filtered.value.map(i => i.name)).toEqual(['Apple', 'Banana', 'Celery', 'Date'])
    })
  })

  describe('hasActiveFilters', () => {
    it('reflects search query, single-select, and multi-select state', () => {
      const { searchQuery, selection, selectionSets, hasActiveFilters, clearAll } =
        useFilteredCollection(itemsRef, {
          text: { haystack: i => i.name },
          facets: [
            {
              id: 'tag',
              values: computed(() => ['fruit']),
              test: (item, v) => item.tags.includes(v),
            },
            {
              id: 'tagsMulti',
              values: computed(() => ['red']),
              test: (item, v) => item.tags.includes(v),
              multiple: true,
            },
          ],
        })
      expect(hasActiveFilters.value).toBe(false)

      searchQuery.value = 'apple'
      expect(hasActiveFilters.value).toBe(true)
      searchQuery.value = ''

      selection.tag.value = 'fruit'
      expect(hasActiveFilters.value).toBe(true)
      selection.tag.value = ''

      selectionSets.tagsMulti.value = new Set(['red'])
      expect(hasActiveFilters.value).toBe(true)

      clearAll()
      expect(hasActiveFilters.value).toBe(false)
      expect(searchQuery.value).toBe('')
      expect(selection.tag.value).toBe('')
      expect(selectionSets.tagsMulti.value.size).toBe(0)
    })
  })
})
