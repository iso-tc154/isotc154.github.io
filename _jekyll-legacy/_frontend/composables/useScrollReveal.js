export function useScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  )

  function observe(selector = '[data-reveal]') {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add('reveal-hidden')
      observer.observe(el)
    })
  }

  return { observe, observer }
}
