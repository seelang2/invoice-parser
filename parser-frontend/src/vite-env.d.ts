// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  // add all your VITE_ variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
