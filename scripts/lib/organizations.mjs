import { loadYamlFile, loadYamlDir } from './yamlDir.mjs'

export function loadYamlList(ymlPath) {
  return loadYamlFile(ymlPath, { fallback: [] }) || []
}

export function loadEvents(eventsDir) {
  return loadYamlDir(eventsDir, {
    transform: (data, file) => {
      const id = file.replace(/\.ya?ml$/, '')
      return {
        ...data,
        id,
        url: Number.isInteger(data.ordinal) ? `/meetings/${data.ordinal}/` : `/meetings/`,
      }
    },
  }).sort((a, b) => (b.ordinal || 0) - (a.ordinal || 0))
}
