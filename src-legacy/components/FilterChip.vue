<script setup lang="ts">
interface Props {
  active?: boolean
  dotColor?: string
  tint?: string
  count?: number | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  disabled: false,
  count: null,
})

defineEmits<{ click: [] }>()

function activeStyle(): Record<string, string> | undefined {
  if (!props.active || !props.tint) return undefined
  return {
    background: props.tint,
    borderColor: props.tint,
    color: '#fff',
  }
}
</script>

<template>
  <button
    class="lvchip"
    :class="{
      'lvchip--active': active,
      'lvchip--disabled': disabled,
      'lvchip--tinted': !!tint && active,
    }"
    :style="activeStyle()"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span
      v-if="dotColor"
      class="lvchip__dot"
      :style="active ? { background: '#fff' } : { background: dotColor }"
    />
    <slot />
    <span v-if="count !== null" class="lvchip__count">{{ count }}</span>
  </button>
</template>

<style scoped>
.lvchip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid #d6d3d1;
  background: #fff;
  color: #57534e;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
}
.lvchip:hover:not(.lvchip--disabled) {
  border-color: var(--color-blue-accent);
  color: var(--color-blue-accent);
}
.lvchip--active {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: #fff;
}
.lvchip--active:hover {
  color: #fff;
  opacity: 0.92;
}
.lvchip--tinted:hover {
  color: #fff;
  opacity: 0.92;
}
.dark .lvchip {
  background: #292524;
  border-color: #57534e;
  color: #d6d3d1;
}
.dark .lvchip:hover:not(.lvchip--disabled) {
  border-color: #94b6e8;
  color: #94b6e8;
}
.dark .lvchip--active {
  background: var(--color-brand-fill);
  border-color: var(--color-brand-fill);
  color: #fff;
}
.lvchip--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lvchip__dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.lvchip__count {
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgb(0 0 0 / 0.06);
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.dark .lvchip__count { background: rgb(255 255 255 / 0.1); }
.lvchip--active .lvchip__count { background: rgb(255 255 255 / 0.2); color: #fff; }

.lvchip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgb(30 58 138 / 0.18);
}
.dark .lvchip:focus-visible {
  box-shadow: 0 0 0 3px rgb(148 182 232 / 0.25);
}
</style>
