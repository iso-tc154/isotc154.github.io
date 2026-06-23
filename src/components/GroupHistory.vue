<script setup lang="ts">
import type { GroupLifecycleEvent, ConvenorTerm } from '../types/group'
import GroupTimeline from './GroupTimeline.vue'
import ConvenorTermBar from './ConvenorTermBar.vue'
import PersonCard from './PersonCard.vue'

defineProps<{
  lifecycleEvents: GroupLifecycleEvent[]
  convenorTerms: ConvenorTerm[]
  predecessorTerms: ConvenorTerm[]
  predecessorName?: string
  pastLeadership: string[]
  nameOf: (id: string) => string
}>()
</script>

<template>
  <div v-if="lifecycleEvents.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Lifecycle</h3>
    <p class="ghist__intro">Key moments in this group's history, traced through plenary resolutions.</p>
    <GroupTimeline :events="lifecycleEvents" />
  </div>

  <div v-if="convenorTerms.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Leadership timeline</h3>
    <p class="ghist__intro">Convenor tenures on a shared timeline. Bars link to member profiles; chips link to appointing resolutions.</p>
    <ConvenorTermBar
      :terms="convenorTerms"
      :predecessor-terms="predecessorTerms"
      :predecessor-name="predecessorName"
    />
  </div>

  <div v-if="pastLeadership.length" class="ghist__block ghist__card">
    <h3 class="ghist__heading">Past leadership</h3>
    <div class="ghist__leaders">
      <PersonCard
        v-for="id in pastLeadership"
        :key="id"
        :id="id"
        :name="nameOf(id)"
        variant="leader"
        size="sm"
      />
    </div>
  </div>
</template>

<style scoped>
.ghist__block {
  margin-bottom: 1.5rem;
}
.ghist__block:last-child { margin-bottom: 0; }
.ghist__card {
  padding: 1.5rem;
  background: #fff;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.625rem;
  box-shadow: 0 1px 2px rgba(120, 113, 108, 0.04);
}
.dark .ghist__card {
  background: rgba(15, 23, 42, 0.45);
  border-color: var(--color-slate-700);
  box-shadow: none;
}
.ghist__heading {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}
.dark .ghist__heading { color: var(--color-slate-100); }
.ghist__intro {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--color-slate-500);
  font-style: italic;
  margin: 0 0 1.25rem;
  line-height: 1.55;
  max-width: 42rem;
}
.dark .ghist__intro { color: var(--color-slate-400); }

.ghist__leaders {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
