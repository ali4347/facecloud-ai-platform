/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, no trailing slash. See .env.example. */
  readonly VITE_API_URL?: string
  /** "true" to call the API; anything else keeps the built-in mock data. */
  readonly VITE_USE_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
