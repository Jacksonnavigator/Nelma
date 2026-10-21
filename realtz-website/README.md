# Real Tanzania Discovery Adventures: website

The new website for Real Tanzania Discovery Adventures Ltd (realtzdiscovery.co.tz): private safaris, treks, cultural journeys and beach stays, planned by Tanzanians.

Built with React, TypeScript, Vite and Tailwind CSS. It builds to plain static files, so it runs on any host (Netlify, Vercel, Render, cPanel…).

## Run it

```sh
cd realtz-website
npm install
npm run fetch-images   # once: copies the company's photos into public/images
npm run dev            # http://localhost:5173
```

- `npm run build` makes the finished site in `dist/`.
- `npm run typecheck` checks the code.

## Pages

| Address | Page |
| --- | --- |
| `/` | Home: photo slideshow, intro, experiences, sample journeys, how we plan, community, reviews |
| `/tanzania` | Why Tanzania, best travel time, accommodation |
| `/destinations` | Destination guide overview |
| `/destinations/national-parks`, `/mountains`, `/islands` | 16 parks & reserves, 6 mountains, 10 islands & coastal places |
| `/destinations/<group>/<name>` | One page per place: facts, story, highlights, things to do, best time, getting there, what to combine it with |
| `/experiences` | Overview of the four experiences |
| `/safari`, `/trekking`, `/culture`, `/beach-and-sea` | One page per experience |
| `/journeys`, `/journeys/<name>` | Six sample itineraries with day-by-day plans |
| `/community` | The three women-led partner groups |
| `/about-us` | Who we are, personal & flexible service, beyond the familiar routes, travel trade partners, what we organise, our promise |
| `/journal`, `/journal/<name>` | Travel guides |
| `/plan-trip` | Three-step trip planner |
| `/contact` | Contact details, office hours, message form, map |
| `/travel-info` | FAQ |
| `/terms`, `/privacy`, `/imprint` | Legal pages |

The addresses of the old site (`/itinerary/...`, `/blog/...`, `/info/contact` and so on) redirect to the new pages, so old links and Google results keep working.

## Editing content

All text lives in `src/data/`, so most changes need no design work:

- `site.ts`: the Reservations, Operations and Sales contacts, the WhatsApp number (currently the Reservations number), address, office hours, Instagram/Facebook links (empty links are hidden), Tripadvisor.
- `destinations.ts`: every national park, mountain and island page.
- `journeys.ts`: the sample itineraries. Copy one block to add a new journey.
- `content.ts`: experiences, values, steps, community partners, reviews, team, FAQ.
- `journal.ts`: journal articles.
- `images.ts`: the list of photos.

## Photos

Each photo is looked for in `public/images/` first. If it isn't there, the site shows the copy from the current realtzdiscovery.co.tz site, and if that is missing too, a warm sunset gradient.

Before the old site is switched off, run `npm run fetch-images` once and commit the `public/images` folder. After that the new site doesn't depend on the old one. To replace a photo, save a new file under the same name in `public/images/`.

Destinations without a photo show an illustrated panel. To give a place a real photo, save it as `public/images/destinations/<name>.jpg` using the name from its web address (for example `ruaha.jpg`, `mount-meru.jpg`, `pemba.jpg`); the site picks it up automatically.

The logo and icons in `public/brand/` and `public/icon-*.png` were made from the full-colour logo. The logo's dark-brown animals vanish on dark backgrounds, so it is always placed on a cream badge.

## Forms (trip planner, contact, newsletter)

1. Create a free form at [formspree.io](https://formspree.io) (or any service that accepts JSON posts) using info@realtzdiscovery.co.tz.
2. Copy `.env.example` to `.env` and set `VITE_FORM_ENDPOINT` to the form's address. On a host, add it as an environment variable.
3. Rebuild.

Until an endpoint is set, the forms still work: after filling them in, the visitor gets one-tap buttons that open WhatsApp or their email app with the whole message already written.

## Deploy

The site is a single-page app, so every address must serve `index.html`. That is already set up for Netlify (`public/_redirects`) and Vercel (`vercel.json`).

- **Netlify / Vercel:** import the GitHub repository, set the base directory to `realtz-website`, build command `npm run build`, output folder `dist`.
- **Render (Static Site):** root directory `realtz-website`, build `npm install && npm run build`, publish directory `dist`, and add a rewrite from `/*` to `/index.html`.

## Before going live

- Add the real Instagram and Facebook links in `src/data/site.ts`.
- Have the company review the Terms and Privacy pages; they are a plain summary, not legal advice.
- Set `VITE_FORM_ENDPOINT` so enquiries arrive by email.
- Run `npm run fetch-images` and commit the photos.
