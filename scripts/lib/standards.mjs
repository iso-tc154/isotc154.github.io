import { standardPath, projectPath } from '../../src/utils/urn.ts'
import { loadYamlDir } from './yamlDir.mjs'

export function loadStandards(standardsDir) {
  return loadYamlDir(standardsDir, {
    predicate: (data) => !!data.iso,
    transform: (data, file) => {
      const id = file.replace(/\.ya?ml$/, '')
      return { ...data, id, url: standardPath(id) }
    },
  })
}

export function loadProjects(projectsDir) {
  return loadYamlDir(projectsDir, {
    predicate: (data) => !!data.id,
    transform: (data) => ({ ...data, url: projectPath(data.id) }),
  })
}
