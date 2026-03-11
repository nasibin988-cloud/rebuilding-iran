#!/usr/bin/env node
/**
 * Backfill news articles from the Wayback Machine CDX API, Times of Israel
 * date archives, and The Guardian Iran section into the Supabase news_feed table.
 *
 * Usage: node scripts/backfill-archives.js
 * (Requires .env.local to be sourced first, or env vars set directly)
 *
 * Environment: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, XAI_API_KEY
 */

const { createClient } = require('@supabase/supabase-js');

// ── Config ──────────────────────────────────────────────────────
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 300;
const MODEL = 'grok-4-1-fast-reasoning';
const XAI_BASE = 'https://api.x.ai/v1/chat/completions';

const CDX_DOMAINS = [
  'timesofisrael.com',
  'reuters.com/world/middle-east',
  'bbc.co.uk/news/world-middle-east',
  'theguardian.com/world/iran',
  'aljazeera.com/news',
  'jpost.com',
];

// Non-article path patterns to skip
const SKIP_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|mjs|json|xml|pdf|mp4|mp3|webm|ogg|avi|mov|woff2?|ttf|eot|zip|gz|tar|rss|atom)(\?.*)?$/i;
const SKIP_PATHS = /(\/robots\.txt|\/sitemap|\/feed\b|\/rss\b|\/tag\/|\/category\/|\/author\/|\/page\/\d|\/search\?|\/wp-content\/|\/wp-admin\/|\/wp-json\/|\/cdn-cgi\/|\/static\/|\/assets\/|\/images\/|\/img\/|\/video\/|\/videos\/|\/gallery\/|\/podcast|\/newsletter|\/subscribe|\/login|\/register|\/404|\/favicon)/i;

// ── Clients ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Counters ────────────────────────────────────────────────────
const stats = {
  cdxFetched: 0,
  cdxArticles: 0,
  toiFetched: 0,
  toiArticles: 0,
  guardianFetched: 0,
  guardianArticles: 0,
  duplicatesSkipped: 0,
  fetchErrors: 0,
  grokErrors: 0,
  inserted: 0,
};

// ── URL normalization ───────────────────────────────────────────
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

// ── Article URL filter ──────────────────────────────────────────
function looksLikeArticle(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;

    // Skip known non-article extensions and paths
    if (SKIP_EXTENSIONS.test(path)) return false;
    if (SKIP_PATHS.test(path)) return false;

    // Must have a meaningful path (not just domain root)
    if (path === '/' || path === '') return false;

    // Should have at least 2 path segments or a slug-like segment
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return false;

    // The last segment should look like a slug (contains letters, dashes/hyphens)
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && /^[a-z0-9][-a-z0-9]{5,}/i.test(lastSeg)) return true;

    // Or contains a date pattern in path (YYYY/MM/DD or YYYYMMDD)
    if (/\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return true;

    // At least some depth and some letters
    if (segments.length >= 2 && /[a-z]{3,}/i.test(lastSeg)) return true;

    return false;
  } catch {
    return false;
  }
}

// ── Article text extraction ─────────────────────────────────────
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
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, 100000);
}

// ── Title extraction ────────────────────────────────────────────
function extractTitle(html) {
  // Try og:title first
  const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogMatch) return ogMatch[1].trim();

  // Fallback to <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].replace(/\s*[-|].*$/, '').trim();

  return null;
}

// ── Published date extraction ───────────────────────────────────
function extractPublishedDate(html) {
  // Try common meta tags
  for (const prop of ['article:published_time', 'datePublished', 'date', 'DC.date.issued']) {
    const match = html.match(new RegExp(`<meta[^>]*(?:property|name|itemprop)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${prop}["']`, 'i'));
    if (match) return match[1];
  }

  // Try JSON-LD
  const ldMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  if (ldMatch) return ldMatch[1];

  return null;
}

