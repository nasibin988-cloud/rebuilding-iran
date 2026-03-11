#!/usr/bin/env node
/**
 * Backfill news articles from Google News RSS into Supabase news_feed table.
 *
 * Splits Jan 1 2026 to today into 2-week chunks and queries multiple keyword
 * sets (English + Farsi) against Google News RSS date-range search. For each
 * new article: fetches full text, summarises via Grok, inserts into DB.
 *
 * Usage:
 *   node scripts/backfill-google-news.js
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, XAI_API_KEY
 */

const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const START_DATE = new Date('2026-01-01');
const CHUNK_DAYS = 14;
const MODEL = 'grok-4-1-fast-reasoning';
const RSS_DELAY_MS = 1000;
const ARTICLE_BATCH_SIZE = 5;
const ARTICLE_BATCH_DELAY_MS = 200;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const EN_KEYWORDS = [
  '"iran"',
  '"iran nuclear"',
  '"iran military strike"',
  '"IRGC" OR "sepah" OR "pahlavi"',
  '"israel iran hezbollah"',
  '"iran sanctions"',
  '"tehran" OR "isfahan" OR "shiraz"',
  '"middle east war"',
  '"iran protests" OR "iran revolution"',
  '"iran oil" OR "strait of hormuz"',
];

const FA_KEYWORDS = [
  '"ایران"',
  '"سپاه" OR "خامنه‌ای"',
  '"تهران" OR "اصفهان"',
];

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Generate 2-week chunks from START_DATE to today. */
function generateChunks() {
  const chunks = [];
  const now = new Date();
  let cursor = new Date(START_DATE);
  while (cursor < now) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + CHUNK_DAYS);
    const chunkEnd = end > now ? now : end;
    chunks.push({ after: formatDate(cursor), before: formatDate(chunkEnd) });
    cursor = new Date(chunkEnd);
  }
  return chunks;
}

/** Build a Google News RSS URL. */
function buildRssUrl(keywords, after, before, lang = 'en') {
  const q = encodeURIComponent(`${keywords} after:${after} before:${before}`);
  if (lang === 'fa') {
    return `https://news.google.com/rss/search?q=${q}&hl=fa&gl=IR&ceid=IR:fa`;
  }
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

/** Extract content of an XML tag (first occurrence). */
function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

/** Parse Google News RSS XML into article objects. */
function parseGoogleNewsRSS(xml) {
  const articles = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link');
    const pubDate = extractTag(item, 'pubDate');
    const desc = extractTag(item, 'description');

    if (title && link) {
      // Extract source from "Title - Source Name" pattern
      const sourceMatch = title.match(/\s+-\s+([^-]+)$/);
      const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
      const cleanTitle = sourceMatch
        ? title.replace(/\s+-\s+[^-]+$/, '').trim()
        : title;

      articles.push({
        title: cleanTitle,
        link,
        pubDate,
        description: desc,
        source,
      });
    }
  }
  return articles;
}

/** Normalize a URL by stripping tracking params, www, etc. */
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    for (const p of [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
    ]) {
      u.searchParams.delete(p);
    }
    u.hostname = u.hostname.replace(/^www\./, '');
    u.protocol = 'https:';
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

/** Strip HTML to plain text, favouring <article> content. */
function extractArticleText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  if (articleMatch) text = articleMatch[1];

  text = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, 100000);
}

/** Fetch a URL with timeout and redirect-following. */
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Resolve a Google News redirect link to the real article URL. */
async function resolveGoogleNewsLink(gnLink) {
  try {
    const res = await fetchWithTimeout(gnLink);
    // The final URL after redirects is the real article URL
    return normalizeUrl(res.url);
  } catch {
    return normalizeUrl(gnLink);
  }
}

