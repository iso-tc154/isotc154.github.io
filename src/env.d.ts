/// <reference types="vite/client" />
/// <reference types="vite-ssg" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  __PAGE_DATA__?: unknown
}
