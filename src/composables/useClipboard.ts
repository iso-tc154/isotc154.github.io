import { ref, type Ref } from 'vue'

export function useClipboard(timeoutMs = 2000): {
  copied: Ref<boolean>
  copy: (text: string) => void
} {
  const copied = ref(false)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, timeoutMs)
    })
  }

  return { copied, copy }
}
