import { NextRequest, NextResponse } from 'next/server';

// ── Self-hosted Postgres (all data lives here now) ──────────────
let pgPool: import('pg').Pool | null = null;
function getPool() {
  if (!pgPool) {
    const { Pool } = require('pg') as typeof import('pg');
    pgPool = new Pool({
      host: process.env.PG_HOST || '127.0.0.1',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'rebuilding_iran',
      user: process.env.PG_USER || 'rebuilding',
      password: process.env.PG_PASSWORD || '',
      max: 10,
      connectionTimeoutMillis: 10000,
    });
  }
  return pgPool;
}

export const maxDuration = 300;

// ── Types ──────────────────────────────────────────────────────
type Bias = -3 | -2 | -1 | 0 | 1 | 2 | 3;
type Relevance = 1 | 2 | 3;

interface FeedSource {
  url: string;
  source: string;
  paywall?: boolean;
  bias: Bias;
  lang: 'en' | 'fa';
  type?: 'rss' | 'world';  // 'world' = general world news, 'rss' = Iran-focused (default)
}

interface ParsedArticle {
  link: string;
  title: string;
  source: string;
  description: string;
  pub_date: string | null;
  bias: number;
  paywall: boolean;
  lang: string;
  relevance: Relevance;
}

// ── Relevance scoring ──────────────────────────────────────────
const IRAN_DIRECT = /\b(iran|iranian|tehran|isfahan|tabriz|shiraz|mashhad|irgc|sepah|pahlavi|khamenei|raisi|rouhani|basij|quds\s*force|persian\s*gulf|rial|jcpoa|mahsa|amini|farsi)\b/i;
const IRAN_FARSI = /(\u0627\u06CC\u0631\u0627\u0646|\u062A\u0647\u0631\u0627\u0646|\u0633\u067E\u0627\u0647|\u067E\u0647\u0644\u0648\u06CC|\u062E\u0627\u0645\u0646\u0647\u200C?\u0627\u06CC)/;
const REGIONAL = /\b(israel|israeli|hezbollah|houthi|syria|iraq|saudi|gulf\s*state|middle\s*east|nuclear\s*deal|sanction|proxy\s*war|strait\s*of\s*hormuz|lebanon|gaza|netanyahu|idf)\b/i;

function scoreRelevance(title: string, description: string): Relevance {
  const text = `${title} ${description}`;
  if (IRAN_DIRECT.test(text) || IRAN_FARSI.test(text)) return 2;
  if (REGIONAL.test(text)) return 1;
  return 1;
}

