import { getPool } from './client';
import type {
  DbProvider,
  QueryResult,
  NewsFeedRow,
  TelegramRawRow,
  SourceRow,
} from '../types';

function err(e: unknown): { message: string } {
  return { message: e instanceof Error ? e.message : String(e) };
}

export function createPostgresProvider(): DbProvider {
  const pool = getPool();

  return {
    // ── News operations ──────────────────────────────────────
    news: {
      async getArticles(opts): Promise<QueryResult<NewsFeedRow[]>> {
        try {
          const conditions: string[] = [];
          const params: unknown[] = [];
          let idx = 1;

          if (opts.lang) { conditions.push(`lang = $${idx++}`); params.push(opts.lang); }
          if (opts.type) { conditions.push(`type = $${idx++}`); params.push(opts.type); }
          if (opts.minRelevance) { conditions.push(`relevance >= $${idx++}`); params.push(opts.minRelevance); }

          const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
          const limit = opts.limit || 200;
          const offset = opts.offset || 0;

          const { rows } = await pool.query(
            `SELECT * FROM news_feed ${where} ORDER BY pub_date DESC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`,
            [...params, limit, offset]
          );
          return { data: rows, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async getArticleCount(opts): Promise<number> {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let idx = 1;
        if (opts?.type) { conditions.push(`type = $${idx++}`); params.push(opts.type); }
        if (opts?.lang) { conditions.push(`lang = $${idx++}`); params.push(opts.lang); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await pool.query(`SELECT COUNT(*)::int as count FROM news_feed ${where}`, params);
        return rows[0]?.count || 0;
      },

      async upsertArticles(rows): Promise<QueryResult<NewsFeedRow[]>> {
        if (rows.length === 0) return { data: [], error: null };
        try {
          const inserted: NewsFeedRow[] = [];
          for (const row of rows) {
            const { rows: result } = await pool.query(
              `INSERT INTO news_feed (link, title, source, description, pub_date, bias, paywall, summary, full_text, lang, relevance, type)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (link) DO NOTHING
               RETURNING *`,
              [row.link, row.title, row.source, row.description || null, row.pub_date || null,
               row.bias || 0, row.paywall || false, row.summary || null, row.full_text || null,
               row.lang || 'en', row.relevance || 1, row.type || 'rss']
            );
            if (result[0]) inserted.push(result[0]);
          }
          return { data: inserted, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async updateArticle(id, data): Promise<QueryResult<NewsFeedRow>> {
        try {
          const sets: string[] = [];
          const params: unknown[] = [];
          let idx = 1;
          for (const [key, val] of Object.entries(data)) {
            if (key === 'id') continue;
            sets.push(`${key} = $${idx++}`);
            params.push(val);
          }
          params.push(id);
          const { rows } = await pool.query(
            `UPDATE news_feed SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
          );
          return { data: rows[0] || null, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async getExistingLinks(links): Promise<Set<string>> {
        if (links.length === 0) return new Set();
        const placeholders = links.map((_, i) => `$${i + 1}`).join(',');
        const { rows } = await pool.query(
          `SELECT link FROM news_feed WHERE link IN (${placeholders})`,
          links
        );
        return new Set(rows.map((r: { link: string }) => r.link));
      },

      async getMeta(key): Promise<string | null> {
        const { rows } = await pool.query('SELECT value FROM news_meta WHERE key = $1', [key]);
        return rows[0]?.value || null;
      },

      async setMeta(key, value): Promise<void> {
        await pool.query(
          `INSERT INTO news_meta (key, value, updated_at) VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, value]
        );
      },
    },

    // ── Telegram raw archive ─────────────────────────────────
    telegram: {
      async insertRaw(rows): Promise<{ inserted: number }> {
        if (rows.length === 0) return { inserted: 0 };
        let count = 0;
        for (const row of rows) {
          const { rowCount } = await pool.query(
            `INSERT INTO telegram_raw (channel, channel_label, message_id, link, raw_text, pub_date, has_media)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (link) DO NOTHING`,
            [row.channel, row.channel_label, row.message_id, row.link, row.raw_text, row.pub_date || null, row.has_media || false]
          );
          count += (rowCount || 0);
        }
        return { inserted: count };
      },

      async getExistingLinks(links): Promise<Set<string>> {
        if (links.length === 0) return new Set();
        const placeholders = links.map((_, i) => `$${i + 1}`).join(',');
        const { rows } = await pool.query(
          `SELECT link FROM telegram_raw WHERE link IN (${placeholders})`,
          links
        );
        return new Set(rows.map((r: { link: string }) => r.link));
      },

      async getRawPosts(opts): Promise<QueryResult<TelegramRawRow[]>> {
        try {
          const conditions: string[] = [];
          const params: unknown[] = [];
          let idx = 1;

          if (opts.channel) { conditions.push(`channel = $${idx++}`); params.push(opts.channel); }
          if (opts.since) { conditions.push(`pub_date >= $${idx++}`); params.push(opts.since); }
          if (opts.until) { conditions.push(`pub_date <= $${idx++}`); params.push(opts.until); }

          const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
          const limit = opts.limit || 100;
          const offset = opts.offset || 0;

          const { rows } = await pool.query(
            `SELECT * FROM telegram_raw ${where} ORDER BY pub_date DESC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`,
            [...params, limit, offset]
          );
          return { data: rows, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async getRawCount(opts): Promise<number> {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let idx = 1;
        if (opts?.channel) { conditions.push(`channel = $${idx++}`); params.push(opts.channel); }
        if (opts?.since) { conditions.push(`pub_date >= $${idx++}`); params.push(opts.since); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await pool.query(`SELECT COUNT(*)::int as count FROM telegram_raw ${where}`, params);
        return rows[0]?.count || 0;
      },

      async getChannelStats(): Promise<{ channel: string; count: number; oldest: string | null; newest: string | null }[]> {
        const { rows } = await pool.query(
          `SELECT channel, COUNT(*)::int as count, MIN(pub_date)::text as oldest, MAX(pub_date)::text as newest
           FROM telegram_raw GROUP BY channel ORDER BY count DESC`
        );
        return rows;
      },
    },

    // ── Sources library ──────────────────────────────────────
    sources: {
      async insert(rows): Promise<QueryResult<SourceRow[]>> {
        if (rows.length === 0) return { data: [], error: null };
        try {
          const inserted: SourceRow[] = [];
          for (const row of rows) {
            const { rows: result } = await pool.query(
              `INSERT INTO sources (title, author, source_type, content, url, tags, lecture_links, language, year, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               RETURNING *`,
              [row.title, row.author || null, row.source_type, row.content || null, row.url || null,
               row.tags || [], row.lecture_links || [], row.language || 'en', row.year || null, row.notes || null]
            );
            if (result[0]) inserted.push(result[0]);
          }
          return { data: inserted, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async getAll(opts): Promise<QueryResult<SourceRow[]>> {
        try {
          const conditions: string[] = [];
          const params: unknown[] = [];
          let idx = 1;
          if (opts?.type) { conditions.push(`source_type = $${idx++}`); params.push(opts.type); }
          if (opts?.tag) { conditions.push(`$${idx++} = ANY(tags)`); params.push(opts.tag); }
          const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
          const limit = opts?.limit || 100;
          const { rows } = await pool.query(
            `SELECT * FROM sources ${where} ORDER BY created_at DESC LIMIT $${idx++}`,
            [...params, limit]
          );
          return { data: rows, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async search(query): Promise<QueryResult<SourceRow[]>> {
        try {
          const { rows } = await pool.query(
            `SELECT * FROM sources WHERE title ILIKE $1 OR content ILIKE $1 OR author ILIKE $1 ORDER BY created_at DESC LIMIT 50`,
            [`%${query}%`]
          );
          return { data: rows, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async update(id, data): Promise<QueryResult<SourceRow>> {
        try {
          const sets: string[] = [];
          const params: unknown[] = [];
          let idx = 1;
          for (const [key, val] of Object.entries(data)) {
            if (key === 'id') continue;
            sets.push(`${key} = $${idx++}`);
            params.push(val);
          }
          sets.push(`updated_at = NOW()`);
          params.push(id);
          const { rows } = await pool.query(
            `UPDATE sources SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
          );
          return { data: rows[0] || null, error: null };
        } catch (e) {
          return { data: null, error: err(e) };
        }
      },

      async delete(id): Promise<void> {
        await pool.query('DELETE FROM sources WHERE id = $1', [id]);
      },
    },
  };
}