// ── Source label from URL ───────────────────────────────────────
function sourceFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const map = {
      'timesofisrael.com': 'Times of Israel',
      'reuters.com': 'Reuters',
      'bbc.co.uk': 'BBC',
      'bbc.com': 'BBC',
      'theguardian.com': 'The Guardian',
      'aljazeera.com': 'Al Jazeera',
      'jpost.com': 'Jerusalem Post',
    };
    return map[host] || host;
  } catch {
    return 'Unknown';
  }
}

// ── Fetch with timeout & retry ──────────────────────────────────
async function robustFetch(url, opts = {}) {
  const { retries = 2, timeoutMs = 15000 } = opts;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RebuildingIranBot/1.0)',
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * (attempt + 1));
    }
  }
}

// ── Grok summarization ─────────────────────────────────────────
async function summarizeWithGrok(articleText, title) {
  const prompt = title
    ? `Title: ${title}\n\nArticle:\n${articleText.slice(0, 8000)}`
    : articleText.slice(0, 8000);

  try {
    const res = await fetch(XAI_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a concise news summarizer focused on Iran and the Middle East.
Return a JSON object with exactly two fields:
- "summary": 2-3 sentence summary. Be neutral and factual.
- "relevance": integer 1-3 importance rating.
  3 = KEY NEWS: major military strikes, regime changes, nuclear events
  2 = IMPORTANT: diplomacy, military ops, sanctions, protests
  1 = RELEVANT: general coverage, routine updates
Return ONLY valid JSON, no markdown fences.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      stats.grokErrors++;
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) { stats.grokErrors++; return null; }

    // Strip markdown fences if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    stats.grokErrors++;
    console.error('  Grok error:', err.message);
    return null;
  }
}

// ── Batch dedup check ───────────────────────────────────────────
async function filterExistingUrls(urls) {
  if (urls.length === 0) return new Set();

  // Query in batches of 100 to avoid RPC limits
  const existing = new Set();
  for (let i = 0; i < urls.length; i += 100) {
    const batch = urls.slice(i, i + 100);
    const { data, error } = await supabase
      .from('news_feed')
      .select('link')
      .in('link', batch);

    if (error) {
      console.error('  Dedup query error:', error.message);
      continue;
    }
    for (const row of data || []) {
      existing.add(row.link);
    }
  }
  return existing;
}

