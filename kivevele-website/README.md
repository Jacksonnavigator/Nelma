# Prof. Thomas Kivevele website

React website for Prof. Thomas T. Kivevele, built from his CV (October 2026). Layout follows the reference site
(salumawadh.com): photo slider hero, about with key figures, journey, a grid of innovations, "creating impact" cards,
latest updates and a contact section, with its own teal and solar-orange brand.

Stack: Vite, React 18, TypeScript, Tailwind CSS, React Router.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production files in dist/
npm run preview    # serve dist/ locally
```

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero slider, about and figures, journey, innovations, impact, recognition, latest publications, contact |
| `/about` | Biography, education, career, national service, keynotes, awards |
| `/projects` | All 18 funded projects with Running now and Completed filters |
| `/publications` | All 133 publications with search, year and type filters |
| `/contact` | Contact details and message form |

## Editing content

- Text, projects, awards and contact details: `src/data/site.ts`
- Publications: `src/data/publications.json`
- Photos: `src/data/images.ts`. They currently use free Unsplash photos. To use real photos, put files in
  `public/images/` and change the entry to a local path, as `portrait` does.

## Publish

Upload `dist/` to Netlify, Vercel or any static host. `public/_redirects` (Netlify) and `vercel.json` (Vercel) make page
links like `/about` work on refresh. On cPanel or Apache hosting, add a rewrite of all paths to `index.html`.

## Before launch

- Replace `public/images/portrait.jpg` with a high-resolution photo (the CV photo is only 199 × 268 px).
- Swap the stock photos for real ones of his lab, dryers, students and events where possible.
- Confirm which phone numbers and emails he wants public.
- The contact form opens the visitor's email app. Connect a form service (for example Formspree) to send directly.
- Personal details from the CV (date of birth, passport number, marital status, referees) are deliberately left out.
