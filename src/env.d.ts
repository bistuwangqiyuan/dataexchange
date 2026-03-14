/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NETLIFY_DATABASE_URL?: string;
  readonly DATABASE_URL?: string;
  readonly JWT_SECRET?: string;
  readonly COINGECKO_API_URL?: string;
  readonly BINANCE_API_URL?: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

