// Small enhancements only: everything on the site works without JavaScript.
document.documentElement.classList.remove('no-js')

// Mobile menu
const menu = document.querySelector('.menu-btn')
if (menu) {
  menu.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open')
    menu.setAttribute('aria-expanded', String(open))
  })
  document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('nav-open')))
}

// Theme toggle: flips light/dark. Choosing the same as the device setting forgets the choice,
// so the site follows the device again (the inline script in <head> applies a saved choice).
const themeBtn = document.querySelector('.theme-btn')
if (themeBtn) {
  const system = () => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  themeBtn.addEventListener('click', () => {
    const now = document.documentElement.dataset.theme || system()
    const next = now === 'light' ? 'dark' : 'light'
    try {
      if (next === system()) localStorage.removeItem('theme')
      else localStorage.setItem('theme', next)
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
    if (next === system()) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = next
  })
}

// Project filters (projects.html): buttons with data-filter, cards with data-tags="work insurance …"
const filters = document.querySelectorAll('.filter')
const cards = document.querySelectorAll('[data-tags]')
if (filters.length && cards.length) {
  filters.forEach((btn) => {
    const key = btn.dataset.filter
    const n = key === 'all' ? cards.length : [...cards].filter((c) => c.dataset.tags.split(' ').includes(key)).length
    btn.insertAdjacentHTML('beforeend', ` <span>${n}</span>`)
    btn.addEventListener('click', () => {
      filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)))
      cards.forEach((c) => {
        const show = key === 'all' || c.dataset.tags.split(' ').includes(key)
        if (show) c.removeAttribute('data-hidden')
        else c.setAttribute('data-hidden', '')
      })
      history.replaceState(null, '', key === 'all' ? location.pathname : `#${key}`)
    })
  })
  // projects.html#insurance opens with that filter
  const wanted = location.hash.slice(1)
  const start = [...filters].find((b) => b.dataset.filter === wanted)
  if (start) start.click()
}

// Fade sections in as they scroll into view
const reveal = document.querySelectorAll('.reveal')
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -8% 0px' },
  )
  reveal.forEach((el) => io.observe(el))
} else {
  reveal.forEach((el) => el.classList.add('is-in'))
}

const year = document.getElementById('year')
if (year) year.textContent = new Date().getFullYear()
