// Builds the site: wraps every page in _src/ with the shared layout (head, header, footer).
//   node tools/build.mjs
// Each _src page starts with a JSON comment:  <!-- {"title": "...", "description": "...", "nav": "projects"} -->
// _src/about.html -> about.html, _src/projects/stayvinci.html -> projects/stayvinci.html.
// The generated .html files are committed, because GitHub Pages serves the repository as it is.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, '_src')
const SITE = 'https://101feliki.github.io'

const NAV = [
  ['index.html', 'home', 'Home'],
  ['about.html', 'about', 'About'],
  ['experience.html', 'experience', 'Experience'],
  ['projects.html', 'projects', 'Projects'],
  ['services.html', 'services', 'Work with me'],
  ['goals.html', 'goals', "What's next"],
]

export const ICONS = {
  github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" fill="currentColor"/>',
  gitlab: '<path d="m22.65 13.39-1.1-3.38-2.18-6.72a.38.38 0 0 0-.72 0l-2.18 6.72H7.53L5.35 3.29a.38.38 0 0 0-.72 0L2.45 10.01l-1.1 3.38a.76.76 0 0 0 .28.85L12 21.77l10.37-7.53a.76.76 0 0 0 .28-.85z" fill="currentColor"/>',
  linkedin: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" fill="currentColor"/>',
  mail: '<path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.4l8 5.1 8-5.1V7H4zm16 2.77-7.46 4.75a1 1 0 0 1-1.08 0L4 9.77V17h16V9.77z" fill="currentColor"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
}
const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`

// ---------- Project cards from _data/projects.json ----------
// {{projects}} in a page = every project; {{featured}} = the ones marked "featured".
const { projects } = JSON.parse(readFileSync(join(root, '_data', 'projects.json'), 'utf8'))
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const STATUS = {
  live: '<span class="badge badge--live">Live</span>',
  building: '<span class="badge badge--open">Building</span>',
  open: '<span class="badge badge--open">Open source</span>',
  private: `<span class="badge badge--private">${'{{icon:lock}}'} Private</span>`,
  research: '<span class="badge badge--open">Research</span>',
  experience: '<span class="badge badge--live">Work experience</span>',
}
function card(p, up, opts = {}) {
  const featured = opts.featured ?? false
  const href = (u) => (/^(https?:|mailto:|#)/.test(u) ? u : up + u)
  const external = (u) => (/^https?:/.test(u) ? ' rel="noopener"' : '')
  // Advert-style cover: brand logo (or the name as a wordmark), headline and tagline. Pure HTML/CSS,
  // so it stays sharp, themable and weighs nothing. Links to the case study (or the first link).
  const c = p.cover
  const target = p.caseStudy || p.links?.[0]?.url || ''
  // Large outline illustration for covers without a screenshot.
  const ART = {
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5',
    face: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0',
    coins: 'M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
    box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
    chat: 'M4 5h16v11H8l-4 4V5zM8 9h8M8 12h5',
    search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4M8 11h6',
    pulse: 'M3 12h4l3-7 4 14 3-7h4',
    mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
    doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 15l2 2 4-4',
    returns: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
    map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
    home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
    cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
    chart: 'M4 20V11M10 20V5M16 20v-7M2 20h20',
    cap: 'M2 9l10-5 10 5-10 5L2 9zM6 11v5c3 2 9 2 12 0v-5',
    shield: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z',
  }
  const art = (k) => (ART[k] ? `<svg class="cover__art" viewBox="0 0 24 24" aria-hidden="true"><path d="${ART[k]}"/></svg>` : '')
  // Optional extras: "stat" = one hero number in a glass chip; "mockup" = a real screenshot in a
  // tilted browser frame (only for the project's own UI).
  const cover = c
    ? `<a class="cover cover--${esc(c.theme)}${c.mockup ? ' cover--mock' : ''}" href="${target ? href(target) : '#'}"${p.caseStudy ? '' : external(target)} tabindex="-1" aria-hidden="true">
    <span class="cover__brand">${c.logo ? `<img src="${up}${c.logo}" alt="" loading="lazy">` : `<b>${esc(c.wordmark)}</b>`}</span>
    ${c.stat ? `<span class="cover__stat"><b>${esc(c.stat[0])}</b>${esc(c.stat[1] ?? '')}</span>` : ''}
    <span class="cover__headline">${esc(c.headline)}</span>
    ${c.tagline ? `<span class="cover__tagline">${esc(c.tagline)}</span>` : ''}
    ${c.mockup ? `<span class="cover__mock"><span class="cover__bar"><i></i><i></i><i></i></span><img src="${up}${c.mockup}" alt="" loading="lazy" width="640" height="360"></span>` : art(c.icon)}
  </a>`
    : ''
  const value = p.value ? `\n  <p class="project__value"><b>Value</b>${esc(p.value)}</p>` : ''
  const impact = p.impact?.length ? `\n  <ul class="project__impact">${p.impact.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''
  const links = [
    p.caseStudy ? `<a class="btn btn--primary btn--sm" href="${href(p.caseStudy)}">Case study</a>` : '',
    ...(p.links ?? []).map((l) => `<a class="btn btn--ghost btn--sm" href="${href(l.url)}"${external(l.url)}>${l.icon === 'github' || l.icon === 'gitlab' ? `{{icon:${l.icon}}} ` : ''}${esc(l.label)}${l.icon === 'external' ? ' {{icon:external}}' : ''}</a>`),
    p.privateCode ? '<span class="badge badge--private">{{icon:lock}} Private code</span>' : '',
  ].filter(Boolean)
  // HeroUI-style cover card (Home): artwork fills the card, label + headline on top,
  // a frosted-glass footer with the name, value and actions at the bottom.
  if (opts.hero) {
    const main = p.caseStudy ? `<a class="btn btn--primary btn--sm" href="${href(p.caseStudy)}">Case study</a>` : ''
    return `<article class="hcard span-${opts.span ?? 6} reveal">
  ${cover}
  <div class="hcard__foot">
    <div class="hcard__text"><b>${esc(p.title)}</b><span>${esc(p.value || p.summary)}</span></div>
    <div class="hcard__actions">${main}</div>
  </div>
</article>`
  }
  return `<article class="card project${featured || p.featured ? ' project--featured' : ''} span-${opts.span ?? 4} reveal" data-tags="${esc((p.filters ?? []).join(' '))}">
  ${cover}
  <div class="project__top"><span class="project__kind">${esc(p.kind)}</span>${STATUS[p.status] ?? ''}</div>
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.summary)}</p>${value}${impact}
  <ul class="tags">${(p.tags ?? []).map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>
  <div class="project__links">${links.join('\n    ')}</div>
</article>`
}
// Skill bars on Home: how many projects use each technology, counted from _data/projects.json,
// so they stay accurate as projects are added (no made-up percentages).
const SKILL_GROUPS = [
  ['Node.js & Express', ['Node.js', 'Express', 'Express 5', 'Fastify', 'NestJS']],
  ['PostgreSQL & SQL', ['PostgreSQL', 'PostgreSQL RLS', 'SQL', 'Drizzle', 'Prisma', 'Supabase']],
  ['React & frontend', ['React', 'Vite', 'Tailwind', 'Next.js']],
  ['TypeScript', ['TypeScript', 'NestJS', 'Turborepo']],
  ['DevOps & monitoring', ['Docker', 'nginx', 'Prometheus', 'Grafana', 'Monitoring', 'Render']],
  ['Python, Java & ML', ['Python', 'FastAPI', 'Java 17', 'Spring Boot 3', 'Computer vision']],
]
function skills() {
  const rows = SKILL_GROUPS.map(([label, tags]) => [label, projects.filter((p) => !p.homeOnly && p.tags?.some((t) => tags.includes(t))).length])
  const max = Math.max(...rows.map(([, n]) => n))
  return rows
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `<div class="skillbar"><div class="skillbar__top"><span>${esc(label)}</span><b>${n} project${n === 1 ? '' : 's'}</b></div><div class="skillbar__track"><i style="--w:${Math.round((n / max) * 100)}%"></i></div></div>`)
    .join('\n')
}
const projectCount = projects.filter((p) => !p.homeOnly).length

