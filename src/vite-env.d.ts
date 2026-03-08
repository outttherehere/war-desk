/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_RSS2JSON_KEY?: string;
  readonly VITE_GUARDIAN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
