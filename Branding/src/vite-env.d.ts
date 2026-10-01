/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The NELMA API, ending in /api/v1. The Contact Us and Order Now forms send to it. */
  readonly VITE_API_URL?: string;
  /** Play Store listing, or an APK link from an EAS build while the listing is not live yet. */
  readonly VITE_ANDROID_DOWNLOAD_URL?: string;
  /** App Store listing; the button stays hidden until this is set. */
  readonly VITE_IOS_DOWNLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
