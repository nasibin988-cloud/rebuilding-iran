import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Self-hosted Postgres for raw Telegram archive (always writes here)
let pgPool: import('pg').Pool | null = null;
function getRawArchivePool() {
  if (!pgPool && process.env.PG_PASSWORD) {
    const { Pool } = require('pg') as typeof import('pg');
    pgPool = new Pool({
      host: process.env.PG_HOST || '127.0.0.1',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'rebuilding_iran',
      user: process.env.PG_USER || 'rebuilding',
      password: process.env.PG_PASSWORD,
      max: 5,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

// Vercel execution limit: allow up to 5 minutes for feed fetching + AI summaries
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

// ── Supabase admin client ──────────────────────────────────────
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Grok client for summaries ──────────────────────────────────
let xaiClient: OpenAI | null = null;
function getXAI(): OpenAI | null {
  if (!xaiClient && process.env.XAI_API_KEY) {
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }
  return xaiClient;
}
const MODEL = 'grok-4-1-fast-reasoning';

// ── Relevance scoring ──────────────────────────────────────────
// 3 = Key breaking news: major military strikes, regime changes, major policy shifts, mass casualties
// 2 = Relevant & important: Iran-related diplomacy, regional conflict, sanctions, notable statements
// 1 = Background/context: general Middle East coverage, tangential mentions, routine updates
const IRAN_DIRECT = /\b(iran|iranian|tehran|isfahan|tabriz|shiraz|mashhad|irgc|sepah|pahlavi|khamenei|raisi|rouhani|basij|quds\s*force|persian\s*gulf|rial|jcpoa|mahsa|amini|farsi)\b/i;
const IRAN_FARSI = /(\u0627\u06CC\u0631\u0627\u0646|\u062A\u0647\u0631\u0627\u0646|\u0633\u067E\u0627\u0647|\u067E\u0647\u0644\u0648\u06CC|\u062E\u0627\u0645\u0646\u0647\u200C?\u0627\u06CC)/;
const REGIONAL = /\b(israel|israeli|hezbollah|houthi|syria|iraq|saudi|gulf\s*state|middle\s*east|nuclear\s*deal|sanction|proxy\s*war|strait\s*of\s*hormuz|lebanon|gaza|netanyahu|idf)\b/i;

function scoreRelevance(title: string, description: string): Relevance {
  const text = `${title} ${description}`;
  // Keyword heuristic defaults to 2 for Iran-related, 1 for regional. AI refines to 3 later.
  if (IRAN_DIRECT.test(text) || IRAN_FARSI.test(text)) return 2;
  if (REGIONAL.test(text)) return 1;
  return 1;
}

// ── Feed sources ───────────────────────────────────────────────
// NOTE: Sources whose native RSS is dead/blocked use Google News RSS proxies.
// Google News items use the source's original link, so deduplication still works.
const FEEDS_EN: FeedSource[] = [
  // Iran-focused
  { url: 'https://www.iranintl.com/en/feed', source: 'Iran International', bias: 1, lang: 'en' },

  // Israeli sources
  { url: 'https://www.timesofisrael.com/feed/', source: 'Times of Israel', bias: 0, lang: 'en' },
  { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', source: 'Jerusalem Post', bias: 1, lang: 'en' },
  { url: 'https://www.ynetnews.com/Integration/StoryRss2.xml', source: 'Ynet News', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:i24news.tv+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'i24NEWS', bias: 1, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+site:haaretz.com&hl=en-US&gl=US&ceid=US:en', source: 'Haaretz', paywall: true, bias: -1, lang: 'en' },

  // Wire services
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:reuters.com&hl=en-US&gl=US&ceid=US:en', source: 'Reuters', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:apnews.com&hl=en-US&gl=US&ceid=US:en', source: 'AP News', bias: 0, lang: 'en' },

  // International broadcasters
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', bias: -1, lang: 'en' },
  { url: 'https://www.france24.com/en/middle-east/rss', source: 'France 24', bias: 0, lang: 'en' },
  { url: 'https://rss.dw.com/xml/rss-en-all', source: 'DW News', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:voanews.com+iran+OR+middle+east+when:7d&hl=en-US&gl=US&ceid=US:en', source: 'VOA News', bias: 0, lang: 'en' },

  // US newspapers
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', source: 'NY Times', paywall: true, bias: -1, lang: 'en' },
  { url: 'https://feeds.washingtonpost.com/rss/world', source: 'Washington Post', paywall: true, bias: -1, lang: 'en' },
  { url: 'https://feeds.foxnews.com/foxnews/world', source: 'Fox News', bias: 2, lang: 'en' },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/news', source: 'NBC News', bias: -1, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:wsj.com&hl=en-US&gl=US&ceid=US:en', source: 'Wall Street Journal', paywall: true, bias: 1, lang: 'en' },

  // UK & European newspapers
  { url: 'https://www.theguardian.com/world/iran/rss', source: 'The Guardian', bias: -1, lang: 'en' },
  { url: 'https://www.telegraph.co.uk/rss.xml', source: 'The Telegraph', paywall: true, bias: 1, lang: 'en' },
  { url: 'https://www.independent.co.uk/topic/iran/rss', source: 'The Independent', bias: -1, lang: 'en' },

  // Regional / Middle East specialists
  { url: 'https://news.google.com/rss/search?q=site:english.alarabiya.net+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'Al Arabiya', bias: 1, lang: 'en' },
  { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye', bias: -1, lang: 'en' },
  { url: 'https://www.al-monitor.com/rss', source: 'Al-Monitor', bias: 0, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:arabnews.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'Arab News', bias: 1, lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=site:thenationalnews.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en', source: 'The National (UAE)', bias: 1, lang: 'en' },

  // Think tanks & analysis
  { url: 'https://www.foreignaffairs.com/rss.xml', source: 'Foreign Affairs', paywall: true, bias: 0, lang: 'en' },
  { url: 'https://nationalinterest.org/feed', source: 'National Interest', bias: 1, lang: 'en' },
  { url: 'https://theintercept.com/feed/?rss', source: 'The Intercept', bias: -2, lang: 'en' },

  // Israeli TV (Hebrew sources via Google News proxy)
  { url: 'https://news.google.com/rss/search?q=iran+OR+middle+east+site:mako.co.il&hl=en-US&gl=US&ceid=US:en', source: 'Channel 12 (Mako)', bias: 0, lang: 'en' },
];

const FEEDS_FA: FeedSource[] = [
  { url: 'https://www.iranintl.com/fa/feed', source: '\u0627\u06CC\u0631\u0627\u0646 \u0627\u06CC\u0646\u062A\u0631\u0646\u0634\u0646\u0627\u0644', bias: 1, lang: 'fa' },
  { url: 'https://news.google.com/rss/search?q=site:radiofarda.com+when:7d&hl=fa&gl=IR&ceid=IR:fa', source: '\u0631\u0627\u062F\u06CC\u0648 \u0641\u0631\u062F\u0627', bias: 0, lang: 'fa' },
  { url: 'https://www.bbc.com/persian/index.xml', source: '\u0628\u06CC\u200C\u0628\u06CC\u200C\u0633\u06CC \u0641\u0627\u0631\u0633\u06CC', bias: 0, lang: 'fa' },
  { url: 'https://news.google.com/rss/search?q=site:ir.voanews.com&hl=fa&gl=IR&ceid=IR:fa', source: '\u0635\u062F\u0627\u06CC \u0622\u0645\u0631\u06CC\u06A9\u0627', bias: 0, lang: 'fa' },
  { url: 'https://news.google.com/rss/search?q=site:dw.com+iran&hl=fa&gl=IR&ceid=IR:fa', source: '\u062F\u0648\u06CC\u0686\u0647\u200C\u0648\u0644\u0647 \u0641\u0627\u0631\u0633\u06CC', bias: 0, lang: 'fa' },
  { url: 'https://www.independentpersian.com/rss.xml', source: '\u0627\u06CC\u0646\u062F\u06CC\u067E\u0646\u062F\u0646\u062A \u0641\u0627\u0631\u0633\u06CC', bias: -1, lang: 'fa' },
];

const ALL_FEEDS = [...FEEDS_EN, ...FEEDS_FA];

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
  // Atom <link> is self-closing with href attribute
  const altMatch = entryXml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (altMatch) return altMatch[1];
  const anyMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (anyMatch) return anyMatch[1];
  return '';
}

// Feb 25, 2025 00:00 ET = Feb 25, 2025 05:00 UTC
const DATE_CUTOFF = new Date('2025-02-25T05:00:00Z');

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (d < DATE_CUTOFF) return null;
  return d.toISOString();
}

/** Google News appends " - Source Name" to titles. Strip it. */
function cleanGoogleNewsTitle(title: string): string {
  return title.replace(/\s+-\s+[^-]+$/, '');
}

function isGoogleNewsFeed(url: string): boolean {
  return url.startsWith('https://news.google.com/');
}

function parseRSS(xml: string, feedSource: FeedSource): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const isGN = isGoogleNewsFeed(feedSource.url);
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];
    let title = stripHtml(extractTagContent(itemXml, 'title'));
    const link = stripHtml(extractTagContent(itemXml, 'link'));
    const description = stripHtml(extractTagContent(itemXml, 'description')).slice(0, 500);
    const pub_date = parseDate(stripHtml(extractTagContent(itemXml, 'pubDate')));

    if (!title || !link) continue;
    // Skip articles with a date that's before the cutoff (null date = no date, still include)
    if (extractTagContent(itemXml, 'pubDate') && !pub_date) continue;

    if (isGN) title = cleanGoogleNewsTitle(title);

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
    const link = extractAtomLink(entryXml);
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
  // Try RSS first (most feeds), then Atom
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
    if (!response.ok) {
      return { articles: [], error: `HTTP ${response.status}` };
    }
    const xml = await response.text();
    const articles = parseFeedXml(xml, feedSource);
    if (articles.length === 0) {
      return { articles: [], error: 'Parsed 0 articles (empty or unrecognized format)' };
    }
    return { articles };
  } catch (err) {
    return { articles: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Article text extraction for summarization ──────────────────
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

  return text.slice(0, 4000);
}

interface AISummaryResult {
  summary: string;
  relevance: Relevance;
}

async function summarizeArticle(url: string, title: string): Promise<AISummaryResult | null> {
  const xai = getXAI();
  if (!xai) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
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
    const articleText = extractArticleText(html);
    if (articleText.length < 100) return null;

    const completion = await xai.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are a concise news summarizer focused on Iran and the Middle East.

Return a JSON object with exactly two fields:
- "summary": 2-3 sentence summary capturing the key facts. Be neutral and factual. Write in the same language as the article.
- "relevance": integer 1-3 importance rating. Be strict -- 3 is rare and reserved for key news:
  3 = KEY NEWS: major military strikes on Iran, regime leadership killed/fallen, war declarations, nuclear developments, mass civilian casualties, historic policy shifts. Reserve 3 only for events that would lead a front page.
  2 = IMPORTANT: notable Iran-related diplomacy, significant regional military operations, sanctions changes, major protests, important political statements about Iran.
  1 = RELEVANT: general Middle East coverage, routine updates, tangential Iran mentions, background context, regional news not directly impacting Iran.

Return ONLY valid JSON, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Article title: ${title}\n\nArticle text:\n${articleText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const relevance = [1, 2, 3].includes(parsed.relevance) ? parsed.relevance as Relevance : 1;
      return { summary: parsed.summary || raw, relevance };
    } catch {
      // If JSON parse fails, use the raw text as summary
      return { summary: raw, relevance: 1 };
    }
  } catch {
    return null;
  }
}

// ── Telegram channel scraping ───────────────────────────────────

interface TelegramChannel {
  username: string;
  label: string;
}

// All channels are vetted: opposition, independent, Israeli, or Western sources only.
// No pro-regime (IR state media / IRGC-affiliated) channels.
const TELEGRAM_CHANNELS: TelegramChannel[] = [
  // Iranian opposition & Persian-language
  { username: 'rodast_omiddana', label: 'Omid Dana' },
  { username: 'kianmeli1', label: 'Kian Meli' },
  { username: 'vahidonline', label: 'Vahid Online' },
  { username: 'OfficialRezaPahlavi', label: 'Reza Pahlavi' },
  // Iranian state media (IR propaganda)
  { username: 'farsna', label: 'Fars News Agency' },
  { username: 'tasnimnews', label: 'Tasnim News' },
  // Persian-language international
  { username: 'IranintlTV', label: 'Iran International' },
  { username: 'bbcpersian', label: 'BBC Persian' },
  { username: 'RadioFarda', label: 'Radio Farda' },
  // English-language
  { username: 'FoxNews', label: 'Fox News' },
  { username: 'aljazeeraglobal', label: 'Al Jazeera English' },
  // Israeli & OSINT sources
  { username: 'CIG_telegram', label: 'CIG OSINT' },
  { username: 'kann_news', label: 'Kan News (Israel)' },
  { username: 'AbuAliExpress', label: 'Abu Ali Express' },
  { username: 'OSINTdefender', label: 'OSINT Defender' },
  // Russian & Chinese state media
  { username: 'rt_russ', label: 'RT Russian' },
  { username: 'XHNews', label: 'Xinhua News (China)' },
];

interface RawTelegramPost {
  channel: string;
  label: string;
  messageId: string;
  link: string;
  text: string;       // truncated for Grok processing
  fullText: string;   // complete untruncated text for raw archive
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

    // Extract data-post IDs
    const postIds = [...html.matchAll(/data-post="([^"]+)"/g)].map(m => m[1]);
    // Extract message texts
    const textMatches = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];
    // Extract dates
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
        text: rawText.slice(0, 2000),   // truncated copy for Grok screening
        fullText: rawText,               // complete text for raw archive
        date: dateMatches[i] || null,
      });
    }

    return { posts };
  } catch (err) {
    return { posts: [], error: err instanceof Error ? err.message : String(err) };
  }
}

