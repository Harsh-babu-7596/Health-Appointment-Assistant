/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API URL in production, e.g. https://api.yourclinic.com/api. Defaults to "/api" (proxied in dev). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
