# Don Bosco KIITEC website (redesign)

A new static website for [kiitec.ac.tz](https://kiitec.ac.tz/). Plain HTML, CSS and a little JavaScript, so it can be hosted anywhere (cPanel, Netlify, GitHub Pages, Render static site).

## Pages

| File | Content |
| --- | --- |
| `index.html` | Home: hero with the "nameplate" facts, the 7 diplomas, founding story, labs, student quote, partners, steps to apply, FAQ |
| `programmes.html` | NTA 4–6 diploma ladder, each diploma in detail, professional and short courses |
| `admissions.html` | Application steps, the application form, documents to prepare |
| `scholarships.html` | Vodacom Foundation TV-ET (open), EACOP Level III (closed), news |
| `campus.html` | Facilities, filterable photo gallery with lightbox, map and directions |
| `about.html` | Story, milestones, approach, mission, partners |
| `contact.html` | All phone numbers, email, Instagram, map, enquiry form |

## Editing

The header and footer are shared, so edit the source files and rebuild:

1. Change page content in `_build/pages/*.html`, or the header/footer/menu in `_build/build.py`.
2. Run `python3 _build/build.py`.
3. Upload the `.html` files and the `assets/` folder.

Styles are in `assets/styles.css`; colours and fonts are set at the top of the file.

## Before going live

- **Images** load from the current site (`https://kiitec.ac.tz/images/legacy/...`). Keep that folder on the server, or copy the images into `assets/` and update the paths.
- **Forms** open the visitor's email app addressed to `info@kiitec.ac.tz`. To save applications in a database instead, point the forms at the existing backend.
- **Check with the institute:** the "You will work with" lists for the three new diplomas, the NTA year descriptions on the Programmes page, and the documents list on the Admissions page are general guidance and should be confirmed by the registrar.
- When a scholarship closes or a new one opens, update `_build/pages/scholarships.html` and the yellow notice on the home page.

Extra facts (founding story, 15-acre campus, 300-bed hostel, IUS membership, director) come from [ANS, Aug 2025](https://www.infoans.org/en/component/k2/item/25068-tanzania-don-bosco-kiitec-joins-the-salesian-institutions-of-higher-education-network-ius) and [MissionNewswire, Nov 2024](https://missionnewswire.org/tanzania-students-have-new-housing-thanks-to-donor-funding-from-salesian-missions/).
