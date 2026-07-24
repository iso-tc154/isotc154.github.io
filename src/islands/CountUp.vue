<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  target: number
  duration?: number
  start?: boolean
}>()

const display = ref(0)
let raf = 0

function animate(to: number) {
  const from = display.value
  const dur = props.duration ?? 1200
  const start = performance.now()
  cancelAnimationFrame(raf)
  function step(now: number) {
    const t = Math.min(1, (now - start) / dur)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = Math.round(from + (to - from) * eased)
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => {
  if (props.start) animate(props.target)
})
onUnmounted(() => cancelAnimationFrame(raf))
watch(() => props.start, (s) => { if (s) animate(props.target) })
watch(() => props.target, (t) => { if (props.start) animate(t) })
</script>

<template>
  <span>{{ display.toLocaleString() }}</span>
</template>
