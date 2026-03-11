#!/usr/bin/env node
/**
 * Backfill a SINGLE Telegram channel to self-hosted Postgres.
 * Designed to be run in parallel for multiple channels.
 *
 * Usage: node scripts/backfill-single-channel.js <username> <label>
 * Example: node scripts/backfill-single-channel.js farsna "Fars News Agency"
 */

const { Pool } = require('pg');

const TARGET_DATE = new Date('2026-01-01T00:00:00Z');
const PAGE_DELAY_MS = 300;
const MAX_PAGES = 2000;

const username = process.argv[2];
const label = process.argv[3];

if (!username || !label) {
  console.error('Usage: node backfill-single-channel.js <username> <label>');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PG_HOST || '89.167.33.158',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'rebuilding_iran',
  user: process.env.PG_USER || 'rebuilding',
  password: process.env.PG_PASSWORD || '',
  max: 3,
  connectionTimeoutMillis: 10000,
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

    if (!rawText) continue;

    const postId = postIds[i];
    const msgNum = postId.split('/')[1] || postId;
    const dateStr = dateMatches[i] || null;

    posts.push({
      channel: channel.username,
      channel_label: channel.label,
      message_id: parseInt(msgNum, 10),
      link: `https://t.me/${channel.username}/${msgNum}`,
      raw_text: rawText,
      pub_date: dateStr,
      dateObj: dateStr ? new Date(dateStr) : null,
    });
  }
  return posts;
}

async function scrapeChannelToDate(channel, targetDate) {
  const allPosts = [];
  let beforeId = null;
  let page = 0;

  while (page < MAX_PAGES) {
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
      if (!res.ok) { console.log(`[${channel.username}] HTTP ${res.status}`); break; }

      const html = await res.text();
      const posts = parseTelegramPage(html, channel);
      if (posts.length === 0) break;

      let hitTarget = false;
      for (const p of posts) {
        if (p.dateObj && p.dateObj < targetDate) { hitTarget = true; continue; }
        allPosts.push(p);
      }

      if (page % 50 === 0 || hitTarget) {
        const oldest = posts[posts.length-1].dateObj?.toISOString().slice(0,10) || '?';
        console.log(`[${channel.username}] p${page}: ${allPosts.length} posts (back to ${oldest})`);
      }

      if (hitTarget) {
        console.log(`[${channel.username}] Reached target date. ${allPosts.length} posts collected.`);
        break;
      }

      const earliestId = Math.min(...posts.map(p => p.message_id));
      if (earliestId === beforeId) break;
      beforeId = earliestId;
      page++;
      await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
    } catch (err) {
      console.log(`[${channel.username}] Error: ${err.message}`);
      break;
    }
  }

  if (page >= MAX_PAGES) console.log(`[${channel.username}] Hit page limit. ${allPosts.length} posts.`);
  return allPosts;
}

async function main() {
  const channel = { username, label };
  console.log(`[${username}] Backfilling "${label}" to ${TARGET_DATE.toISOString().slice(0, 10)}...`);

  const allPosts = await scrapeChannelToDate(channel, TARGET_DATE);
  if (allPosts.length === 0) {
    console.log(`[${username}] No posts found.`);
    await pool.end();
    return;
  }

  console.log(`[${username}] Scraped ${allPosts.length} posts. Inserting...`);

  let inserted = 0;
  for (const p of allPosts) {
    const { rowCount } = await pool.query(
      `INSERT INTO telegram_raw (channel, channel_label, message_id, link, raw_text, pub_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (link) DO NOTHING`,
      [p.channel, p.channel_label, p.message_id, p.link, p.raw_text, p.pub_date || null]
    );
    inserted += (rowCount || 0);
  }

  console.log(`[${username}] Done. Scraped: ${allPosts.length}, Inserted: ${inserted}`);
  await pool.end();
}

main().catch(err => { console.error(`[${username}] Fatal:`, err); process.exit(1); });
