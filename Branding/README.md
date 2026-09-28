# NELMA website

The public site for NELMA drinking water at NM-AIST, Arusha: products, prices, how the water is made, contacts, and where to download the NELMA app.

## Brand files

Everything lives in `public/` so the site works on any host (not only on Lovable):

- `public/brand/nelma-logo.png`: the Nelma wordmark (transparent), also used by the admin dashboard.
- `public/brand/nelma-icon.png`: the app icon, the same one the mobile app uses.
- `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`: browser and home-screen icons made from the app icon.
- `public/media/`: product and plant photos.

## App download buttons

The "Get the NELMA app" buttons read two settings (see `.env.example`):

- `VITE_ANDROID_DOWNLOAD_URL`: defaults to the Play Store listing `https://play.google.com/store/apps/details?id=com.nelma.drinkingwater`. Before the app is published there, set it to the APK link from `npx eas build -p android --profile preview` (run in `Nelma-app/`); the button then says "Download for Android" and downloads the file.
- `VITE_IOS_DOWNLOAD_URL`: the App Store button only appears once this is set.

These are read at build time, so rebuild after changing them.

## Run and deploy

```sh
npm install --package-lock=false
npm run dev
npm run build
```

On Render: Node web service with root directory `Branding`, build `npm install --package-lock=false && npm run build`, start `node .output/server/index.mjs`, environment `NITRO_PRESET=node-server`, `NODE_VERSION=22`, plus the download URL above.
