#!/usr/bin/env node
/**
 * Targeted Telegram backfill: Feb 20 - now, all channels, sorted by date.
 * Much faster than the full backfill since it limits scope and interleaves channels.
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai').default;

const TARGET_DATE = new Date('2026-01-01T00:00:00Z');
const MODEL = 'grok-4-1-fast-reasoning';
const GROK_BATCH_SIZE = 50;
const PAGE_DELAY_MS = 300;
const MAX_RETRIES = 2;

const CHANNELS = [
  { username: 'rodast_omiddana', label: 'Omid Dana' },
  { username: 'kianmeli1', label: 'Kian Meli' },
  { username: 'IranintlTV', label: 'Iran International' },
  { username: 'bbcpersian', label: 'BBC Persian' },
  { username: 'RadioFarda', label: 'Radio Farda' },
  { username: 'bbcworld', label: 'BBC World' },
  { username: 'CIG_telegram', label: 'CIG OSINT' },
  { username: 'IsraelWarRoom', label: 'Israel War Room' },
  { username: 'AbuAliExpress', label: 'Abu Ali Express' },
  { username: 'OSINTdefender', label: 'OSINT Defender' },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

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

    posts.push({
      channel: channel.username,
      label: channel.label,
      messageId: parseInt(msgNum, 10),
      link: `https://t.me/${channel.username}/${msgNum}`,
      text: rawText.slice(0, 2000),
      date: dateStr,
      dateObj: dateStr ? new Date(dateStr) : null,
    });
  }
  return posts;
}

async function scrapeChannelToDate(channel, targetDate) {
  const allPosts = [];
  let beforeId = null;
  let page = 0;

  while (page < 500) {
    const url = beforeId
      ? `https://t.me/s/${channel.username}?before=${beforeId}`
      : `https://t.me/s/${channel.username}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'text/html',
        },
      });
      clearTimeout(timeout);
      if (!res.ok) { console.log(`  [${channel.username}] HTTP ${res.status}`); break; }

      const html = await res.text();
      const posts = parseTelegramPage(html, channel);
      if (posts.length === 0) break;

      let hitTarget = false;
      for (const p of posts) {
        if (p.dateObj && p.dateObj < targetDate) { hitTarget = true; continue; }
        allPosts.push(p);
      }

      process.stdout.write(`  [${channel.username}] p${page}: ${allPosts.length} posts (back to ${posts[posts.length-1].dateObj?.toISOString().slice(0,10) || '?'})\r`);

      if (hitTarget) {
        console.log(`\n  [${channel.username}] Reached target date. ${allPosts.length} posts collected.`);
        break;
      }

      const earliestId = Math.min(...posts.map(p => p.messageId));
      if (earliestId === beforeId) break;
      beforeId = earliestId;
      page++;
      await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
    } catch (err) {
      console.log(`  [${channel.username}] Error: ${err.message}`);
      break;
    }
  }

  if (page >= 500) console.log(`\n  [${channel.username}] Hit page limit. ${allPosts.length} posts.`);
  return allPosts;
}

async function screenBatchWithRetry(posts, attempt = 0) {
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
    if (attempt < MAX_RETRIES && (err.message.includes('503') || err.message.includes('429') || err.message.includes('capacity'))) {
      const wait = (attempt + 1) * 5000;
      console.log(`    Retry ${attempt + 1} after ${wait/1000}s (${err.message.slice(0, 60)})`);
      await new Promise(r => setTimeout(r, wait));
      return screenBatchWithRetry(posts, attempt + 1);
    }
    console.error(`    Grok error: ${err.message.slice(0, 80)}`);
    return [];
  }
}

async function main() {
  console.log('=== Targeted Telegram Backfill ===');
  console.log(`Target: ${TARGET_DATE.toISOString().slice(0, 10)} to now`);

  // 1. Scrape all channels down to target date
  let allPosts = [];
  for (const ch of CHANNELS) {
    const posts = await scrapeChannelToDate(ch, TARGET_DATE);
    allPosts.push(...posts);
  }

  console.log(`\nTotal scraped: ${allPosts.length} posts`);

  // 2. Sort by date (newest first) so all channels are interleaved
  allPosts.sort((a, b) => {
    const da = a.dateObj ? a.dateObj.getTime() : 0;
    const db = b.dateObj ? b.dateObj.getTime() : 0;
    return db - da;
  });

  // 3. Dedup against DB
  const existingLinks = new Set();
  for (let i = 0; i < allPosts.length; i += 500) {
    const batch = allPosts.slice(i, i + 500);
    const { data } = await supabase.from('news_feed').select('link').in('link', batch.map(p => p.link));
    if (data) data.forEach(d => existingLinks.add(d.link));
  }

  const newPosts = allPosts.filter(p => !existingLinks.has(p.link));
  console.log(`After dedup: ${newPosts.length} new posts (${existingLinks.size} already in DB)`);

  if (newPosts.length === 0) {
    console.log('All posts already processed.');
    return;
  }

  // 4. Process through Grok
  let totalInserted = 0;
  let totalScreened = 0;
  const totalBatches = Math.ceil(newPosts.length / GROK_BATCH_SIZE);

  for (let i = 0; i < newPosts.length; i += GROK_BATCH_SIZE) {
    const batch = newPosts.slice(i, i + GROK_BATCH_SIZE);
    const batchNum = Math.floor(i / GROK_BATCH_SIZE) + 1;

    process.stdout.write(`Grok ${batchNum}/${totalBatches} (${batch.length} posts)... `);

    const processed = await screenBatchWithRetry(batch);
    totalScreened += processed.length;
    console.log(`${processed.length} newsworthy`);

    if (processed.length > 0) {
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

      const { error, data: inserted } = await supabase
        .from('news_feed')
        .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.error(`  Insert error: ${error.message}`);
      } else {
        totalInserted += (inserted?.length || 0);
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Done ===`);
  console.log(`Scraped: ${allPosts.length}, New: ${newPosts.length}, Newsworthy: ${totalScreened}, Inserted: ${totalInserted}`);

  // Show per-source summary from DB
  const { data: summary } = await supabase
    .from('news_feed')
    .select('source, pub_date')
    .eq('type', 'telegram')
    .order('pub_date', { ascending: true });

  const bySource = {};
  for (const d of summary) {
    if (!bySource[d.source]) bySource[d.source] = { count: 0, oldest: d.pub_date };
    bySource[d.source].count++;
    bySource[d.source].newest = d.pub_date;
  }
  console.log('\nDB coverage:');
  for (const [src, info] of Object.entries(bySource)) {
    console.log(`  ${src}: ${info.count} posts (${(info.oldest||'').slice(0,10)} to ${(info.newest||'').slice(0,10)})`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