// ── Process a batch of article URLs ─────────────────────────────
async function processArticles(articleUrls, waybackMap = {}) {
  // Normalize and deduplicate locally
  const urlMap = new Map();
  for (const raw of articleUrls) {
    const norm = normalizeUrl(raw);
    if (!urlMap.has(norm)) {
      urlMap.set(norm, { original: raw, waybackTs: waybackMap[raw] || null });
    }
  }

  const allNormalized = [...urlMap.keys()];
  const existing = await filterExistingUrls(allNormalized);
  const toProcess = allNormalized.filter(u => !existing.has(u));
  stats.duplicatesSkipped += allNormalized.length - toProcess.length;

  if (toProcess.length === 0) return;

  // Process in concurrent batches
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (normUrl) => {
        const info = urlMap.get(normUrl);
        let html = null;

        // Try original URL first
        try {
          html = await robustFetch(info.original, { retries: 1, timeoutMs: 12000 });
        } catch {
          // Fall back to Wayback Machine if we have a timestamp
          if (info.waybackTs) {
            try {
              const wbUrl = `https://web.archive.org/web/${info.waybackTs}/${info.original}`;
              html = await robustFetch(wbUrl, { retries: 1, timeoutMs: 15000 });
            } catch {
              // give up
            }
          }
        }

        if (!html || html.length < 500) {
          stats.fetchErrors++;
          return null;
        }

        const text = extractArticleText(html);
        if (text.length < 100) {
          stats.fetchErrors++;
          return null;
        }

        const title = extractTitle(html);
        const pubDate = extractPublishedDate(html);
        const source = sourceFromUrl(normUrl);

        // Summarize
        const grokResult = await summarizeWithGrok(text, title);
        if (!grokResult) return null;

        // Insert
        const row = {
          link: normUrl,
          source,
          channel: source,
          channel_label: source,
          title: title || grokResult.summary?.split('.')[0] || 'Untitled',
          summary: grokResult.summary || '',
          relevance: grokResult.relevance || 1,
          pub_date: pubDate || new Date().toISOString(),
          raw_text: text.slice(0, 5000),
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('news_feed').insert(row);
        if (error) {
          // Might be unique constraint violation (race condition duplicate)
          if (error.code === '23505') {
            stats.duplicatesSkipped++;
          } else {
            console.error('  Insert error:', error.message, '| URL:', normUrl);
          }
          return null;
        }

        stats.inserted++;
        return normUrl;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    if (succeeded > 0) {
      process.stdout.write(`  +${succeeded} `);
    }

    if (i + CONCURRENCY < toProcess.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }
}

// ── Utility ─────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function dateBetween(start, end) {
  const dates = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// ═════════════════════════════════════════════════════════════════
// PART 1: Wayback Machine CDX API
// ═════════════════════════════════════════════════════════════════
async function runWaybackCDX() {
  console.log('\n======================================');
  console.log('PART 1: Wayback Machine CDX API');
  console.log('======================================\n');

  for (const domain of CDX_DOMAINS) {
    console.log(`\n[CDX] Querying: ${domain}`);

    const cdxUrl =
      `https://web.archive.org/cdx/search/cdx` +
      `?url=${encodeURIComponent(domain)}/*` +
      `&output=json&from=20260101&to=20260311` +
      `&limit=5000&filter=statuscode:200` +
      `&fl=timestamp,original&collapse=urlkey`;

    let rows;
    try {
      const text = await robustFetch(cdxUrl, { retries: 2, timeoutMs: 30000 });
      rows = JSON.parse(text);
    } catch (err) {
      console.error(`  CDX fetch failed for ${domain}: ${err.message}`);
      continue;
    }

    // First row is header
    if (!rows || rows.length < 2) {
      console.log(`  No results for ${domain}`);
      continue;
    }

    // Build URL -> timestamp map, filter to articles
    const waybackMap = {};
    const articleUrls = [];

    for (let i = 1; i < rows.length; i++) {
      const [timestamp, original] = rows[i];
      if (!original || !looksLikeArticle(original)) continue;
      if (!waybackMap[original]) {
        waybackMap[original] = timestamp;
        articleUrls.push(original);
      }
    }

    stats.cdxFetched += rows.length - 1;
    console.log(`  Found ${rows.length - 1} CDX rows, ${articleUrls.length} article URLs`);

    if (articleUrls.length > 0) {
      const before = stats.inserted;
      await processArticles(articleUrls, waybackMap);
      const added = stats.inserted - before;
      stats.cdxArticles += added;
      console.log(`\n  Inserted ${added} articles from ${domain}`);
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// PART 2: Times of Israel date archives
// ═════════════════════════════════════════════════════════════════
async function runTimesOfIsraelArchive() {
  console.log('\n\n======================================');
  console.log('PART 2: Times of Israel date archives');
  console.log('======================================\n');

  const today = new Date('2026-03-11');
  const startDate = new Date('2026-01-01');
  const dates = dateBetween(startDate, today);

  console.log(`Scanning ${dates.length} days of ToI archives...\n`);

  for (const date of dates) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const archiveUrl = `https://www.timesofisrael.com/${yyyy}/${mm}/${dd}/`;

    process.stdout.write(`[ToI] ${yyyy}-${mm}-${dd}: `);

    let html;
    try {
      html = await robustFetch(archiveUrl, { retries: 1, timeoutMs: 15000 });
    } catch (err) {
      console.log(`fetch failed (${err.message})`);
      stats.fetchErrors++;
      continue;
    }

    stats.toiFetched++;

    // Extract article links -- ToI uses <a href="https://www.timesofisrael.com/SLUG/">
    const linkMatches = [...html.matchAll(/<a\s[^>]*href=["'](https?:\/\/(?:www\.)?timesofisrael\.com\/[a-z0-9][-a-z0-9]+\/)["']/gi)];
    const articleUrls = [...new Set(linkMatches.map(m => m[1]))];

    if (articleUrls.length === 0) {
      console.log('no articles');
      continue;
    }

    console.log(`${articleUrls.length} links`);

    const before = stats.inserted;
    await processArticles(articleUrls);
    const added = stats.inserted - before;
    stats.toiArticles += added;

    await sleep(BATCH_DELAY_MS);
  }
}

// ═════════════════════════════════════════════════════════════════
// PART 3: Guardian Iran section
// ═════════════════════════════════════════════════════════════════
async function runGuardianIranSection() {
  console.log('\n\n======================================');
  console.log('PART 3: Guardian Iran section');
  console.log('======================================\n');

  const maxPages = 50;

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://www.theguardian.com/world/iran?page=${page}`;
    process.stdout.write(`[Guardian] Page ${page}/${maxPages}: `);

    let html;
    try {
      html = await robustFetch(url, { retries: 1, timeoutMs: 15000 });
    } catch (err) {
      console.log(`fetch failed (${err.message})`);
      stats.fetchErrors++;
      // If page fails, likely no more pages
      if (page > 5) break;
      continue;
    }

    stats.guardianFetched++;

    // Extract article links from Guardian listing page
    const linkMatches = [
      ...html.matchAll(/<a\s[^>]*href=["'](https?:\/\/(?:www\.)?theguardian\.com\/[^"']+)["']/gi),
    ];

    const articleUrls = [];
    const seen = new Set();
    for (const m of linkMatches) {
      const href = m[1];
      // Guardian articles typically have paths like /world/2026/jan/15/slug
      if (!looksLikeArticle(href)) continue;
      // Skip non-article sections
      if (/\/(commentisfree|help|info|profile|membership)\//i.test(href)) continue;
      const norm = normalizeUrl(href);
      if (!seen.has(norm)) {
        seen.add(norm);
        articleUrls.push(href);
      }
    }

    if (articleUrls.length === 0) {
      console.log('no articles (end of section?)');
      if (page > 3) break;
      continue;
    }

    console.log(`${articleUrls.length} links`);

    const before = stats.inserted;
    await processArticles(articleUrls);
    const added = stats.inserted - before;
    stats.guardianArticles += added;

    await sleep(BATCH_DELAY_MS);
  }
}

// ═════════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Backfill Archives -> news_feed              ║');
  console.log('║  Wayback Machine + ToI + Guardian            ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Validate env
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.XAI_API_KEY) missing.push('XAI_API_KEY');
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    console.error('Source .env.local or set them before running.');
    process.exit(1);
  }

  const startTime = Date.now();

  // Run all three parts sequentially
  await runWaybackCDX();
  await runTimesOfIsraelArchive();
  await runGuardianIranSection();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n\n══════════════════════════════════════');
  console.log('           FINAL SUMMARY');
  console.log('══════════════════════════════════════');
  console.log(`  Elapsed:           ${elapsed} minutes`);
  console.log(`  CDX rows scanned:  ${stats.cdxFetched}`);
  console.log(`  CDX articles:      ${stats.cdxArticles}`);
  console.log(`  ToI days fetched:  ${stats.toiFetched}`);
  console.log(`  ToI articles:      ${stats.toiArticles}`);
  console.log(`  Guardian pages:    ${stats.guardianFetched}`);
  console.log(`  Guardian articles: ${stats.guardianArticles}`);
  console.log(`  Total inserted:    ${stats.inserted}`);
  console.log(`  Duplicates skipped:${stats.duplicatesSkipped}`);
  console.log(`  Fetch errors:      ${stats.fetchErrors}`);
  console.log(`  Grok errors:       ${stats.grokErrors}`);
  console.log('══════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
