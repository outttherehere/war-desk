/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RSS2JSON_KEY?: string;
  readonly VITE_GUARDIAN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
