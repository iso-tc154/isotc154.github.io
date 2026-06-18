<script setup lang="ts">
const committeeUrl = 'https://www.iso.org/committee/53186.html'
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="page__eyebrow">ISO/TC 154</p>
      <h1 class="page__title">Contact</h1>
      <p class="page__lead">
        For questions about ISO/TC 154, our standards, or participation,
        please see the official ISO committee page for contact details of
        our Committee Manager and Technical Programme Manager.
      </p>
    </header>

    <div class="contact-card">
      <a
        :href="committeeUrl"
        class="contact-card__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="contact-card__logo">
          <img src="/assets/iso-red.svg" alt="ISO" class="contact-card__iso-logo">
        </div>
        <div class="contact-card__details">
          <p class="contact-card__name">ISO/TC 154</p>
          <p class="contact-card__role">Committee contact details on ISO.org</p>
          <p class="contact-card__affiliation">
            Committee Manager · Technical Programme Manager
          </p>
        </div>
        <svg class="contact-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 17L17 7M17 7H8M17 7V16" />
        </svg>
      </a>
    </div>

    <section class="secretariat">
      <h2 class="secretariat__title">Secretariat</h2>
      <p class="secretariat__body">
        The ISO/TC 154 secretariat is held by
        <a href="http://www.sac.gov.cn" target="_blank" rel="noopener noreferrer">SAC</a>
        (Standardization Administration of China).
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
.page__eyebrow {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--color-blue-accent);
  margin: 0 0 0.5rem;
}
.dark .page__eyebrow { color: #94b6e8; }
.page__title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  color: #1c1917;
}
.dark .page__title { color: #fafaf9; }
.page__lead {
  font-size: 1.0625rem; line-height: 1.65; color: #57534e;
  max-width: 36rem; margin: 0 0 2rem;
}
.dark .page__lead { color: #d6d3d1; }

.contact-card {
  border: 1px solid #e7e5e4;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 2rem;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.dark .contact-card { border-color: #44403c; }
.contact-card:hover {
  border-color: var(--color-blue-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -6px rgba(0, 97, 173, 0.18);
}
.contact-card__link {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
}
.contact-card__logo {
  flex-shrink: 0;
  width: 4rem; height: 4rem;
  background: #fff;
  border-radius: 0.5rem;
  display: flex; align-items: center; justify-content: center;
  padding: 0.5rem;
}
.dark .contact-card__logo { background: #292524; }
.contact-card__iso-logo { width: 100%; height: auto; }
.contact-card__details { flex: 1; min-width: 0; }
.contact-card__name {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: #1c1917;
}
.dark .contact-card__name { color: #fafaf9; }
.contact-card__role {
  font-size: 0.9375rem;
  color: var(--color-blue-accent);
  font-weight: 600;
  margin: 0 0 0.25rem;
}
.dark .contact-card__role { color: #94b6e8; }
.contact-card__affiliation {
  font-size: 0.875rem;
  color: #78716c;
  margin: 0;
}
.dark .contact-card__affiliation { color: #a8a29e; }
.contact-card__arrow {
  color: #a8a29e;
  flex-shrink: 0;
}

.secretariat {
  padding: 1.5rem;
  background: #fafaf9;
  border-radius: 0.5rem;
  border-left: 3px solid var(--color-iso-red);
}
.dark .secretariat {
  background: #292524;
}
.secretariat__title {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #78716c;
  margin: 0 0 0.5rem;
}
.dark .secretariat__title { color: #a8a29e; }
.secretariat__body { margin: 0; color: #44403c; }
.dark .secretariat__body { color: #d6d3d1; }
.secretariat__body a { color: var(--color-blue-accent); }
.dark .secretariat__body a { color: #94b6e8; }

@media (max-width: 480px) {
  .contact-card__link {
    flex-wrap: wrap;
    gap: 0.875rem;
  }
  .contact-card__arrow { display: none; }
}
</style>
