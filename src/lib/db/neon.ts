/**
 * Neon Database Client
 *
 * 使用 Netlify 内置 Neon 或 DATABASE_URL 连接 Postgres
 * Netlify DB 使用 NETLIFY_DATABASE_URL
 */

import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL;

function getSql() {
  if (!connectionString) {
    throw new Error(
      'Missing database URL. Set NETLIFY_DATABASE_URL or DATABASE_URL (e.g. via Netlify DB or Neon).'
    );
  }
  return neon(connectionString);
}

/** 获取 Neon serverless SQL 执行器，用于服务器端（API/SSR） */
export function getDb() {
  return getSql();
}

export type Sql = ReturnType<typeof getSql>;
