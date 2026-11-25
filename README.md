# Felix Kariuki · Portfolio

Personal portfolio at **https://101feliki.github.io**: who I am, my experience, what I've built and where I'm heading.

Plain HTML, CSS and a little JavaScript. No framework and no build step on the server, so GitHub Pages serves it as it is.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Experience | `experience.html` |
| Projects (filterable) | `projects.html` |
| Case studies | `projects/mustek.html`, `projects/stayvinci.html`, `projects/insurance.html`, `projects/security.html` |
| What's next | `goals.html` |
| Contact | `contact.html` |

## Editing

Edit the page content in `_src/`, then rebuild:

```sh
node tools/build.mjs
```

This wraps every page in the shared layout (head, header, menu, footer) from `tools/build.mjs` and writes the `.html` files at the top level plus `sitemap.xml`. Commit both `_src/` and the generated files.

- Styles: `assets/css/site.css` (colours are the variables at the top)
- Script: `assets/js/site.js` (mobile menu, project filters, fade-in)
- Icons in page sources: `{{icon:github}}`, `{{icon:gitlab}}`, `{{icon:linkedin}}`, `{{icon:mail}}`, `{{icon:arrow}}`, `{{icon:external}}`, `{{icon:lock}}`

Preview locally with any static server, for example `npx serve .`

## Publishing

The repository is named `101feliki.github.io`. In GitHub: **Settings → Pages → Deploy from a branch → `main` / root**. Changes are live a minute after each push.
