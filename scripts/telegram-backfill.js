#!/usr/bin/env node
/**
 * One-time Telegram backfill script.
 * Paginates through t.me/s/<channel>?before=<id> to collect historical posts,
 * screens them via Grok, and inserts newsworthy ones into the news_feed table.
 *
 * Usage: node scripts/telegram-backfill.js
 * (Requires .env.local to be sourced first)
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai').default;

// ── Config ──────────────────────────────────────────────────────
const DATE_CUTOFF = new Date('2025-02-25T05:00:00Z');
const MODEL = 'grok-4-1-fast-reasoning';
const GROK_BATCH_SIZE = 40; // posts per Grok call
const PAGE_DELAY_MS = 500;  // polite delay between Telegram fetches
const MAX_PAGES_PER_CHANNEL = 200; // safety limit (~4000 posts per channel)

const CHANNELS = [
  { username: 'rodast_omiddana', label: 'Omid Dana' },
  { username: 'kianmeli1', label: 'Kian Meli' },
  { username: 'IranintlTV', label: 'Iran International' },
  { username: 'bbcpersian', label: 'BBC Persian' },
  { username: 'RadioFarda', label: 'Radio Farda' },
  { username: 'bbcworld', label: 'BBC World' },
];

// ── Clients ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// ── Telegram scraping with pagination ───────────────────────────
function parseTelegramPage(html, channel) {
  const posts = [];

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

    if (!rawText || rawText.length < 10) continue;

    const postId = postIds[i];
    const msgNum = postId.split('/')[1] || postId;
    const dateStr = dateMatches[i] || null;
    const date = dateStr ? new Date(dateStr) : null;

    posts.push({
      channel: channel.username,
      label: channel.label,
      messageId: parseInt(msgNum, 10),
      link: `https://t.me/${channel.username}/${msgNum}`,
      text: rawText.slice(0, 2000),
      date: dateStr,
      dateObj: date,
    });
  }

  return posts;
}

async function fetchTelegramPage(channel, beforeId) {
  const url = beforeId
    ? `https://t.me/s/${channel.username}?before=${beforeId}`
    : `https://t.me/s/${channel.username}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { posts: [], error: `HTTP ${res.status}` };
    const html = await res.text();
    return { posts: parseTelegramPage(html, channel) };
  } catch (err) {
    clearTimeout(timeout);
    return { posts: [], error: err.message };
  }
}

async function scrapeChannelFull(channel) {
  const allPosts = [];
  let beforeId = null;
  let page = 0;
  let hitCutoff = false;

  console.log(`\n  [${channel.username}] Starting backfill...`);

  while (page < MAX_PAGES_PER_CHANNEL) {
    const { posts, error } = await fetchTelegramPage(channel, beforeId);

    if (error) {
      console.log(`  [${channel.username}] Page ${page}: error - ${error}`);
      break;
    }

    if (posts.length === 0) {
      console.log(`  [${channel.username}] Page ${page}: no more posts`);
      break;
    }

    // Check oldest post on this page
    const oldest = posts[posts.length - 1];
    const newest = posts[0];

    // Filter posts within date range
    for (const p of posts) {
      if (p.dateObj && p.dateObj < DATE_CUTOFF) {
        hitCutoff = true;
        continue;
      }
      allPosts.push(p);
    }

    const oldestDate = oldest.dateObj ? oldest.dateObj.toISOString().slice(0, 10) : '?';
    const newestDate = newest.dateObj ? newest.dateObj.toISOString().slice(0, 10) : '?';
    process.stdout.write(`  [${channel.username}] Page ${page}: ${posts.length} posts (${newestDate} to ${oldestDate}), total: ${allPosts.length}\r`);

    if (hitCutoff) {
      console.log(`\n  [${channel.username}] Hit date cutoff (${DATE_CUTOFF.toISOString().slice(0, 10)})`);
      break;
    }

    // Set up next page
    const earliestId = Math.min(...posts.map(p => p.messageId));
    if (earliestId === beforeId) {
      console.log(`\n  [${channel.username}] Stuck at same ID, stopping`);
      break;
    }
    beforeId = earliestId;
    page++;

    // Polite delay
    await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
  }

  console.log(`  [${channel.username}] Collected ${allPosts.length} posts total`);
  return allPosts;
}

// ── Grok screening ──────────────────────────────────────────────
async function screenBatch(posts) {
  if (posts.length === 0) return [];

  const numbered = posts.map((p, i) => `[${i}] (${p.label}) ${p.text.slice(0, 500)}`).join('\n\n');

  try {
    const completion = await xai.chat.completions.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You are a wire-service editor processing raw Telegram channel posts about Iran and the Middle East.

For each post, decide if it contains an actual newsworthy event, statement, or development. Skip: duplicate/redundant info, promotions, channel links, personal commentary without facts, forwarded jokes, or vague reactions.

For each newsworthy post, rewrite it as a single punchy headline-style sentence (like a wire alert). Examples:
- "Israel struck IRGC positions in Isfahan province overnight"
- "Trump: 'Iran will never have nuclear weapons under my watch'"
- "IRGC officers reportedly abandoning posts in western provinces"

Return ONLY a JSON array of objects: { "i": <original_index>, "h": "<headline>", "r": <1|2|3 relevance> }
Relevance: 3=Iran direct, 2=regional, 1=tangential.
If no posts are newsworthy, return []. No markdown fences.`,
        },
        { role: 'user', content: numbered },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(p => typeof p.i === 'number' && typeof p.h === 'string' && p.h.length > 0)
      .map(p => ({
        headline: p.h,
        relevance: [1, 2, 3].includes(p.r) ? p.r : 2,
        originalIndex: p.i,
      }));
  } catch (err) {
    console.error(`    Grok error: ${err.message}`);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('=== Telegram Historical Backfill ===');
  console.log(`Date cutoff: ${DATE_CUTOFF.toISOString()}`);
  console.log(`Channels: ${CHANNELS.map(c => c.username).join(', ')}`);

  // 1. Scrape all channels
  let allPosts = [];
  for (const ch of CHANNELS) {
    const posts = await scrapeChannelFull(ch);
    allPosts.push(...posts);
  }

  console.log(`\nTotal scraped: ${allPosts.length} posts`);
  if (allPosts.length === 0) {
    console.log('Nothing to process.');
    return;
  }

  // 2. Deduplicate against existing DB entries
  // Check in batches of 500 links
  const existingLinks = new Set();
  for (let i = 0; i < allPosts.length; i += 500) {
    const batch = allPosts.slice(i, i + 500);
    const links = batch.map(p => p.link);
    const { data } = await supabase
      .from('news_feed')
      .select('link')
      .in('link', links);
    if (data) data.forEach(d => existingLinks.add(d.link));
  }

  const newPosts = allPosts.filter(p => !existingLinks.has(p.link));
  console.log(`After dedup: ${newPosts.length} new posts (${existingLinks.size} already in DB)`);

  if (newPosts.length === 0) {
    console.log('All posts already in DB.');
    return;
  }

  // 3. Process through Grok in batches
  let totalInserted = 0;
  let totalScreened = 0;

  for (let i = 0; i < newPosts.length; i += GROK_BATCH_SIZE) {
    const batch = newPosts.slice(i, i + GROK_BATCH_SIZE);
    const batchNum = Math.floor(i / GROK_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(newPosts.length / GROK_BATCH_SIZE);

    process.stdout.write(`\nGrok batch ${batchNum}/${totalBatches} (${batch.length} posts)... `);

    const processed = await screenBatch(batch);
    totalScreened += processed.length;
    console.log(`${processed.length} newsworthy`);

    if (processed.length === 0) continue;

    // Build rows for insertion
    const rows = processed.map(p => {
      const orig = batch[p.originalIndex];
      if (!orig) return null;
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
    }).filter(Boolean);

    if (rows.length > 0) {
      const { error, data: inserted } = await supabase
        .from('news_feed')
        .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.error(`  Insert error: ${error.message}`);
      } else {
        totalInserted += (inserted?.length || 0);
        console.log(`  Inserted ${inserted?.length || 0} rows`);
      }
    }

    // Small delay between Grok calls
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Backfill Complete ===`);
  console.log(`Total scraped: ${allPosts.length}`);
  console.log(`New (not in DB): ${newPosts.length}`);
  console.log(`Newsworthy (Grok): ${totalScreened}`);
  console.log(`Inserted: ${totalInserted}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
