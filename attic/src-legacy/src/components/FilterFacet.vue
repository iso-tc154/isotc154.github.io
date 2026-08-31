<script setup lang="ts">
interface Props {
  label?: string
  align?: 'inline' | 'stacked'
}

withDefaults(defineProps<Props>(), {
  label: '',
  align: 'inline',
})
</script>

<template>
  <div class="lvfacet" :class="`lvfacet--${align}`">
    <span v-if="label" class="lvfacet__label">{{ label }}</span>
    <div class="lvfacet__chips">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lvfacet {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.lvfacet--stacked {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.lvfacet__label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #78716c;
  white-space: nowrap;
}
.dark .lvfacet__label { color: #a8a29e; }
.lvfacet__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
</style>