interface ProcessedTelegramPost {
  headline: string;
  relevance: Relevance;
  originalIndex: number;
}

async function screenAndRewriteTelegram(posts: RawTelegramPost[]): Promise<ProcessedTelegramPost[]> {
  const xai = getXAI();
  if (!xai || posts.length === 0) return [];

  const numbered = posts.map((p, i) => `[${i}] (${p.label}) ${p.text.slice(0, 500)}`).join('\n\n');

  try {
    const completion = await xai.chat.completions.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You are a wire-service editor processing raw Telegram channel posts about Iran and the Middle East.

For each post, decide if it contains any news content -- events, statements, developments, military updates, political moves, or notable claims. Be INCLUSIVE: if in doubt, keep it. Only skip: duplicate/near-identical info already in this batch, pure promotions/ads, channel subscription links, emoji-only reactions, or forwarded jokes with zero news content.

For each newsworthy post, rewrite it as a single punchy headline-style sentence (like a wire alert). Examples:
- "Israel struck IRGC positions in Isfahan province overnight"
- "Trump: 'Iran will never have nuclear weapons under my watch'"
- "IRGC officers reportedly abandoning posts in western provinces"

Return ONLY a JSON array of objects: { "i": <original_index>, "h": "<headline>", "r": <1|2|3 importance> }
Importance (be strict -- 3 is rare):
  3 = KEY: major strikes on Iran, leadership killed, war declarations, nuclear events, mass casualties. Front-page-level only.
  2 = IMPORTANT: significant military ops, diplomacy, sanctions, major protests, notable political statements.
  1 = RELEVANT: routine updates, general regional news, tangential mentions, background context.
Most items should be 1 or 2. Only give 3 for truly major breaking events.
If no posts are newsworthy, return []. No markdown fences.`,
        },
        {
          role: 'user',
          content: numbered,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((p: { i?: number; h?: string; r?: number }) => typeof p.i === 'number' && typeof p.h === 'string' && p.h.length > 0)
      .map((p: { i: number; h: string; r?: number }) => ({
        headline: p.h,
        relevance: ([1, 2, 3].includes(p.r || 0) ? p.r : 2) as Relevance,
        originalIndex: p.i,
      }));
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────

/** Snap a Date to the nearest 5-minute boundary (floor) */
function snapTo5Min(date: Date): Date {
  const ms = date.getTime();
  return new Date(Math.floor(ms / (5 * 60 * 1000)) * (5 * 60 * 1000));
}

// ── Cron secret validation ─────────────────────────────────────
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

  const supabase = getSupabaseAdmin();
  const startTime = Date.now();
  const refreshTime = snapTo5Min(new Date());

  try {
    // 1. Fetch all RSS/Atom feeds in parallel
    console.log(`[news-refresh] Fetching ${ALL_FEEDS.length} feeds...`);
    const feedResults = await Promise.all(ALL_FEEDS.map(feed => fetchFeed(feed)));

    // Log any feed failures
    const failures: string[] = [];
    feedResults.forEach((result, i) => {
      if (result.error) {
        failures.push(`${ALL_FEEDS[i].source}: ${result.error}`);
      }
    });
    if (failures.length > 0) {
      console.warn(`[news-refresh] ${failures.length} feeds failed:\n  ${failures.join('\n  ')}`);
    }

    const allArticles = feedResults.flatMap(r => r.articles);
    console.log(`[news-refresh] Parsed ${allArticles.length} articles from ${ALL_FEEDS.length - failures.length}/${ALL_FEEDS.length} feeds`);

    // 2. Record the refresh time regardless of whether new articles were found
    await supabase
      .from('news_meta')
      .upsert(
        { key: 'last_refresh', value: refreshTime.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (allArticles.length === 0) {
      return NextResponse.json({
        message: 'No articles found',
        feeds_failed: failures.length,
        refresh_time: refreshTime.toISOString(),
        duration: Date.now() - startTime,
      });
    }

    // 3. Get existing links to deduplicate
    const links = allArticles.map(a => a.link);
    const { data: existing } = await supabase
      .from('news_feed')
      .select('link')
      .in('link', links);

    const existingLinks = new Set((existing || []).map(e => e.link));
    const newArticles = allArticles.filter(a => !existingLinks.has(a.link));
    console.log(`[news-refresh] ${newArticles.length} new articles to insert`);

    if (newArticles.length === 0) {
      return NextResponse.json({
        message: 'No new articles',
        total_parsed: allArticles.length,
        feeds_failed: failures.length,
        refresh_time: refreshTime.toISOString(),
        duration: Date.now() - startTime,
      });
    }

    // 4. Insert new articles with keyword-based relevance (AI may refine later)
    const { error: insertError, data: inserted } = await supabase
      .from('news_feed')
      .upsert(
        newArticles.map(a => ({
          link: a.link,
          title: a.title,
          source: a.source,
          description: a.description,
          pub_date: a.pub_date,
          bias: a.bias,
          paywall: a.paywall,
          lang: a.lang,
          relevance: a.relevance,
          type: 'rss',
        })),
        { onConflict: 'link', ignoreDuplicates: true }
      )
      .select('id, link, title, paywall');

    if (insertError) {
      console.error('[news-refresh] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log(`[news-refresh] Inserted ${inserted?.length || 0} articles`);

    // 5. Generate AI summaries + relevance for non-paywall new articles (max 40 per run, 5 concurrency)
    const toSummarize = (inserted || []).filter(a => !a.paywall).slice(0, 40);
    let summariesGenerated = 0;

    for (let i = 0; i < toSummarize.length; i += 5) {
      const batch = toSummarize.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(a => summarizeArticle(a.link, a.title))
      );

      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        if (result) {
          await supabase
            .from('news_feed')
            .update({ summary: result.summary, relevance: result.relevance })
            .eq('id', batch[j].id);
          summariesGenerated++;
        }
      }
    }

    // ── 6. Telegram channels ──────────────────────────────────────
    let telegramNew = 0;
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

      // Archive ALL raw posts to self-hosted Postgres (unfiltered)
      const rawPool = getRawArchivePool();
      if (rawPool && allPosts.length > 0) {
        try {
          let rawInserted = 0;
          for (const p of allPosts) {
            const { rowCount } = await rawPool.query(
              `INSERT INTO telegram_raw (channel, channel_label, message_id, link, raw_text, pub_date)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (link) DO NOTHING`,
              [p.channel, p.label, parseInt(p.messageId, 10), p.link, p.fullText, p.date || null]
            );
            rawInserted += (rowCount || 0);
          }
          if (rawInserted > 0) {
            console.log(`[news-refresh] Archived ${rawInserted} raw Telegram posts to local Postgres`);
          }
        } catch (rawErr) {
          console.error(`[news-refresh] Raw archive error (non-fatal): ${rawErr instanceof Error ? rawErr.message : rawErr}`);
        }
      }

      if (allPosts.length > 0) {
        // Deduplicate against existing
        const tgLinks = allPosts.map(p => p.link);
        const { data: existingTg } = await supabase
          .from('news_feed')
          .select('link')
          .in('link', tgLinks);
        const existingTgLinks = new Set((existingTg || []).map(e => e.link));
        const newPosts = allPosts.filter(p => !existingTgLinks.has(p.link));
        console.log(`[news-refresh] ${newPosts.length} new Telegram posts to process`);

        if (newPosts.length > 0) {
          // Screen and rewrite via Grok in batches of 40, process all new posts
          let processed: ProcessedTelegramPost[] = [];
          for (let batch = 0; batch < newPosts.length; batch += 40) {
            const chunk = newPosts.slice(batch, batch + 40);
            const result = await screenAndRewriteTelegram(chunk);
            // Adjust originalIndex to be relative to full newPosts array
            processed.push(...result.map(p => ({ ...p, originalIndex: p.originalIndex + batch })));
          }
          const toProcess = newPosts;
          console.log(`[news-refresh] Grok kept ${processed.length}/${toProcess.length} Telegram posts as newsworthy`);

          if (processed.length > 0) {
            const telegramRows = processed.map(p => {
              const orig = toProcess[p.originalIndex];
              return {
                link: orig.link,
                title: p.headline,
                source: orig.label,
                description: orig.text.slice(0, 500),
                pub_date: orig.date ? new Date(orig.date).toISOString() : null,
                bias: 0,
                paywall: false,
                lang: 'en',
                relevance: p.relevance,
                type: 'telegram',
              };
            });

            const { error: tgInsertError, data: tgInserted } = await supabase
              .from('news_feed')
              .upsert(telegramRows, { onConflict: 'link', ignoreDuplicates: true })
              .select('id');

            if (tgInsertError) {
              console.error('[news-refresh] Telegram insert error:', tgInsertError);
            } else {
              telegramNew = tgInserted?.length || 0;
              console.log(`[news-refresh] Inserted ${telegramNew} Telegram headlines`);
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[news-refresh] Done in ${duration}ms. ${inserted?.length || 0} RSS new, ${telegramNew} TG new, ${summariesGenerated} summarized, ${failures.length} feeds failed`);

    return NextResponse.json({
      message: 'Refresh complete',
      new_articles: inserted?.length || 0,
      telegram_new: telegramNew,
      summaries_generated: summariesGenerated,
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
