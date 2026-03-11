#!/usr/bin/env node
/**
 * Backfill news articles from GDELT DOC 2.0 API into the Supabase news_feed table.
 *
 * Queries multiple keyword sets across weekly date chunks from Jan 1 2026 to today,
 * fetches article HTML, extracts text, summarizes via Grok, and inserts into Supabase.
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL   - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase service role key
 *   XAI_API_KEY                - xAI API key for Grok summaries
 *
 * Usage:
 *   node scripts/backfill-gdelt.js
 */

const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_MAX_RECORDS = 250;
const GDELT_DELAY_MS = 500;
const FETCH_DELAY_MS = 200;
const FETCH_CONCURRENCY = 5;
const INSERT_BATCH_SIZE = 25;
const MAX_TEXT_LENGTH = 100000;
const FETCH_TIMEOUT_MS = 15000;
const GROK_MODEL = 'grok-4-1-fast-reasoning';
const GROK_BASE_URL = 'https://api.x.ai/v1';

const START_DATE = new Date('2026-01-01T00:00:00Z');

const KEYWORD_SETS = [
  'iran',
  'iranian IRGC tehran isfahan',
  'israel hezbollah middle east war',
  'nuclear sanctions iran',
  'tehran military strike',
];

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const xaiKey = process.env.XAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!xaiKey) {
  console.error('Missing XAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatGdeltDate(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

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

/** Split [start, end) into weekly chunks. */
function weeklyChunks(start, end) {
  const chunks = [];
  let cur = new Date(start);
  while (cur < end) {
    const chunkEnd = new Date(Math.min(cur.getTime() + 7 * 24 * 60 * 60 * 1000, end.getTime()));
    chunks.push({ start: new Date(cur), end: chunkEnd });
    cur = chunkEnd;
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// GDELT fetching
// ---------------------------------------------------------------------------

async function queryGdelt(keywords, startDate, endDate) {
  const params = new URLSearchParams({
    query: keywords,
    mode: 'artlist',
    maxrecords: String(GDELT_MAX_RECORDS),
    startdatetime: formatGdeltDate(startDate),
    enddatetime: formatGdeltDate(endDate),
    format: 'json',
  });
  const url = `${GDELT_BASE}?${params}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`  GDELT ${res.status} for "${keywords}" (${formatGdeltDate(startDate)}-${formatGdeltDate(endDate)})`);
      return [];
    }
    const text = await res.text();
    if (!text.trim()) return [];
    const data = JSON.parse(text);
    return data.articles || [];
  } catch (err) {
    console.warn(`  GDELT fetch error for "${keywords}": ${err.message}`);
    return [];
  }
}

async function collectAllArticles() {
  const now = new Date();
  const chunks = weeklyChunks(START_DATE, now);
  const seen = new Map(); // normalized URL -> article info

  console.log(`Querying GDELT: ${chunks.length} weekly chunks x ${KEYWORD_SETS.length} keyword sets = ${chunks.length * KEYWORD_SETS.length} queries`);

  let queryCount = 0;
  for (const chunk of chunks) {
    const label = `${chunk.start.toISOString().slice(0, 10)} to ${chunk.end.toISOString().slice(0, 10)}`;
    for (const keywords of KEYWORD_SETS) {
      queryCount++;
      const articles = await queryGdelt(keywords, chunk.start, chunk.end);
      let added = 0;
      for (const a of articles) {
        if (!a.url) continue;
        const norm = normalizeUrl(a.url);
        if (!seen.has(norm)) {
          seen.set(norm, {
            url: a.url,
            normalizedUrl: norm,
            title: a.title || '',
            seendate: a.seendate || null,
            domain: a.domain || '',
            language: a.language || 'English',
            sourcecountry: a.sourcecountry || '',
          });
          added++;
        }
      }
      if (articles.length > 0) {
        console.log(`  [${queryCount}] "${keywords}" ${label}: ${articles.length} results, ${added} new (total unique: ${seen.size})`);
      }
      await sleep(GDELT_DELAY_MS);
    }
  }

  console.log(`\nGDELT collection complete: ${seen.size} unique articles from ${queryCount} queries`);
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Existing URL check (batch)
// ---------------------------------------------------------------------------

async function filterExistingUrls(articles) {
  const urls = articles.map(a => a.normalizedUrl);
  const existing = new Set();

  // Check in batches of 500 (Supabase IN filter limit)
  for (let i = 0; i < urls.length; i += 500) {
    const batch = urls.slice(i, i + 500);
    const { data, error } = await supabase
      .from('news_feed')
      .select('link')
      .in('link', batch);
    if (error) {
      console.warn(`  Supabase check error: ${error.message}`);
      continue;
    }
    for (const row of (data || [])) {
      existing.add(row.link);
    }
  }

  const filtered = articles.filter(a => !existing.has(a.normalizedUrl));
  console.log(`Already in DB: ${existing.size}. New to fetch: ${filtered.length}`);
  return filtered;
}

// ---------------------------------------------------------------------------
// Article text extraction
// ---------------------------------------------------------------------------

function extractArticleText(html) {
  // Remove script, style, nav, header, footer, aside tags and their content
  let text = html;
  for (const tag of ['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'svg']) {
    text = text.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  }

  // Try to find <article> content first
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  }

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Cap length
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  return text;
}

async function fetchArticleHtml(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Grok summarization
// ---------------------------------------------------------------------------

const SUMMARIZE_SYSTEM_PROMPT = `You are a concise news summarizer focused on Iran and the Middle East.
Return a JSON object with exactly two fields:
- "summary": 2-3 sentence summary capturing the key facts. Be neutral and factual.
- "relevance": integer 1-3 importance rating. Be strict -- 3 is rare.
  3 = KEY NEWS: major military strikes on Iran, regime leadership killed/fallen, war declarations, nuclear developments
  2 = IMPORTANT: notable Iran-related diplomacy, significant military operations, sanctions changes, major protests
  1 = RELEVANT: general Middle East coverage, routine updates, tangential mentions
Return ONLY valid JSON, no markdown fences.`;

async function summarizeWithGrok(title, text) {
  const truncated = text.slice(0, 4000);
  const userMsg = `Title: ${title}\n\nArticle text:\n${truncated}`;

  try {
    const res = await fetch(`${GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`  Grok API ${res.status}: ${errText.slice(0, 200)}`);
      return { summary: '', relevance: 1 };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
      }
    }

    if (parsed && typeof parsed.summary === 'string') {
      return {
        summary: parsed.summary,
        relevance: Math.min(3, Math.max(1, parseInt(parsed.relevance) || 1)),
      };
    }

    return { summary: content.slice(0, 500), relevance: 1 };
  } catch (err) {
    console.warn(`  Grok error: ${err.message}`);
    return { summary: '', relevance: 1 };
  }
}

// ---------------------------------------------------------------------------
// Parse GDELT seendate into a Date
// ---------------------------------------------------------------------------

function parseSeendate(seendate) {
  if (!seendate) return null;
  // GDELT format: "YYYYMMDDTHHmmssZ" or variations
  try {
    // Try ISO parse first
    const d = new Date(seendate);
    if (!isNaN(d.getTime())) return d;
  } catch { /* fall through */ }
  // Try manual parse: "20260115T143000Z"
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})/);
  if (m) {
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  }
  return null;
}

