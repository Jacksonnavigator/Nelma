# Real Tanzania Discovery Adventures: website + dashboard

The website for Real Tanzania Discovery Adventures Ltd (realtzdiscovery.co.tz), with its own **admin dashboard at `/admin`**. In the dashboard you can edit every page, photo, journey, destination, article, contact detail and menu. Changes go live the moment you press **Save & publish**: no rebuilding and no re-uploading.

- **Website:** React + TypeScript + Tailwind, built into plain files.
- **Dashboard backend:** a few small PHP files in `api/`. There is no database: content is stored as JSON files in `data/`. This runs on any normal shared hosting, including Namecheap.

## Put it on Namecheap (first time)

You need the folder made by `npm run build` (called `dist`), or the ready-made `realtz-upload.zip`.

1. **Copy the client's photos into the project first (important).**
   - On your computer, in this folder, run `npm install`, then `npm run fetch-images`, then `npm run build`.
   - This copies every photo from the old site into `dist/images`. Do it **before** the domain points to the new site. Afterwards the photos still load from the old Lovable address, but having your own copies is safer.
2. **Choose PHP 8.** In cPanel, open **Select PHP Version** and choose 8.1 or newer.
   - Under **Extensions**, make sure `fileinfo` and `json` are ticked. They usually are.
   - Under **Options**, set `upload_max_filesize` and `post_max_size` to at least `16M`, so you can upload large photos.
3. **Upload the files.**
   - In cPanel, open **File Manager → public_html**. If the old site's files are there, move them into a backup folder first.
   - Upload `realtz-upload.zip`, right-click it, choose **Extract**, then delete the zip.
   - Click **Settings** (top right) and tick **Show Hidden Files**. Check that `public_html` now contains `index.html`, `.htaccess`, `assets/`, `api/`, `data/`, `uploads/`, `brand/` and `images/`.
4. **Turn on HTTPS.** In cPanel, open **SSL/TLS Status** and run **AutoSSL** for the domain. The site always redirects to https. If the certificate isn't active yet, remove the two "Always use HTTPS" lines from `.htaccess` for now.
5. **Create the admin account.** Go to `https://realtzdiscovery.co.tz/admin`. The first visit asks you to choose a username and a password of at least 10 characters. Only one admin account exists, and nobody else can create one afterwards.
6. **Set where website messages are emailed.**
   - In the dashboard, open **Settings & contacts → Email that receives website messages**, then Save.
   - In cPanel **Email Accounts**, make sure that mailbox exists, for example info@realtzdiscovery.co.tz.

That's it. From now on, everything is done in the dashboard.

### Checking it works

- Open the site, send yourself a message from the **Contact** page, and check that it appears in the dashboard **Inbox** and in your email.
- If the email doesn't arrive, the message is still safe in the Inbox. Check your spam folder, and in cPanel open **Email Deliverability** and click **Repair** for the domain.

## Using the dashboard

| Section | What you can change |
| --- | --- |
| **Overview** | Unread messages, quick links |
| **Inbox** | Every trip request, contact message and newsletter sign-up. Reply by email or WhatsApp, mark as read, delete, export the newsletter list as CSV |
| **Pages** | Every text, button label, photo and search-engine title/description on every page, including the footer and the orange call-to-action band |
| **Lists** | Journeys (with day-by-day itineraries), Destinations & peoples (all 55), Journal articles, Community partners, Guest reviews, FAQ, Experience cards, Values, Numbers, How-we-plan steps. Add, duplicate, reorder and delete |
| **Destination groups** | Names, introductions and photos of the four destination groups |
| **Photos & media** | Replace any built-in photo everywhere at once, upload new images, delete old uploads |
| **Settings & contacts** | Company name, logo, departments with emails and phone numbers, WhatsApp number, office hours, social links, Tripadvisor, where messages are emailed |
| **Menus & footer links** | The main menu, its dropdowns and the footer link columns |
| **Version history** | The last 40 saved versions. Restore any of them with one click |
| **Account** | Change the username or password, sign out |

**Formatting in text boxes**
- `*word*` gives a coloured italic accent, like the gold words in the titles.
- `**word**` makes the word bold.
- `[text](/safari)` makes a link.
- An empty line starts a new paragraph.

Article bodies also support:
- `## Heading` for a heading
- `- bullet` for a bullet point
- `![caption](photo-name)` for a photo
- `| a | b |` for table rows

**Preview** shows your unsaved changes on the real site in a new tab; only you can see them. Visitors only see a change after **Save & publish**.

**Photos for destinations:** pick one in the destination's Photo field. Alternatively, save a file in `images/destinations/` named after the page address, for example `ruaha.jpg`.

## Updating the design later

Run `npm run build` and upload the new `dist` contents over the old ones.

**Never delete** these two folders on the server:
- **`data/`** holds all the text you edited, the messages, the version history and the admin login.
- **`uploads/`** holds the photos you uploaded.

The build contains only an `.htaccess` file in each of these folders, so overwriting is safe.

## Backups and security

- **Backups:** every save keeps the previous version (the last 40). For an offsite backup, download the `data/` and `uploads/` folders from File Manager now and then.
- **Private data:** `data/` is blocked from the web. To keep it outside `public_html` instead, create `api/config.php` containing `<?php define('RTZ_DATA_DIR', '/home/YOURUSER/realtz-data');`.
- **Sign-in protection:** passwords are stored hashed. Sign-in attempts are rate-limited, and the session ends after 12 hours idle. Every change requires a valid sign-in plus a security token.
- **Uploads:** only JPG, PNG, WebP and GIF images up to 12 MB are accepted, and nothing in `uploads/` can run as a script.
- **Forms:** forms have spam protection (a hidden trap field plus a per-visitor limit).
- **Forgotten password:** in File Manager, delete `data/admin.json`, then visit `/admin` to create a new account. Your content is not affected.

## Developing on your computer

```sh
npm install
npm run dev          # website at http://localhost:5173 (uses the built-in content)
npm run build        # makes dist/
```

To try the dashboard locally you need PHP. Build, then run `php -S localhost:8080 -t dist` and open `/admin`. Note that PHP's built-in server ignores `.htaccess`, so only the home page and `/admin` load directly.

The built-in starting content lives in `src/data/` and `src/content/pages.ts`. The dashboard saves its own copy on the server, which always takes priority.
