/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Background picked by the inline script in index.html (see scripts/backgroundsPlugin.ts). */
  __CINEMA_BACKGROUND__?: string;
  /** Every background in the rotation (the ?debugbg picker lists them). */
  __CINEMA_BACKGROUNDS__?: string[];
}