// ── Feed sources ───────────────────────────────────────────────
const FEEDS_EN: FeedSource[] = [
  { url: 'https://www.iranintl.com/en/feed', source: 'Iran International', bias: 1, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:timesofisrael.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'Times of Israel', bias: 0, lang: 'en' },
  { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', source: 'Jerusalem Post', bias: 1, lang: 'en' },
  { url: 'https://www.ynetnews.com/Integration/StoryRss2.xml', source: 'Ynet News', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:i24news.tv+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'i24NEWS', bias: 1, lang: 'en' },
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:reuters.com&hl=en-US&gl=US&ceid=US:en', source: 'Reuters', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:apnews.com&hl=en-US&gl=US&ceid=US:en', source: 'AP News', bias: 0, lang: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', bias: -1, lang: 'en' },
  { url: 'https://www.france24.com/en/middle-east/rss', source: 'France 24', bias: 0, lang: 'en' },
  { url: 'https://rss.dw.com/xml/rss-en-all', source: 'DW News', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+site:voanews.com&hl=en-US&gl=US&ceid=US:en', source: 'VOA', bias: 0, lang: 'en' },
  { url: 'https://feeds.foxnews.com/foxnews/world', source: 'Fox News', bias: 2, lang: 'en' },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/news', source: 'NBC News', bias: -1, lang: 'en' },
  { url: 'https://www.theguardian.com/world/iran/rss', source: 'The Guardian', bias: -1, lang: 'en' },
  { url: 'https://www.independent.co.uk/topic/iran/rss', source: 'The Independent', bias: -1, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:english.alarabiya.net+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'Al Arabiya', bias: 1, lang: 'en' },
  { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye', bias: -1, lang: 'en' },
  { url: 'https://www.al-monitor.com/rss', source: 'Al-Monitor', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:arabnews.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'Arab News', bias: 1, lang: 'en' },
  { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/category/news/mena/?outputType=xml', source: 'The National (UAE)', bias: 1, lang: 'en' },
  { url: 'https://nationalinterest.org/feed', source: 'National Interest', bias: 1, lang: 'en' },
  { url: 'https://theintercept.com/feed/?rss', source: 'The Intercept', bias: -2, lang: 'en' },
  { url: 'https://rcs.mako.co.il/rss/news-world.xml', source: 'Channel 12 (Mako)', bias: 0, lang: 'en' },
  // US broadcast / public media (direct feeds)
  { url: 'https://www.pbs.org/newshour/feeds/rss/headlines', source: 'PBS NewsHour', bias: 0, lang: 'en' },
  { url: 'https://feeds.npr.org/1004/rss.xml', source: 'NPR World', bias: 0, lang: 'en' },
  { url: 'https://feeds.npr.org/1009/rss.xml', source: 'NPR Middle East', bias: 0, lang: 'en' },
  { url: 'https://www.cbsnews.com/latest/rss/world', source: 'CBS News World', bias: 0, lang: 'en' },
  { url: 'https://www.middleeastmonitor.com/feed/', source: 'Middle East Monitor', bias: -1, lang: 'en' },
  // CNN (Google News proxy - CNN's own RSS is stale since 2024)
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:cnn.com&hl=en-US&gl=US&ceid=US:en', source: 'CNN', bias: -1, lang: 'en' },
  // Conservative US outlets
  { url: 'https://nypost.com/feed/', source: 'New York Post', bias: 2, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:washingtontimes.com&hl=en-US&gl=US&ceid=US:en', source: 'Washington Times', bias: 2, lang: 'en' },
  { url: 'https://www.dailywire.com/feeds/rss.xml', source: 'Daily Wire', bias: 2, lang: 'en' },
  { url: 'https://www.breitbart.com/feed/', source: 'Breitbart', bias: 3, lang: 'en' },
];

// ── World news feeds (general, not Iran-filtered) ─────────────
const FEEDS_WORLD: FeedSource[] = [
  // === US News ===
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC US', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR', bias: 0, lang: 'en', type: 'world' },
  // === Europe / NATO ===
  { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC Europe', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://www.france24.com/en/europe/rss', source: 'France 24', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://www.theguardian.com/world/europe-news/rss', source: 'The Guardian', bias: -1, lang: 'en', type: 'world' },
  // === China ===
  { url: 'https://www.scmp.com/rss/91/feed', source: 'South China Morning Post', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/china/rss.xml', source: 'BBC China', bias: 0, lang: 'en', type: 'world' },
  // === India ===
  { url: 'https://www.thehindu.com/news/international/feeder/default.rss', source: 'The Hindu', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', source: 'BBC India', bias: 0, lang: 'en', type: 'world' },
  // === Gulf States / MENA general ===
  { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', source: 'The National (UAE)', bias: 1, lang: 'en', type: 'world' },
  { url: 'https://www.arabnews.com/rss.xml', source: 'Arab News', bias: 1, lang: 'en', type: 'world' },
  // === Iran neighbours: Turkey ===
  { url: 'https://www.hurriyetdailynews.com/rss', source: 'Hurriyet Daily News', bias: 0, lang: 'en', type: 'world' },
  // === Iran neighbours: Pakistan ===
  { url: 'https://www.dawn.com/feeds/home', source: 'Dawn', bias: 0, lang: 'en', type: 'world' },
  // === Iran neighbours: Azerbaijan / Caucasus ===
  { url: 'https://news.google.com/rss/search?q=azerbaijan+OR+caucasus&hl=en-US&gl=US&ceid=US:en', source: 'Azerbaijan News', bias: 0, lang: 'en', type: 'world' },
  // === Russia ===
  { url: 'https://www.themoscowtimes.com/rss/news', source: 'The Moscow Times', bias: 0, lang: 'en', type: 'world' },
  // === Africa ===
  { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', source: 'BBC Africa', bias: 0, lang: 'en', type: 'world' },
  { url: 'https://www.france24.com/en/africa/rss', source: 'France 24 Africa', bias: 0, lang: 'en', type: 'world' },
  // === Asia-Pacific (Japan, Korea, ASEAN) ===
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC Asia', bias: 0, lang: 'en', type: 'world' },
];

const FEEDS_FA: FeedSource[] = [
  { url: 'https://www.iranintl.com/fa/feed', source: '\u0627\u06CC\u0631\u0627\u0646 \u0627\u06CC\u0646\u062A\u0631\u0646\u0634\u0646\u0627\u0644', bias: 1, lang: 'fa' },
  { url: 'https://www.radiofarda.com/api/zrttpol-vomx-tpeoogpi', source: '\u0631\u0627\u062F\u06CC\u0648 \u0641\u0631\u062F\u0627', bias: 0, lang: 'fa' },
  { url: 'https://www.bbc.com/persian/index.xml', source: '\u0628\u06CC\u200C\u0628\u06CC\u200C\u0633\u06CC \u0641\u0627\u0631\u0633\u06CC', bias: 0, lang: 'fa' },
  { url: 'https://ir.voanews.com/api/zbtpil-vomx-tpeqiyp', source: '\u0635\u062F\u0627\u06CC \u0622\u0645\u0631\u06CC\u06A9\u0627', bias: 0, lang: 'fa' },
  { url: 'https://news.google.com/rss/search?q=site:dw.com+iran+when:7d&hl=fa&gl=IR&ceid=IR:fa', source: '\u062F\u0648\u06CC\u0686\u0647\u200C\u0648\u0644\u0647 \u0641\u0627\u0631\u0633\u06CC', bias: 0, lang: 'fa' },
  { url: 'https://www.independentpersian.com/rss.xml', source: '\u0627\u06CC\u0646\u062F\u06CC\u067E\u0646\u062F\u0646\u062A \u0641\u0627\u0631\u0633\u06CC', bias: -1, lang: 'fa' },
];

const ALL_FEEDS = [...FEEDS_EN, ...FEEDS_FA, ...FEEDS_WORLD];

// ── XML parsing helpers ────────────────────────────────────────
function stripHtml(html: string): string {
  let text = html;
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
  text = text.replace(/<[^]*?>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').replace(/\s+/g, ' ');
  return text.trim();
}

function extractTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';
  return (match[1] ?? match[2] ?? '').trim();
}

function extractAtomLink(entryXml: string): string {
  const altMatch = entryXml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (altMatch) return altMatch[1];
  const anyMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (anyMatch) return anyMatch[1];
  return '';
}

const DATE_CUTOFF = new Date('2025-09-01T00:00:00Z');

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (d < DATE_CUTOFF) return null;
  return d.toISOString();
}

function cleanGoogleNewsTitle(title: string): string {
  return title.replace(/\s+-\s+[^-]+$/, '');
}

function isGoogleNewsFeed(url: string): boolean {
  return url.startsWith('https://news.google.com/');
}

/** Normalize URL for deduplication */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const p of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref','source','fbclid','gclid','mc_cid','mc_eid']) {
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

/** Extract actual article URL from Google News RSS item (from <source url="..."> or description) */
function extractGoogleNewsSourceUrl(itemXml: string): string | null {
  // Google News items sometimes have <source url="https://actual.site.com/article">
  const sourceMatch = itemXml.match(/<source[^>]*url=["']([^"']+)["']/i);
  if (sourceMatch && sourceMatch[1] && !sourceMatch[1].includes('google.com')) {
    // The source URL is usually just the domain, not the full article URL
    // But we can try to use it
    return null; // Domain-only, not useful
  }
  return null;
}

function parseRSS(xml: string, feedSource: FeedSource): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const isGN = isGoogleNewsFeed(feedSource.url);
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];
    let title = stripHtml(extractTagContent(itemXml, 'title'));
    let link = normalizeUrl(stripHtml(extractTagContent(itemXml, 'link')));
    const description = stripHtml(extractTagContent(itemXml, 'description')).slice(0, 500);
    const pub_date = parseDate(stripHtml(extractTagContent(itemXml, 'pubDate')));

    if (!title || !link) continue;
    if (extractTagContent(itemXml, 'pubDate') && !pub_date) continue;
    if (isGN) {
      title = cleanGoogleNewsTitle(title);
      // Try to extract actual URL from Google News item
      const actualUrl = extractGoogleNewsSourceUrl(itemXml);
      if (actualUrl) link = normalizeUrl(actualUrl);
    }

    articles.push({
      link, title, source: feedSource.source, description, pub_date,
      bias: feedSource.bias, paywall: feedSource.paywall || false, lang: feedSource.lang,
      relevance: scoreRelevance(title, description),
    });
  }
  return articles;
}

function parseAtom(xml: string, feedSource: FeedSource): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entryXml = entryMatch[1];
    const title = stripHtml(extractTagContent(entryXml, 'title'));
    const link = normalizeUrl(extractAtomLink(entryXml));
    const summary = stripHtml(
      extractTagContent(entryXml, 'summary') || extractTagContent(entryXml, 'content')
    ).slice(0, 500);
    const updated = extractTagContent(entryXml, 'updated') || extractTagContent(entryXml, 'published');
    const pub_date = parseDate(stripHtml(updated));

    if (!title || !link) continue;
    if (updated && !pub_date) continue;

    articles.push({
      link, title, source: feedSource.source, description: summary, pub_date,
      bias: feedSource.bias, paywall: feedSource.paywall || false, lang: feedSource.lang,
      relevance: scoreRelevance(title, summary),
    });
  }
  return articles;
}

function parseFeedXml(xml: string, feedSource: FeedSource): ParsedArticle[] {
  const rssArticles = parseRSS(xml, feedSource);
  if (rssArticles.length > 0) return rssArticles;
  return parseAtom(xml, feedSource);
}

async function fetchFeed(feedSource: FeedSource): Promise<{ articles: ParsedArticle[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(feedSource.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IranNews/1.0)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return { articles: [], error: `HTTP ${response.status}` };
    const xml = await response.text();
    const articles = parseFeedXml(xml, feedSource);
    if (articles.length === 0) return { articles: [], error: 'Parsed 0 articles' };
    return { articles };
  } catch (err) {
    return { articles: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Article text extraction ────────────────────────────────────
function extractArticleText(html: string): string {
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

async function fetchAndExtractArticle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    const text = extractArticleText(html);
    return text.length >= 50 ? text : null;
  } catch {
    return null;
  }
}

// ── Telegram channel scraping ───────────────────────────────────

interface TelegramChannel {
  username: string;
  label: string;
}

const TELEGRAM_CHANNELS: TelegramChannel[] = [
  // Iranian opposition & Persian-language
  { username: 'rodast_omiddana', label: 'Omid Dana' },
  { username: 'kianmeli1', label: 'Kian Meli' },
  { username: 'vahidonline', label: 'Vahid Online' },
  { username: 'OfficialRezaPahlavi', label: 'Reza Pahlavi' },
  // Iranian state media (for analysis)
  { username: 'farsna', label: 'Fars News Agency' },
  { username: 'tasnimnews', label: 'Tasnim News' },
  // Persian-language international
  { username: 'IranintlTV', label: 'Iran International' },
  { username: 'bbcpersian', label: 'BBC Persian' },
  { username: 'RadioFarda', label: 'Radio Farda' },
  // English-language
  { username: 'epochtimes', label: 'The Epoch Times' },
  { username: 'oanntv', label: 'OAN' },
  { username: 'nytimes', label: 'New York Times' },
  { username: 'aljazeeraglobal', label: 'Al Jazeera English' },
  // Israeli & OSINT sources
  { username: 'CIG_telegram', label: 'CIG OSINT' },
  { username: 'AbuAliExpress', label: 'Abu Ali Express' },
  { username: 'OSINTdefender', label: 'OSINT Defender' },
  // Russian & Chinese state media
  { username: 'rt_russ', label: 'RT Russian' },
  { username: 'XHNews', label: 'Xinhua News (China)' },
  // Regional / international
  { username: 'indianexpress', label: 'Indian Express (India)' },
  { username: 'saudinews50', label: 'Saudi News' },
  { username: 'tagesschau24', label: 'Tagesschau (Germany)' },
];

interface RawTelegramPost {
  channel: string;
  label: string;
  messageId: string;
  link: string;
  fullText: string;
  date: string | null;
}

async function scrapeTelegramChannel(ch: TelegramChannel): Promise<{ posts: RawTelegramPost[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`https://t.me/s/${ch.username}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return { posts: [], error: `HTTP ${response.status}` };

    const html = await response.text();
    const posts: RawTelegramPost[] = [];
    const postIds = [...html.matchAll(/data-post="([^"]+)"/g)].map(m => m[1]);
    const textMatches = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];
    const dateMatches = [...html.matchAll(/<time[^>]*datetime="([^"]+)"/g)].map(m => m[1]);

    const count = Math.min(postIds.length, textMatches.length);
    for (let i = 0; i < count; i++) {
      const rawText = textMatches[i][1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      if (!rawText) continue;

      const postId = postIds[i];
      const msgNum = postId.split('/')[1] || postId;
      posts.push({
        channel: ch.username,
        label: ch.label,
        messageId: msgNum,
        link: `https://t.me/${ch.username}/${msgNum}`,
        fullText: rawText,
        date: dateMatches[i] || null,
      });
    }
    return { posts };
  } catch (err) {
    return { posts: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function snapTo5Min(date: Date): Date {
  const ms = date.getTime();
  return new Date(Math.floor(ms / (5 * 60 * 1000)) * (5 * 60 * 1000));
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

// ── Main handler ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = getPool();
  const startTime = Date.now();
  const refreshTime = snapTo5Min(new Date());

  try {
    // 1. Fetch all RSS/Atom feeds in parallel
    console.log(`[news-refresh] Fetching ${ALL_FEEDS.length} feeds...`);
    const feedResults = await Promise.all(ALL_FEEDS.map(feed => fetchFeed(feed)));

    const failures: string[] = [];
    feedResults.forEach((result, i) => {
      if (result.error) failures.push(`${ALL_FEEDS[i].source}: ${result.error}`);
    });
    if (failures.length > 0) {
      console.warn(`[news-refresh] ${failures.length} feeds failed:\n  ${failures.join('\n  ')}`);
    }

    const allArticles = feedResults.flatMap((r, i) =>
      r.articles.map(a => ({ ...a, feedType: ALL_FEEDS[i].type || 'rss' }))
    );
    console.log(`[news-refresh] Parsed ${allArticles.length} articles from ${ALL_FEEDS.length - failures.length}/${ALL_FEEDS.length} feeds`);

    // 2. Record refresh time
    await pool.query(
      `INSERT INTO news_meta (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      ['last_refresh', refreshTime.toISOString()]
    );

    // 3. Deduplicate against existing links
    let newArticles = allArticles;
    if (allArticles.length > 0) {
      const existingLinks = new Set<string>();
      for (let i = 0; i < allArticles.length; i += 500) {
        const batch = allArticles.slice(i, i + 500).map(a => a.link);
        const { rows } = await pool.query(
          `SELECT link FROM news_feed WHERE link = ANY($1)`,
          [batch]
        );
        rows.forEach((r: { link: string }) => existingLinks.add(r.link));
      }
      newArticles = allArticles.filter(a => !existingLinks.has(a.link));
    }
    console.log(`[news-refresh] ${newArticles.length} new articles to insert`);

    if (newArticles.length === 0 && allArticles.length > 0) {
      // Skip to Telegram if no new RSS articles
    }

    // 4. Insert new articles
    interface InsertedArticle { id: string; link: string; title: string; }
    const inserted: InsertedArticle[] = [];
    for (const a of newArticles) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO news_feed (link, title, source, description, pub_date, bias, paywall, lang, relevance, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (link) DO NOTHING
           RETURNING id, link, title`,
          [a.link, a.title, a.source, a.description, a.pub_date, a.bias, a.paywall, a.lang, a.relevance, a.feedType]
        );
        if (rows[0]) inserted.push(rows[0]);
      } catch (err) {
        console.error(`[news-refresh] Insert error for ${a.link}: ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log(`[news-refresh] Inserted ${inserted.length} articles`);

    // 5. Fetch full article text for ALL new articles (10 concurrency)
    let fullTextFetched = 0;
    for (let i = 0; i < inserted.length; i += 10) {
      const batch = inserted.slice(i, i + 10);
      const results = await Promise.all(
        batch.map(a => fetchAndExtractArticle(a.link))
      );
      for (let j = 0; j < batch.length; j++) {
        const fullText = results[j];
        if (fullText) {
          await pool.query(
            `UPDATE news_feed SET full_text = $1 WHERE id = $2`,
            [fullText, batch[j].id]
          );
          fullTextFetched++;
        }
      }
    }

    // ── 6. Telegram: archive raw posts only (no AI processing) ───
    let telegramArchived = 0;
    if (TELEGRAM_CHANNELS.length > 0) {
      console.log(`[news-refresh] Scraping ${TELEGRAM_CHANNELS.length} Telegram channels...`);
      const tgResults = await Promise.all(TELEGRAM_CHANNELS.map(ch => scrapeTelegramChannel(ch)));

      const tgFailures: string[] = [];
      tgResults.forEach((r, i) => {
        if (r.error) tgFailures.push(`${TELEGRAM_CHANNELS[i].username}: ${r.error}`);
      });
      if (tgFailures.length > 0) {
        console.warn(`[news-refresh] ${tgFailures.length} Telegram channels failed:\n  ${tgFailures.join('\n  ')}`);
      }

      const allPosts = tgResults.flatMap(r => r.posts);
      console.log(`[news-refresh] Scraped ${allPosts.length} Telegram posts`);

      // Archive to telegram_raw (same Postgres, no Supabase)
      if (allPosts.length > 0) {
        try {
          for (const p of allPosts) {
            const { rowCount } = await pool.query(
              `INSERT INTO telegram_raw (channel, channel_label, message_id, link, raw_text, pub_date)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (link) DO NOTHING`,
              [p.channel, p.label, parseInt(p.messageId, 10), p.link, p.fullText, p.date || null]
            );
            telegramArchived += (rowCount || 0);
          }
          if (telegramArchived > 0) {
            console.log(`[news-refresh] Archived ${telegramArchived} new Telegram posts`);
          }
        } catch (rawErr) {
          console.error(`[news-refresh] Telegram archive error: ${rawErr instanceof Error ? rawErr.message : rawErr}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[news-refresh] Done in ${duration}ms. ${inserted.length} RSS new, ${fullTextFetched} full-text, ${telegramArchived} TG archived, ${failures.length} feeds failed`);

    return NextResponse.json({
      message: 'Refresh complete',
      new_articles: inserted.length,
      full_text_fetched: fullTextFetched,
      telegram_archived: telegramArchived,
      total_parsed: allArticles.length,
      feeds_failed: failures.length,
      refresh_time: refreshTime.toISOString(),
      duration,
    });
  } catch (error) {
    console.error('[news-refresh] Error:', error);
    return NextResponse.json(
      { error: 'Refresh failed', details: String(error) },
      { status: 500 }
    );
  }
}
