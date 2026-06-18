import { onMounted, onUnmounted, ref } from 'vue'

const THEME_KEY = 'theme'

export function useTheme() {
  const isDark = ref(false)

  function apply(value: boolean) {
    document.documentElement.classList.toggle('dark', value)
  }

  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
  }

  onMounted(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark') {
      isDark.value = true
    } else if (saved === 'light') {
      isDark.value = false
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      isDark.value = true
    }
    apply(isDark.value)
  })

  onUnmounted(() => {})

  return { isDark, toggle }
}
