import { createClient } from '@supabase/supabase-js';
import type {
  DbProvider,
  QueryResult,
  NewsFeedRow,
  TelegramRawRow,
  SourceRow,
} from '../types';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function createSupabaseProvider(): DbProvider {
  return {
    // ── News operations ──────────────────────────────────────
    news: {
      async getArticles(opts): Promise<QueryResult<NewsFeedRow[]>> {
        const sb = getServiceClient();
        let query = sb.from('news_feed').select('*');
        if (opts.lang) query = query.eq('lang', opts.lang);
        if (opts.type) query = query.eq('type', opts.type);
        if (opts.minRelevance) query = query.gte('relevance', opts.minRelevance);
        query = query.order('pub_date', { ascending: false, nullsFirst: false });
        if (opts.limit) query = query.limit(opts.limit);
        if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 200) - 1);
        const { data, error } = await query;
        return { data: data as NewsFeedRow[] | null, error };
      },

      async getArticleCount(opts): Promise<number> {
        const sb = getServiceClient();
        let query = sb.from('news_feed').select('*', { count: 'exact', head: true });
        if (opts?.type) query = query.eq('type', opts.type);
        if (opts?.lang) query = query.eq('lang', opts.lang);
        const { count } = await query;
        return count || 0;
      },

      async upsertArticles(rows): Promise<QueryResult<NewsFeedRow[]>> {
        if (rows.length === 0) return { data: [], error: null };
        const sb = getServiceClient();
        const { data, error } = await sb
          .from('news_feed')
          .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
          .select('*');
        return { data: data as NewsFeedRow[] | null, error };
      },

      async updateArticle(id, data): Promise<QueryResult<NewsFeedRow>> {
        const sb = getServiceClient();
        const { data: row, error } = await sb
          .from('news_feed')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();
        return { data: row as NewsFeedRow | null, error };
      },

      async getExistingLinks(links): Promise<Set<string>> {
        if (links.length === 0) return new Set();
        const sb = getServiceClient();
        const set = new Set<string>();
        for (let i = 0; i < links.length; i += 500) {
          const batch = links.slice(i, i + 500);
          const { data } = await sb.from('news_feed').select('link').in('link', batch);
          if (data) data.forEach((d: { link: string }) => set.add(d.link));
        }
        return set;
      },

      async getMeta(key): Promise<string | null> {
        const sb = getServiceClient();
        const { data } = await sb.from('news_meta').select('value').eq('key', key).single();
        return data?.value || null;
      },

      async setMeta(key, value): Promise<void> {
        const sb = getServiceClient();
        await sb.from('news_meta').upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      },
    },

    // ── Telegram raw archive ─────────────────────────────────
    // Note: telegram_raw table may not exist in Supabase yet.
    // This implementation stores in Supabase if the table is created there,
    // but the primary use case is the Postgres provider.
    telegram: {
      async insertRaw(rows): Promise<{ inserted: number }> {
        if (rows.length === 0) return { inserted: 0 };
        const sb = getServiceClient();
        const { data, error } = await sb
          .from('telegram_raw')
          .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
          .select('id');
        if (error) {
          console.error('[db:supabase] telegram_raw insert error:', error.message);
          return { inserted: 0 };
        }
        return { inserted: data?.length || 0 };
      },

      async getExistingLinks(links): Promise<Set<string>> {
        if (links.length === 0) return new Set();
        const sb = getServiceClient();
        const set = new Set<string>();
        for (let i = 0; i < links.length; i += 500) {
          const batch = links.slice(i, i + 500);
          const { data } = await sb.from('telegram_raw').select('link').in('link', batch);
          if (data) data.forEach((d: { link: string }) => set.add(d.link));
        }
        return set;
      },

      async getRawPosts(opts): Promise<QueryResult<TelegramRawRow[]>> {
        const sb = getServiceClient();
        let query = sb.from('telegram_raw').select('*');
        if (opts.channel) query = query.eq('channel', opts.channel);
        if (opts.since) query = query.gte('pub_date', opts.since);
        if (opts.until) query = query.lte('pub_date', opts.until);
        query = query.order('pub_date', { ascending: false, nullsFirst: false });
        if (opts.limit) query = query.limit(opts.limit);
        if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 100) - 1);
        const { data, error } = await query;
        return { data: data as TelegramRawRow[] | null, error };
      },

      async getRawCount(opts): Promise<number> {
        const sb = getServiceClient();
        let query = sb.from('telegram_raw').select('*', { count: 'exact', head: true });
        if (opts?.channel) query = query.eq('channel', opts.channel);
        if (opts?.since) query = query.gte('pub_date', opts.since);
        const { count } = await query;
        return count || 0;
      },

      async getChannelStats() {
        // Supabase doesn't support GROUP BY natively in the JS client,
        // so we'd need an RPC function. For now, return empty.
        return [];
      },
    },

    // ── Sources library ──────────────────────────────────────
    sources: {
      async insert(rows): Promise<QueryResult<SourceRow[]>> {
        if (rows.length === 0) return { data: [], error: null };
        const sb = getServiceClient();
        const { data, error } = await sb.from('sources').insert(rows).select('*');
        return { data: data as SourceRow[] | null, error };
      },

      async getAll(opts): Promise<QueryResult<SourceRow[]>> {
        const sb = getServiceClient();
        let query = sb.from('sources').select('*');
        if (opts?.type) query = query.eq('source_type', opts.type);
        if (opts?.tag) query = query.contains('tags', [opts.tag]);
        query = query.order('created_at', { ascending: false });
        if (opts?.limit) query = query.limit(opts.limit);
        const { data, error } = await query;
        return { data: data as SourceRow[] | null, error };
      },

      async search(query): Promise<QueryResult<SourceRow[]>> {
        const sb = getServiceClient();
        const { data, error } = await sb
          .from('sources')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,author.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(50);
        return { data: data as SourceRow[] | null, error };
      },

      async update(id, data): Promise<QueryResult<SourceRow>> {
        const sb = getServiceClient();
        const { data: row, error } = await sb
          .from('sources')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();
        return { data: row as SourceRow | null, error };
      },

      async delete(id): Promise<void> {
        const sb = getServiceClient();
        await sb.from('sources').delete().eq('id', id);
      },
    },
  };
}
