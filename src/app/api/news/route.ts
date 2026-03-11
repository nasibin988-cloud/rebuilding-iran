import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const lang = params.get('lang') || 'en';
    const type = params.get('type') || 'rss';
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('news_feed')
      .select('link, title, source, description, pub_date, bias, paywall, summary, lang, relevance, type')
      .eq('type', type)
      .order('pub_date', { ascending: false, nullsFirst: false });

    // For RSS, filter by language; for Telegram, return all
    if (type === 'rss' && lang !== 'all') {
      query = query.eq('lang', lang);
    }

    const [articlesResult, metaResult] = await Promise.all([
      query,
      supabase.from('news_meta').select('value').eq('key', 'last_refresh').single(),
    ]);

    if (articlesResult.error) {
      console.error('News API error:', articlesResult.error);
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }

    const items = (articlesResult.data || []).map(row => ({
      title: row.title,
      link: row.link,
      source: row.source,
      pubDate: row.pub_date || '',
      description: row.description || '',
      paywall: row.paywall || false,
      summary: row.summary || undefined,
      bias: row.bias,
      relevance: row.relevance || 1,
    }));

    const lastRefresh = metaResult.data?.value || null;

    return NextResponse.json({ items, lang, type, lastRefresh });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Failed to fetch news feeds' }, { status: 500 });
  }
}
