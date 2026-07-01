import { createListCollection } from './createCollection'
import type { Project } from '../types/project'

const c = createListCollection<Project>({ url: 'data/projects.json', by: 'id' })

export function useProjects() {
  const { items: projects, isLoaded, loadData, all, get } = c
  return { projects, isLoaded, loadData, all, get }
}
