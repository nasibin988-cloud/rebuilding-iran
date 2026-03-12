#!/usr/bin/env node
/**
 * Comprehensive GDELT backfill with full-text extraction.
 * Queries GDELT DOC 2.0 API for each source domain, month by month,
 * fetches actual article text, and inserts into news_feed.
 *
 * Designed to run on the Hetzner server unattended.
 * Usage: node scripts/backfill-gdelt-fulltext.js [--resume]
 *   --resume: skip domains/months that already have articles
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'rebuilding_iran',
  user: process.env.PG_USER || 'rebuilding',
  password: process.env.PG_PASSWORD || '',
  max: 5,
  connectionTimeoutMillis: 10000,
});

// All source domains to backfill — comprehensive list
const SOURCES = [
  // Wire services
  { domain: 'reuters.com', source: 'Reuters', bias: 0, lang: 'en' },
  { domain: 'apnews.com', source: 'AP News', bias: 0, lang: 'en' },
  // US mainstream
  { domain: 'cnn.com', source: 'CNN', bias: -1, lang: 'en' },
  { domain: 'foxnews.com', source: 'Fox News', bias: 2, lang: 'en' },
  { domain: 'nbcnews.com', source: 'NBC News', bias: -1, lang: 'en' },
  { domain: 'pbs.org', source: 'PBS', bias: 0, lang: 'en' },
  { domain: 'npr.org', source: 'NPR', bias: 0, lang: 'en' },
  { domain: 'cbsnews.com', source: 'CBS News', bias: 0, lang: 'en' },
  { domain: 'nypost.com', source: 'New York Post', bias: 2, lang: 'en' },
  { domain: 'washingtontimes.com', source: 'Washington Times', bias: 2, lang: 'en' },
  { domain: 'dailywire.com', source: 'Daily Wire', bias: 2, lang: 'en' },
  { domain: 'breitbart.com', source: 'Breitbart', bias: 3, lang: 'en' },
  { domain: 'nytimes.com', source: 'The New York Times', bias: -1, lang: 'en', paywall: true },
  { domain: 'washingtonpost.com', source: 'The Washington Post', bias: -1, lang: 'en', paywall: true },
  { domain: 'wsj.com', source: 'Wall Street Journal', bias: 1, lang: 'en', paywall: true },
  // UK
  { domain: 'bbc.com', source: 'BBC', bias: 0, lang: 'en' },
  { domain: 'bbc.co.uk', source: 'BBC', bias: 0, lang: 'en' },
  { domain: 'theguardian.com', source: 'The Guardian', bias: -1, lang: 'en' },
  { domain: 'telegraph.co.uk', source: 'The Telegraph', bias: 1, lang: 'en', paywall: true },
  { domain: 'independent.co.uk', source: 'The Independent', bias: -1, lang: 'en' },
  // Middle East specialist
  { domain: 'aljazeera.com', source: 'Al Jazeera', bias: -1, lang: 'en' },
  { domain: 'france24.com', source: 'France 24', bias: 0, lang: 'en' },
  { domain: 'middleeasteye.net', source: 'Middle East Eye', bias: -1, lang: 'en' },
  { domain: 'middleeastmonitor.com', source: 'Middle East Monitor', bias: -1, lang: 'en' },
  { domain: 'al-monitor.com', source: 'Al-Monitor', bias: 0, lang: 'en' },
  { domain: 'english.alarabiya.net', source: 'Al Arabiya', bias: 1, lang: 'en' },
  { domain: 'arabnews.com', source: 'Arab News', bias: 1, lang: 'en' },
  { domain: 'thenationalnews.com', source: 'The National (UAE)', bias: 1, lang: 'en' },
  { domain: 'i24news.tv', source: 'i24NEWS', bias: 1, lang: 'en' },
  // Israeli press
  { domain: 'jpost.com', source: 'The Jerusalem Post', bias: 1, lang: 'en' },
  { domain: 'timesofisrael.com', source: 'The Times of Israel', bias: 0, lang: 'en' },
  { domain: 'ynetnews.com', source: 'Ynet News', bias: 0, lang: 'en' },
  { domain: 'haaretz.com', source: 'Haaretz', bias: -1, lang: 'en', paywall: true },
  // Iran-focused
  { domain: 'iranintl.com', source: 'Iran International', bias: 1, lang: 'en' },
  { domain: 'iranwire.com', source: 'IranWire', bias: 0, lang: 'en' },
  // European
  { domain: 'dw.com', source: 'DW News', bias: 0, lang: 'en' },
  // Think tanks
  { domain: 'foreignaffairs.com', source: 'Foreign Affairs', bias: 0, lang: 'en', paywall: true },
  { domain: 'fdd.org', source: 'Foundation for Defense of Democracies', bias: 1, lang: 'en' },
  { domain: 'atlanticcouncil.org', source: 'Atlantic Council', bias: 0, lang: 'en' },
  { domain: 'washingtoninstitute.org', source: 'The Washington Institute', bias: 0, lang: 'en' },
  { domain: 'criticalthreats.org', source: 'Critical Threats', bias: 1, lang: 'en' },
  // Farsi sources
  { domain: 'radiofarda.com', source: 'Radio Farda', bias: 0, lang: 'fa' },
  { domain: 'ir.voanews.com', source: 'VOA Farsi', bias: 0, lang: 'fa' },
  { domain: 'bbc.com/persian', source: 'BBC Persian', bias: 0, lang: 'fa' },
];

// Generate month ranges from Sep 2025 to now
function getMonthRanges() {
  const ranges = [];
  const now = new Date();
  let d = new Date('2025-09-01');
  while (d < now) {
    const start = new Date(d);
    d.setMonth(d.getMonth() + 1);
    const end = d < now ? new Date(d) : now;
    ranges.push({ start, end });
  }
  return ranges;
}

function formatGdeltDate(d) {
  return d.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
}

function extractArticleText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  const mainMatch = text.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  if (articleMatch) text = articleMatch[1];
  else if (mainMatch) text = mainMatch[1];

  text = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, 100000);
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/json',
      },
    });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchGdeltArticles(domain, startDate, endDate) {
  const query = `iran domainis:${domain}`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=250&startdatetime=${formatGdeltDate(startDate)}&enddatetime=${formatGdeltDate(endDate)}`;

  try {
    const res = await fetchWithTimeout(url, 20000);
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

async function fetchFullText(url) {
  try {
    const res = await fetchWithTimeout(url, 12000);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    const html = await res.text();
    const text = extractArticleText(html);
    return text.length >= 100 ? text : null;
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    for (const p of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref','source','fbclid','gclid']) {
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

const IRAN_KEYWORDS = /iran|iranian|tehran|isfahan|tabriz|shiraz|mashhad|irgc|sepah|pahlavi|khamenei|raisi|basij|quds.force|persian.gulf|jcpoa|mahsa|amini|hezbollah|houthi|nuclear|sanction/i;

let totalInserted = 0;
let totalFullText = 0;
let totalSkipped = 0;

async function processSource(source, months) {
  let sourceInserted = 0;
  let sourceFullText = 0;

  for (const { start, end } of months) {
    const monthLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

    const articles = await fetchGdeltArticles(source.domain, start, end);
    if (articles.length === 0) {
      continue;
    }

    // Check which URLs already exist
    const urls = articles.map(a => normalizeUrl(a.url));
    const placeholders = urls.map((_, i) => `$${i + 1}`).join(',');
    let existingLinks = new Set();
    try {
      const { rows } = await pool.query(
        `SELECT link FROM news_feed WHERE link IN (${placeholders})`,
        urls
      );
      existingLinks = new Set(rows.map(r => r.link));
    } catch {}

    const newArticles = articles.filter(a => !existingLinks.has(normalizeUrl(a.url)));
    if (newArticles.length === 0) {
      totalSkipped += articles.length;
      continue;
    }

    // Fetch full text in batches of 5
    for (let i = 0; i < newArticles.length; i += 5) {
      const batch = newArticles.slice(i, i + 5);
      const textResults = await Promise.all(
        batch.map(a => source.paywall ? Promise.resolve(null) : fetchFullText(a.url))
      );

      for (let j = 0; j < batch.length; j++) {
        const article = batch[j];
        const fullText = textResults[j];
        const link = normalizeUrl(article.url);
        const title = (article.title || '').replace(/\s+/g, ' ').trim();
        const pubDate = article.seendate ? new Date(article.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString() : null;

        if (!title || !link) continue;

        try {
          const { rowCount } = await pool.query(
            `INSERT INTO news_feed (link, title, source, description, pub_date, bias, paywall, lang, relevance, type, full_text)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (link) DO UPDATE SET full_text = COALESCE(news_feed.full_text, EXCLUDED.full_text)`,
            [link, title, source.source, article.sourcecountry || null, pubDate,
             source.bias || 0, source.paywall || false, source.lang || 'en',
             IRAN_KEYWORDS.test(title) ? 2 : 1, 'gdelt', fullText || null]
          );
          if (rowCount > 0) {
            sourceInserted++;
            if (fullText) sourceFullText++;
          }
        } catch {}
      }
    }

    console.log(`  [${source.domain}] ${monthLabel}: ${newArticles.length} new, ${articles.length - newArticles.length} existing`);

    // Small delay between months to be nice to GDELT
    await new Promise(r => setTimeout(r, 500));
  }

  totalInserted += sourceInserted;
  totalFullText += sourceFullText;
  return { inserted: sourceInserted, fullText: sourceFullText };
}

async function main() {
  const resumeMode = process.argv.includes('--resume');
  const months = getMonthRanges();
  console.log(`GDELT Full-Text Backfill: ${SOURCES.length} sources × ${months.length} months`);
  console.log(`Date range: ${months[0].start.toISOString().slice(0, 10)} to ${months[months.length - 1].end.toISOString().slice(0, 10)}`);
  console.log(`Mode: ${resumeMode ? 'RESUME (skip existing)' : 'FULL'}\n`);

  for (const source of SOURCES) {
    const startTime = Date.now();
    console.log(`[${source.domain}] Starting...`);

    try {
      const result = await processSource(source, months);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${source.domain}] Done in ${elapsed}s: ${result.inserted} inserted, ${result.fullText} with full text\n`);
    } catch (err) {
      console.error(`[${source.domain}] Error: ${err.message}\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`BACKFILL COMPLETE`);
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total with full text: ${totalFullText}`);
  console.log(`Total skipped (existing): ${totalSkipped}`);

  // Now do a second pass: try to get full text for articles that have null full_text
  console.log(`\nStarting full-text recovery pass...`);

  const { rows: missing } = await pool.query(
    `SELECT id, link FROM news_feed
     WHERE full_text IS NULL
     AND link NOT LIKE '%news.google.com%'
     AND paywall = false
     ORDER BY pub_date DESC NULLS LAST
     LIMIT 2000`
  );

  console.log(`Found ${missing.length} articles missing full text (non-Google, non-paywall)`);

  let recovered = 0;
  for (let i = 0; i < missing.length; i += 10) {
    const batch = missing.slice(i, i + 10);
    const results = await Promise.all(batch.map(a => fetchFullText(a.link)));
    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        await pool.query('UPDATE news_feed SET full_text = $1 WHERE id = $2', [results[j], batch[j].id]);
        recovered++;
      }
    }
    if ((i + 10) % 100 === 0) {
      console.log(`  Recovery progress: ${i + 10}/${missing.length}, recovered: ${recovered}`);
    }
  }

  console.log(`\nRecovered full text for ${recovered} additional articles`);

  // Final stats
  const { rows: stats } = await pool.query(
    `SELECT COUNT(*) as total, COUNT(full_text) as with_text FROM news_feed`
  );
  console.log(`\nFinal DB stats: ${stats[0].total} articles, ${stats[0].with_text} with full text (${Math.round(stats[0].with_text / stats[0].total * 100)}%)`);

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
