import FlexSearch from 'flexsearch'
import { createCollection } from './createCollection'
import type { Resolution } from '../types/resolution'

let indexInstance: InstanceType<typeof FlexSearch.Document> | null = null
let pageDataApplied = false

function buildSearchIndex(data: Resolution[]): InstanceType<typeof FlexSearch.Document> {
  const idx = new FlexSearch.Document({
    document: {
      id: 'internalId',
      index: ['id', 'title', 'subject', 'snippet'],
    },
    tokenize: 'forward',
  })

  data.forEach((res, i) => {
    idx.add({
      internalId: i,
      id: res.id,
      title: res.title,
      subject: res.subject,
      snippet: res.snippet,
    })
  })

  return idx
}

const collection = createCollection<Resolution[]>({
  url: 'data/resolutions.json',
  initial: [],
  onLoad: (data) => { indexInstance = buildSearchIndex(data) },
})

export function useResolutions() {
  const { items: resolutions, isLoaded, loadData } = collection

  const setPageData = (data: Resolution[]) => {
    resolutions.value = data
    isLoaded.value = true
    pageDataApplied = true
    indexInstance = null
  }

  const resetPageData = () => {
    if (!pageDataApplied) return
    pageDataApplied = false
    isLoaded.value = false
    resolutions.value = []
    indexInstance = null
  }

  const search = (query: string): Resolution[] => {
    if (!indexInstance || !query) return []
    if (!pageDataApplied && resolutions.value.length === 0) return []
    const results = indexInstance.search(query, { limit: 1000 })
    const matchedIndices = new Set<number>()
    results.forEach((fieldResult: any) => {
      fieldResult.result.forEach((docId: number) => {
        matchedIndices.add(docId)
      })
    })
    return resolutions.value.filter((_, i) => matchedIndices.has(i))
  }

  return {
    resolutions,
    isLoaded,
    loadData,
    setPageData,
    resetPageData,
    search,
  }
}
