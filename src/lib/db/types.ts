/**
 * Database abstraction types.
 * Both Supabase and self-hosted Postgres providers implement these interfaces.
 */

// ── Generic query helpers ──────────────────────────────────────
export interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
  count?: number;
}

// ── News ───────────────────────────────────────────────────────
export interface NewsFeedRow {
  id: string;
  link: string;
  title: string;
  source: string;
  description: string | null;
  pub_date: string | null;
  bias: number;
  paywall: boolean;
  summary: string | null;
  lang: string;
  relevance: number;
  type: string;
  created_at: string;
}

export interface NewsMetaRow {
  key: string;
  value: string;
  updated_at: string;
}

// ── Telegram Raw ───────────────────────────────────────────────
export interface TelegramRawRow {
  id: string;
  channel: string;
  channel_label: string;
  message_id: number;
  link: string;
  raw_text: string;
  pub_date: string | null;
  scraped_at: string;
  has_media: boolean;
  word_count: number;
}

// ── Sources ────────────────────────────────────────────────────
export interface SourceRow {
  id: string;
  title: string;
  author: string | null;
  source_type: string;
  content: string | null;
  url: string | null;
  tags: string[];
  lecture_links: string[];
  language: string;
  year: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Auth ───────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  expires_at: number;
}

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  is_admin: boolean;
  is_anonymous: boolean;
  privacy_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_active: string;
}

// ── Provider interface ─────────────────────────────────────────
export interface DbProvider {
  // ── News operations ──
  news: {
    getArticles(opts: {
      lang?: string;
      type?: string;
      limit?: number;
      offset?: number;
      minRelevance?: number;
    }): Promise<QueryResult<NewsFeedRow[]>>;

    getArticleCount(opts?: { type?: string; lang?: string }): Promise<number>;

    upsertArticles(rows: Partial<NewsFeedRow>[]): Promise<QueryResult<NewsFeedRow[]>>;

    updateArticle(id: string, data: Partial<NewsFeedRow>): Promise<QueryResult<NewsFeedRow>>;

    getExistingLinks(links: string[]): Promise<Set<string>>;

    getMeta(key: string): Promise<string | null>;
    setMeta(key: string, value: string): Promise<void>;
  };

  // ── Telegram raw archive ──
  telegram: {
    insertRaw(rows: Omit<TelegramRawRow, 'id' | 'scraped_at' | 'word_count'>[]): Promise<{ inserted: number }>;
    getExistingLinks(links: string[]): Promise<Set<string>>;
    getRawPosts(opts: {
      channel?: string;
      since?: string;
      until?: string;
      limit?: number;
      offset?: number;
    }): Promise<QueryResult<TelegramRawRow[]>>;
    getRawCount(opts?: { channel?: string; since?: string }): Promise<number>;
    getChannelStats(): Promise<{ channel: string; count: number; oldest: string | null; newest: string | null }[]>;
  };

  // ── Sources library ──
  sources: {
    insert(rows: Omit<SourceRow, 'id' | 'created_at' | 'updated_at'>[]): Promise<QueryResult<SourceRow[]>>;
    getAll(opts?: { type?: string; tag?: string; limit?: number }): Promise<QueryResult<SourceRow[]>>;
    search(query: string): Promise<QueryResult<SourceRow[]>>;
    update(id: string, data: Partial<SourceRow>): Promise<QueryResult<SourceRow>>;
    delete(id: string): Promise<void>;
  };
}
