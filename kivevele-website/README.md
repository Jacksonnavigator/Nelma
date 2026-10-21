# Prof. Thomas Kivevele website

Static personal website built from Prof. Kivevele's CV (October 2026). No build step.

| File | What it is |
| --- | --- |
| `index.html` | Home page: career path, research, projects, patents, service, teaching, awards, contact |
| `publications.html` | Searchable list of all publications |
| `assets/publications.js` | Publication data (edit this to add new papers) |
| `assets/styles.css`, `assets/main.js` | Styles and behaviour |

## Preview locally

```bash
python3 -m http.server 8000 --directory kivevele-website
```

Then open http://localhost:8000.

## Publish

Upload the folder as-is to any static host (Netlify drop, Vercel, GitHub Pages, Cloudflare Pages or cPanel hosting).

## Adding a publication

Add an entry at the top of `assets/publications.js`:

```js
{ "type": "Journal article", "year": 2026, "text": "AUTHORS. 2026. Title, Journal, volume, pages.", "doi": "10.xxxx/xxxxx" }
```

## Before launch

- Replace `assets/portrait.jpg` with a high-resolution photo (the CV photo is only 199 × 268 px).
- Confirm with Prof. Kivevele which phone numbers and emails should be public.
- Personal details from the CV (date of birth, passport number, marital status, referees) are deliberately left out.
