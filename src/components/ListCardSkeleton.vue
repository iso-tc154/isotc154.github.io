<script setup lang="ts">
interface Props {
  count?: number
  minCardWidth?: number
}

withDefaults(defineProps<Props>(), {
  count: 6,
  minCardWidth: 280,
})
</script>

<template>
  <div
    class="lvskel"
    :style="{ '--lvskel-min': minCardWidth + 'px' }"
  >
    <div
      v-for="n in count"
      :key="n"
      class="lvskel__card"
    >
      <div class="lvskel__row">
        <div class="lvskel__line lvskel__line--badge"></div>
        <div class="lvskel__line lvskel__line--badge lvskel__line--short"></div>
      </div>
      <div class="lvskel__line lvskel__line--title"></div>
      <div class="lvskel__line lvskel__line--title lvskel__line--three-quarter"></div>
      <div class="lvskel__line lvskel__line--text"></div>
      <div class="lvskel__line lvskel__line--text lvskel__line--half"></div>
      <div class="lvskel__footer">
        <div class="lvskel__line lvskel__line--badge"></div>
        <div class="lvskel__line lvskel__line--badge"></div>
        <div class="lvskel__line lvskel__line--badge lvskel__line--short"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lvskel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--lvskel-min), 100%), 1fr));
  gap: 0.75rem;
  width: 100%;
}
.lvskel__card {
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.dark .lvskel__card {
  background: rgb(15 23 42 / 0.4);
  border-color: #44403c;
}
.lvskel__row {
  display: flex;
  gap: 0.5rem;
}
.lvskel__footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}
.lvskel__line {
  height: 0.75rem;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #f5f5f4 0%, #e7e5e4 50%, #f5f5f4 100%);
  background-size: 200% 100%;
  animation: lvskel-shimmer 1.5s ease-in-out infinite;
}
.dark .lvskel__line {
  background: linear-gradient(90deg, #292524 0%, #44403c 50%, #292524 100%);
  background-size: 200% 100%;
}
@keyframes lvskel-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .lvskel__line { animation: none; }
}
.lvskel__line--badge {
  height: 0.75rem;
  width: 4rem;
  border-radius: 9999px;
}
.lvskel__line--short { width: 2.5rem; }
.lvskel__line--title {
  height: 1.125rem;
  width: 100%;
}
.lvskel__line--three-quarter { width: 75%; }
.lvskel__line--text {
  height: 0.625rem;
  width: 100%;
}
.lvskel__line--half { width: 50%; }
</style>
