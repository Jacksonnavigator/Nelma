/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Play Store listing, or an APK link from an EAS build while the listing is not live yet. */
  readonly VITE_ANDROID_DOWNLOAD_URL?: string;
  /** App Store listing; the button stays hidden until this is set. */
  readonly VITE_IOS_DOWNLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
