<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme'

const props = withDefaults(defineProps<{
  logo?: string | null
  logo_light?: string | null
  logo_dark?: string | null
  assetPrefix?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  radius?: string
  fallback?: 'monogram' | 'flag' | 'none'
  fallbackText?: string
  alt?: string
}>(), {
  size: 'md',
  radius: '0.5rem',
  fallback: 'monogram',
})

const { isDark } = useTheme()

const logoUrl = computed<string | null>(() => {
  const explicit = isDark.value
    ? (props.logo_dark ?? props.logo_light)
    : (props.logo_light ?? props.logo_dark)
  const candidate = explicit ?? props.logo
  if (!candidate) return null
  if (candidate.startsWith('http') || candidate.startsWith('/')) return candidate
  return props.assetPrefix ? `${props.assetPrefix}${candidate}` : candidate
})

const initials = computed(() => {
  const t = props.fallbackText ?? ''
  if (!t) return '?'
  const parts = t.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})
</script>

<template>
  <div
    class="org-logo"
    :class="[
      `org-logo--${size}`,
      { 'org-logo--fallback': !logoUrl },
    ]"
    :style="{ '--org-radius': radius }"
  >
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="alt ?? ''"
      class="org-logo__img"
      loading="lazy"
    />
    <span v-else-if="fallback === 'monogram'" class="org-logo__monogram" aria-hidden="true">
      {{ initials }}
    </span>
    <span v-else-if="fallback === 'flag'" class="org-logo__flag" aria-hidden="true">
      {{ fallbackText }}
    </span>
  </div>
</template>

<style scoped>
.org-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: var(--org-radius, 0.5rem);
  background: #fff;
}
.dark .org-logo {
  background: #292524;
}

.org-logo--sm { width: 2.25rem; height: 2.25rem; padding: 0.25rem; }
.org-logo--md { width: 3rem; height: 3rem; padding: 0.375rem; }
.org-logo--lg { width: 6rem; height: 6rem; padding: 0.75rem; }
.org-logo--xl { width: 4rem; height: 4rem; padding: 0.5rem; }

.org-logo__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.org-logo__monogram {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, var(--color-blue-accent), #5379bf);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.org-logo--sm .org-logo__monogram { font-size: 0.6875rem; }
.org-logo--lg .org-logo__monogram { font-size: 1.5rem; }

.org-logo__flag {
  font-size: 1.25rem;
  line-height: 1;
}
.org-logo--lg .org-logo__flag { font-size: 2rem; }
</style>
