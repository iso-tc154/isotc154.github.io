<script setup lang="ts">
import PersonCard from './PersonCard.vue'

type Variant = 'current' | 'past' | 'leader'

interface PeopleGroup {
  id: string
  label: string
  members: string[]
  variant: Variant
}

defineProps<{
  groups: PeopleGroup[]
  nameOf: (id: string) => string
}>()
</script>

<template>
  <section v-for="pg in groups" :key="pg.id" class="plist">
    <h3 class="plist__title">{{ pg.label }}</h3>
    <div class="plist__grid">
      <PersonCard
        v-for="id in pg.members"
        :key="`${pg.id}-${id}`"
        :id="id"
        :name="nameOf(id)"
        :variant="pg.variant"
        size="sm"
      />
    </div>
  </section>
</template>

<style scoped>
.plist {
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
}
.dark .plist {
  background: rgba(15, 23, 42, 0.4);
  border-color: var(--color-slate-700);
}
.plist__title {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-slate-500);
  margin: 0 0 0.875rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--color-slate-200);
}
.dark .plist__title {
  color: var(--color-slate-400);
  border-bottom-color: var(--color-slate-700);
}
.plist__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
</style>
