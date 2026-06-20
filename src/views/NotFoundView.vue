<script setup lang="ts">
import { RouterLink } from 'vue-router'

const suggestions = [
  { to: '/resolutions/', label: 'Resolutions', desc: 'Search adopted resolutions' },
  { to: '/standards/', label: 'Standards', desc: 'Published International Standards' },
  { to: '/members/', label: 'Members', desc: 'Committee experts' },
  { to: '/meetings/', label: 'Meetings', desc: 'Plenary meetings past and upcoming' },
  { to: '/posts/', label: 'News', desc: 'Announcements and publications' },
  { to: '/about/', label: 'About', desc: 'About ISO/TC 154' },
]
</script>

<template>
  <section class="not-found">
    <p class="not-found__eyebrow">ISO/TC 154</p>
    <h1 class="not-found__code">404</h1>
    <p class="not-found__title">Page not found</p>
    <p class="not-found__lead">
      The page you're looking for may have moved, been renamed, or never existed.
      Try one of these sections instead.
    </p>

    <ul class="not-found__suggestions">
      <li v-for="s in suggestions" :key="s.to">
        <RouterLink :to="s.to" class="suggestion">
          <span class="suggestion__label">{{ s.label }}</span>
          <span class="suggestion__desc">{{ s.desc }}</span>
        </RouterLink>
      </li>
    </ul>

    <RouterLink to="/" class="not-found__home">&larr; Back to home</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  max-width: 44rem;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;
  text-align: center;
}
.not-found__eyebrow {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--color-blue-accent);
  margin: 0 0 1rem;
}
.dark .not-found__eyebrow { color: #94b6e8; }
.not-found__code {
  font-family: var(--font-serif);
  font-size: clamp(4rem, 12vw, 7rem);
  font-weight: 700;
  margin: 0;
  line-height: 1;
  color: var(--color-brand);
  letter-spacing: -0.04em;
}
.not-found__title {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: #1c1917;
  margin: 1rem 0 0.75rem;
}
.dark .not-found__title { color: #fafaf9; }
.not-found__lead {
  font-size: 1.0625rem;
  line-height: 1.6;
  color: #57534e;
  max-width: 32rem;
  margin: 0 auto 2.5rem;
}
.dark .not-found__lead { color: #d6d3d1; }

.not-found__suggestions {
  list-style: none;
  margin: 0 0 2.5rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(13rem, 100%), 1fr));
  gap: 0.75rem;
  text-align: left;
}
.suggestion {
  display: block;
  padding: 1rem 1.25rem;
  border: 1px solid #e7e5e4;
  border-radius: 0.5rem;
  background: #fff;
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dark .suggestion {
  background: #1c1917;
  border-color: #292524;
}
.suggestion:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px -8px rgba(0, 97, 173, 0.25);
}
.suggestion__label {
  display: block;
  font-weight: 700;
  color: #1c1917;
  margin-bottom: 0.125rem;
}
.dark .suggestion__label { color: #fafaf9; }
.suggestion__desc {
  display: block;
  font-size: 0.875rem;
  color: #78716c;
}
.dark .suggestion__desc { color: #a8a29e; }

.not-found__home {
  display: inline-block;
  font-weight: 600;
  color: var(--color-blue-accent);
  text-decoration: none;
  padding: 0.5rem 0;
}
.dark .not-found__home { color: #94b6e8; }
.not-found__home:hover { text-decoration: underline; }
</style>