// Bento rhythm on a 12-column grid: wide + narrow, three across, narrow + wide, two halves…
// Each row adds up to 12, so the grid stays even whatever the number of projects.
const BENTO = [7, 5, 4, 4, 4, 5, 7, 6, 6]
const HOME = [7, 5, 5, 7]
const projectCards = (html, up) =>
  html
    .replace('{{projects}}', () =>
      projects
        .filter((p) => !p.homeOnly)
        .map((p, i, all) => {
          // Last row: fill it so it never leaves a gap.
          const left = all.length - i
          const span = left === 1 && i % 3 !== 0 ? 12 : BENTO[i % BENTO.length]
          return card(p, up, { span })
        })
        .join('\n'),
    )
    .replace('{{skills}}', () => skills())
    .replaceAll('{{projectCount}}', String(projectCount))
    .replace('{{featured}}', () => projects.filter((p) => p.featured).map((p, i) => card(p, up, { hero: true, span: HOME[i % HOME.length] })).join('\n'))

// {{icon:github}} in page sources becomes the inline SVG.
const expand = (html) => html.replace(/\{\{icon:(\w+)\}\}/g, (_, n) => icon(n))

function layout({ title, description, nav, body, rel, path }) {
  const up = rel // '' for top-level pages, '../' inside projects/
  const fullTitle = nav === 'home' ? title : `${title} · Felix Kariuki`
  const links = NAV.map(([href, key, label]) => `<a href="${up}${href}"${key === nav ? ' aria-current="page"' : ''}>${label}</a>`).join('\n          ')
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="Felix Kariuki">
  <meta name="theme-color" content="#07090c" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f5f7fa" media="(prefers-color-scheme: light)">
  <script>
    // Light or dark: the visitor's own choice if they used the toggle, otherwise their device setting.
    try { var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t } catch (e) {}
  </script>
  <link rel="canonical" href="${SITE}/${path === 'index.html' ? '' : path}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${SITE}/assets/img/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:url" content="${SITE}/${path === 'index.html' ? '' : path}">
  <link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up}assets/css/site.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="header">
    <div class="wrap header__in">
      <a class="brand" href="${up}index.html" aria-label="Felix Kariuki, home">
        <span class="brand__mark">FK</span>
        <span>Felix Kariuki<small>Backend &amp; DevOps engineer</small></span>
      </a>
      <div class="header__tools">
        <button class="theme-btn" type="button" aria-label="Switch between light and dark theme" title="Light / dark theme">
          <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/></svg>
          <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2 6 6M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
      </div>
      <nav class="nav" id="nav" aria-label="Main">
          ${links}
          <a class="btn btn--primary btn--sm nav__cta" href="${up}contact.html"${nav === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
      </nav>
    </div>
  </header>

  <main id="main">
${expand(projectCards(body, up)).trim()}
  </main>

  <footer class="footer">
    <div class="wrap footer__in">
      <span>© <span id="year">2026</span> Felix Kariuki · Nairobi, Kenya</span>
      <nav aria-label="Elsewhere">
        <a href="https://github.com/101feliki" rel="me">GitHub</a>
        <a href="https://gitlab.com/felixwachirakariuki" rel="me">GitLab</a>
        <a href="https://linkedin.com/in/felix-wachira-569297296" rel="me">LinkedIn</a>
        <a href="mailto:felixwachirakariuki@gmail.com">Email</a>
      </nav>
    </div>
  </footer>
  <script src="${up}assets/js/site.js" defer></script>
</body>
</html>
`
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (name.endsWith('.html')) yield p
  }
}

let count = 0
const sitemap = []
for (const file of walk(src)) {
  const path = relative(src, file).split(sep).join('/')
  const raw = readFileSync(file, 'utf8')
  const m = /^<!--\s*(\{[\s\S]*?\})\s*-->\s*/.exec(raw)
  if (!m) throw new Error(`${path}: first line must be a <!-- {json} --> comment`)
  const meta = JSON.parse(m[1])
  // GitHub Pages shows 404.html at whatever address was asked for, so it links from the site root.
  const rel = path === '404.html' ? '/' : '../'.repeat(path.split('/').length - 1)
  const out = join(root, path)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, layout({ ...meta, body: raw.slice(m[0].length), rel, path }))
  if (path !== '404.html') sitemap.push(`${SITE}/${path === 'index.html' ? '' : path}`)
  count++
}
writeFileSync(
  join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
)
console.log(`Built ${count} pages`)