/** Summarise article text with Grok. */
async function summariseWithGrok(title, text, attempt = 0) {
  const truncated = text.slice(0, 8000);
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You are a concise news summarizer focused on Iran and the Middle East.
Return a JSON object with exactly two fields:
- "summary": 2-3 sentence summary. Neutral and factual.
- "relevance": integer 1-3.
  3 = KEY NEWS: major strikes, regime changes, nuclear events
  2 = IMPORTANT: diplomacy, military ops, sanctions, protests
  1 = RELEVANT: general coverage, routine updates
Return ONLY valid JSON, no markdown fences.`,
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nArticle text:\n${truncated}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Grok ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return { summary: '', relevance: 1 };

    // Strip markdown fences if present despite instructions
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || '',
      relevance: [1, 2, 3].includes(parsed.relevance) ? parsed.relevance : 1,
    };
  } catch (err) {
    if (
      attempt < MAX_RETRIES &&
      (err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('capacity'))
    ) {
      const wait = (attempt + 1) * 5000;
      console.log(`    Grok retry ${attempt + 1} after ${wait / 1000}s...`);
      await sleep(wait);
      return summariseWithGrok(title, text, attempt + 1);
    }
    console.error(`    Grok error: ${err.message.slice(0, 100)}`);
    return { summary: '', relevance: 1 };
  }
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Google News RSS Backfill ===');
  console.log(`Range: ${formatDate(START_DATE)} to ${formatDate(new Date())}`);
  console.log(`Keywords: ${EN_KEYWORDS.length} EN + ${FA_KEYWORDS.length} FA`);

  // Validate env
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'XAI_API_KEY']) {
    if (!process.env[key]) {
      console.error(`Missing env var: ${key}`);
      process.exit(1);
    }
  }

  const chunks = generateChunks();
  console.log(`Time chunks: ${chunks.length} x ${CHUNK_DAYS}-day periods\n`);

  // Build all RSS queries
  const queries = [];
  for (const chunk of chunks) {
    for (const kw of EN_KEYWORDS) {
      queries.push({ keywords: kw, ...chunk, lang: 'en' });
    }
    for (const kw of FA_KEYWORDS) {
      queries.push({ keywords: kw, ...chunk, lang: 'fa' });
    }
  }

  console.log(`Total RSS queries: ${queries.length}\n`);

  // ------ Phase 1: Fetch all RSS feeds and collect unique articles ------
  const seenLinks = new Map(); // link -> article object
  let rssErrors = 0;

  for (let qi = 0; qi < queries.length; qi++) {
    const q = queries[qi];
    const url = buildRssUrl(q.keywords, q.after, q.before, q.lang);
    const label = `[${qi + 1}/${queries.length}] ${q.after}..${q.before} ${q.lang.toUpperCase()} ${q.keywords.slice(0, 40)}`;

    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.log(`${label} -- HTTP ${res.status}`);
        rssErrors++;
        await sleep(RSS_DELAY_MS);
        continue;
      }

      const xml = await res.text();
      const articles = parseGoogleNewsRSS(xml);

      let newCount = 0;
      for (const art of articles) {
        if (!seenLinks.has(art.link)) {
          seenLinks.set(art.link, { ...art, lang: q.lang });
          newCount++;
        }
      }

      process.stdout.write(`${label} -- ${articles.length} items (${newCount} new)\n`);
    } catch (err) {
      console.log(`${label} -- Error: ${err.message.slice(0, 80)}`);
      rssErrors++;
    }

    await sleep(RSS_DELAY_MS);
  }

  console.log(`\nRSS phase complete: ${seenLinks.size} unique articles from Google News (${rssErrors} errors)\n`);

  if (seenLinks.size === 0) {
    console.log('No articles found. Exiting.');
    return;
  }

  // ------ Phase 2: Dedup against Supabase ------
  // Google News links are redirects, so we first resolve them and then dedup
  // We'll dedup in batches by checking existing links

  const allArticles = Array.from(seenLinks.values());

  // Resolve Google News redirect links to real URLs
  console.log('Resolving Google News redirect links...');
  const resolvedArticles = [];
  for (let i = 0; i < allArticles.length; i += ARTICLE_BATCH_SIZE) {
    const batch = allArticles.slice(i, i + ARTICLE_BATCH_SIZE);
    const resolved = await Promise.all(
      batch.map(async (art) => {
        try {
          const realUrl = await resolveGoogleNewsLink(art.link);
          return { ...art, link: realUrl, googleLink: art.link };
        } catch {
          return { ...art, googleLink: art.link };
        }
      })
    );
    resolvedArticles.push(...resolved);
    process.stdout.write(`  Resolved ${Math.min(i + ARTICLE_BATCH_SIZE, allArticles.length)}/${allArticles.length}\r`);
    await sleep(ARTICLE_BATCH_DELAY_MS);
  }
  console.log(`\n  Resolved ${resolvedArticles.length} links`);

  // Re-dedup after resolution (different Google News links may resolve to same article)
  const dedupMap = new Map();
  for (const art of resolvedArticles) {
    const norm = normalizeUrl(art.link);
    if (!dedupMap.has(norm)) {
      dedupMap.set(norm, { ...art, link: norm });
    }
  }
  const uniqueArticles = Array.from(dedupMap.values());
  console.log(`  After URL normalization: ${uniqueArticles.length} unique articles`);

  // Check Supabase for existing links
  const existingLinks = new Set();
  const allLinks = uniqueArticles.map(a => a.link);
  for (let i = 0; i < allLinks.length; i += 500) {
    const batch = allLinks.slice(i, i + 500);
    const { data, error } = await supabase
      .from('news_feed')
      .select('link')
      .in('link', batch);
    if (error) {
      console.error(`  Dedup query error: ${error.message}`);
    }
    if (data) data.forEach(d => existingLinks.add(d.link));
  }

  const newArticles = uniqueArticles.filter(a => !existingLinks.has(a.link));
  console.log(`  Already in DB: ${existingLinks.size}, New to process: ${newArticles.length}\n`);

  if (newArticles.length === 0) {
    console.log('All articles already in DB. Done.');
    return;
  }

  // ------ Phase 3: Fetch article text, summarise, insert ------
  let totalInserted = 0;
  let totalFetchErrors = 0;
  let totalSummarised = 0;

  for (let i = 0; i < newArticles.length; i += ARTICLE_BATCH_SIZE) {
    const batch = newArticles.slice(i, i + ARTICLE_BATCH_SIZE);
    const batchNum = Math.floor(i / ARTICLE_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(newArticles.length / ARTICLE_BATCH_SIZE);

    process.stdout.write(
      `Batch ${batchNum}/${totalBatches} (articles ${i + 1}-${Math.min(i + ARTICLE_BATCH_SIZE, newArticles.length)})...`
    );

    // Fetch article HTML in parallel
    const fetchResults = await Promise.all(
      batch.map(async (art) => {
        try {
          const res = await fetchWithTimeout(art.link);
          if (!res.ok) return { ...art, fullText: '', fetchError: true };
          const html = await res.text();
          const fullText = extractArticleText(html);
          return { ...art, fullText, fetchError: false };
        } catch {
          return { ...art, fullText: '', fetchError: true };
        }
      })
    );

    const fetched = fetchResults.filter(r => !r.fetchError && r.fullText.length > 100);
    const fetchErrors = fetchResults.filter(r => r.fetchError).length;
    totalFetchErrors += fetchErrors;

    // Summarise each article with Grok (sequentially to respect rate limits)
    const rows = [];
    for (const art of fetched) {
      const { summary, relevance } = await summariseWithGrok(art.title, art.fullText);
      totalSummarised++;

      rows.push({
        link: art.link,
        title: art.title,
        source: art.source,
        description: art.description?.slice(0, 1000) || '',
        pub_date: art.pubDate ? new Date(art.pubDate).toISOString() : null,
        bias: 0,
        paywall: false,
        summary: summary || null,
        lang: art.lang,
        relevance,
        type: 'rss',
        full_text: art.fullText.slice(0, 100000),
      });
    }

    // Also insert articles where fetch failed (no full_text/summary but still tracked)
    for (const art of fetchResults.filter(r => r.fetchError || r.fullText.length <= 100)) {
      rows.push({
        link: art.link,
        title: art.title,
        source: art.source,
        description: art.description?.slice(0, 1000) || '',
        pub_date: art.pubDate ? new Date(art.pubDate).toISOString() : null,
        bias: 0,
        paywall: false,
        summary: null,
        lang: art.lang,
        relevance: 1,
        type: 'rss',
        full_text: null,
      });
    }

    if (rows.length > 0) {
      const { error, data: inserted } = await supabase
        .from('news_feed')
        .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.log(` insert error: ${error.message.slice(0, 100)}`);
      } else {
        totalInserted += inserted?.length || 0;
      }
    }

    console.log(
      ` ${fetched.length} fetched, ${fetchErrors} failed, ${rows.length} inserted`
    );

    await sleep(ARTICLE_BATCH_DELAY_MS);
  }

  // ------ Final summary ------
  console.log('\n=== Backfill Complete ===');
  console.log(`RSS articles found:  ${seenLinks.size}`);
  console.log(`After dedup:         ${uniqueArticles.length}`);
  console.log(`New articles:        ${newArticles.length}`);
  console.log(`Summarised by Grok:  ${totalSummarised}`);
  console.log(`Fetch errors:        ${totalFetchErrors}`);
  console.log(`Inserted into DB:    ${totalInserted}`);

  // Show DB stats
  const { data: stats, error: statsError } = await supabase
    .from('news_feed')
    .select('source, type, pub_date')
    .eq('type', 'rss')
    .order('pub_date', { ascending: true });

  if (!statsError && stats && stats.length > 0) {
    const bySource = {};
    for (const row of stats) {
      const s = row.source || 'Unknown';
      if (!bySource[s]) bySource[s] = { count: 0, oldest: row.pub_date, newest: row.pub_date };
      bySource[s].count++;
      bySource[s].newest = row.pub_date;
    }

    console.log(`\nDB coverage (RSS articles by source):`);
    const sorted = Object.entries(bySource).sort((a, b) => b[1].count - a[1].count);
    for (const [src, info] of sorted.slice(0, 20)) {
      console.log(
        `  ${src}: ${info.count} articles (${(info.oldest || '').slice(0, 10)} to ${(info.newest || '').slice(0, 10)})`
      );
    }
    if (sorted.length > 20) {
      console.log(`  ... and ${sorted.length - 20} more sources`);
    }
    console.log(`  Total RSS articles in DB: ${stats.length}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
