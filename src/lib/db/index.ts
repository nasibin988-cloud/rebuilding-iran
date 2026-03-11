/**
 * Database provider switch.
 *
 * Set DB_PROVIDER=postgres to use the self-hosted PostgreSQL on Hetzner.
 * Default is "supabase" to keep backward compatibility.
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const articles = await db.news.getArticles({ lang: 'en' });
 */

import type { DbProvider } from './types';

let provider: DbProvider | null = null;

export function getDb(): DbProvider {
  if (provider) return provider;

  const backend = process.env.DB_PROVIDER || 'supabase';

  if (backend === 'postgres') {
    const { createPostgresProvider } = require('./postgres');
    provider = createPostgresProvider();
    console.log('[db] Using self-hosted PostgreSQL');
  } else {
    const { createSupabaseProvider } = require('./supabase');
    provider = createSupabaseProvider();
    console.log('[db] Using Supabase');
  }

  return provider;
}

// Convenience export
export const db = new Proxy({} as DbProvider, {
  get(_, prop) {
    return getDb()[prop as keyof DbProvider];
  },
});

// Re-export types
export type { DbProvider, NewsFeedRow, TelegramRawRow, SourceRow, NewsMetaRow, QueryResult } from './types';
