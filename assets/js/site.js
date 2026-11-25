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
      btn.closest('section')?.querySelector('.bento')?.classList.toggle('is-filtered', key !== 'all')
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

// "Latest on GitHub" (projects.html): public repos, newest first, minus the ones already on the page.
// New public repositories appear here without editing the site. Cached for an hour per visitor.
const latest = document.getElementById('latest-repos')
if (latest) loadLatestRepos(latest)

// Repositories never shown in "Latest on GitHub" (add a name here to keep it off the site).
const HIDDEN = new Set(['101feliki', '101feliki.github.io', 'simple-email-notification-service', 'supabase-supabase-embedded-dashboard'])

async function loadLatestRepos(box) {
  const KEY = 'gh-repos-v1'
  let repos
  try {
    const hit = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (hit && Date.now() - hit.at < 36e5) repos = hit.repos
  } catch {}
  if (!repos) {
    try {
      const res = await fetch('https://api.github.com/users/101feliki/repos?per_page=100&sort=pushed')
      if (!res.ok) return
      repos = (await res.json()).map((r) => ({ name: r.name, url: r.html_url, desc: r.description, lang: r.language, pushed: r.pushed_at, fork: r.fork, stars: r.stargazers_count }))
      try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), repos })) } catch {}
    } catch {
      return // offline or rate-limited: the section just stays hidden
    }
  }
  const shown = new Set([...document.querySelectorAll('a[href*="github.com/101feliki/"]')].map((a) => a.href.split('/')[4]?.toLowerCase()))
  const fresh = repos
    .filter((r) => !r.fork && !HIDDEN.has(r.name.toLowerCase()) && !shown.has(r.name.toLowerCase()))
    .sort((a, b) => b.pushed.localeCompare(a.pushed))
    .slice(0, 6)
  if (!fresh.length) return
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const title = (n) => n.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const when = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  box.innerHTML = fresh
    .map(
      (r) => `<article class="card project">
  <div class="project__top"><span class="project__kind">GitHub</span><span class="badge badge--open">Open source</span></div>
  <h3><a href="${esc(r.url)}" rel="noopener">${esc(title(r.name))}</a></h3>
  <p>${esc(r.desc || 'Details in the repository README.')}</p>
  <div class="repo__meta">${r.lang ? `<span><i></i>${esc(r.lang)}</span>` : ''}<span>Updated ${when(r.pushed)}</span>${r.stars ? `<span>★ ${r.stars}</span>` : ''}</div>
</article>`,
    )
    .join('')
  box.closest('section').hidden = false
}

// Pointer spotlight on cards: CSS draws a soft glow at --mx / --my.
document.querySelectorAll('.card, .contact-item, .band__item').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  })
})

// Stagger: cards in the same grid come in one after another.
document.querySelectorAll('.grid, .bento, .stats, .band__list').forEach((grid) => {
  ;[...grid.children].filter((c) => c.classList.contains('reveal')).forEach((c, i) => c.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`))
})

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