/** Map GDELT language name to 2-letter code. */
function langCode(gdeltLang) {
  if (!gdeltLang) return 'en';
  const lower = gdeltLang.toLowerCase();
  const map = {
    english: 'en', persian: 'fa', farsi: 'fa', arabic: 'ar', french: 'fr',
    german: 'de', spanish: 'es', turkish: 'tr', hebrew: 'he', russian: 'ru',
    chinese: 'zh', japanese: 'ja', korean: 'ko', italian: 'it', portuguese: 'pt',
    dutch: 'nl', urdu: 'ur', hindi: 'hi', swedish: 'sv', norwegian: 'no',
  };
  return map[lower] || lower.slice(0, 2) || 'en';
}

// ---------------------------------------------------------------------------
// Process articles in batches
// ---------------------------------------------------------------------------

async function processArticles(articles) {
  let fetched = 0;
  let inserted = 0;
  let failed = 0;
  let skippedNoText = 0;
  const insertBuffer = [];

  for (let i = 0; i < articles.length; i += FETCH_CONCURRENCY) {
    const batch = articles.slice(i, i + FETCH_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (article, idx) => {
        // Stagger fetches within the batch
        if (idx > 0) await sleep(FETCH_DELAY_MS * idx);

        const html = await fetchArticleHtml(article.url);
        if (!html) return null;

        const text = extractArticleText(html);
        if (!text || text.length < 50) return null;

        const { summary, relevance } = await summarizeWithGrok(article.title, text);

        return {
          link: article.normalizedUrl,
          title: article.title || text.slice(0, 120),
          source: article.domain,
          description: text.slice(0, 500),
          pub_date: parseSeendate(article.seendate)?.toISOString() || null,
          bias: 0,
          paywall: false,
          lang: langCode(article.language),
          relevance,
          type: 'rss',
          summary: summary || null,
          full_text: text,
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        insertBuffer.push(result.value);
        fetched++;
      } else if (result.status === 'fulfilled' && !result.value) {
        skippedNoText++;
      } else {
        failed++;
      }
    }

    // Flush insert buffer when it's large enough
    if (insertBuffer.length >= INSERT_BATCH_SIZE) {
      const toInsert = insertBuffer.splice(0, INSERT_BATCH_SIZE);
      const count = await insertBatch(toInsert);
      inserted += count;
    }

    const total = fetched + skippedNoText + failed;
    if (total % 20 === 0 || i + FETCH_CONCURRENCY >= articles.length) {
      console.log(`  Progress: ${total}/${articles.length} processed, ${fetched} fetched, ${inserted} inserted, ${skippedNoText} no text, ${failed} failed`);
    }
  }

  // Flush remaining
  if (insertBuffer.length > 0) {
    const count = await insertBatch(insertBuffer);
    inserted += count;
  }

  return { fetched, inserted, skippedNoText, failed };
}

async function insertBatch(rows) {
  if (rows.length === 0) return 0;

  const { data, error } = await supabase
    .from('news_feed')
    .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.warn(`  Insert error: ${error.message}`);
    // Try one-by-one as fallback
    let count = 0;
    for (const row of rows) {
      const { error: singleErr } = await supabase
        .from('news_feed')
        .upsert([row], { onConflict: 'link', ignoreDuplicates: true });
      if (!singleErr) count++;
    }
    return count;
  }

  return data?.length || rows.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== GDELT News Backfill ===');
  console.log(`Date range: ${START_DATE.toISOString().slice(0, 10)} to ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Keyword sets: ${KEYWORD_SETS.length}`);
  console.log(`Supabase: ${supabaseUrl}`);
  console.log('');

  // 1. Collect articles from GDELT
  const allArticles = await collectAllArticles();
  if (allArticles.length === 0) {
    console.log('No articles found from GDELT. Exiting.');
    return;
  }

  // 2. Filter out already-existing URLs
  const newArticles = await filterExistingUrls(allArticles);
  if (newArticles.length === 0) {
    console.log('All articles already in database. Nothing to do.');
    return;
  }

  // 3. Fetch, extract, summarize, and insert
  console.log(`\nProcessing ${newArticles.length} new articles...`);
  const stats = await processArticles(newArticles);

  // 4. Final summary
  console.log('\n=== GDELT Backfill Complete ===');
  console.log(`  GDELT articles found:  ${allArticles.length}`);
  console.log(`  Already in DB:         ${allArticles.length - newArticles.length}`);
  console.log(`  New articles to fetch: ${newArticles.length}`);
  console.log(`  Successfully fetched:  ${stats.fetched}`);
  console.log(`  Inserted into DB:      ${stats.inserted}`);
  console.log(`  Skipped (no text):     ${stats.skippedNoText}`);
  console.log(`  Failed:                ${stats.failed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
