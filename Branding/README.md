# NELMA website

The public site for NELMA drinking water at NM-AIST, Arusha: products, prices, how the water is made, contacts, and where to download the NELMA app.

## Brand files

Everything lives in `public/` so the site works on any host (not only on Lovable):

- `public/brand/nelma-logo.png`: the Nelma wordmark (transparent), also used by the admin dashboard.
- `public/brand/nelma-icon.png`: the app icon, the same one the mobile app uses.
- `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`: browser and home-screen icons made from the app icon.
- `public/media/`: product and plant photos.

## App download buttons

"Download App" downloads the Android app directly. The APK is too big for the repository (GitHub's 100 MB file limit), so it is published as a GitHub release file, and the site links to:

`https://github.com/Jacksonnavigator/Nelma/releases/latest/download/nelma.apk`

To publish a new version of the app:

1. Build it: in `Nelma-app/`, run `npx eas build -p android --profile preview` and download the APK.
2. Rename the file to exactly `nelma.apk`.
3. On GitHub, open the repository > Releases > Draft a new release. Create a tag such as `app-v1.0.1`, attach `nelma.apk`, and publish.

The site picks up the newest release straight away; no redeploy is needed. Once the app is on the Play Store, set `VITE_ANDROID_DOWNLOAD_URL` to the listing (see `.env.example`) and redeploy. `VITE_IOS_DOWNLOAD_URL` shows the App Store button once an iPhone build exists.

## Run and deploy

```sh
npm install --package-lock=false
npm run dev
npm run build
```

On Render: Node web service with root directory `Branding`, build `bun install && bun run build`, start `node .output/server/index.mjs`, environment `NITRO_PRESET=node-server` and `NODE_VERSION=22` (the same setup as the admin dashboard).
