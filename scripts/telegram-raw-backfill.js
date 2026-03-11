#!/usr/bin/env node
/**
 * Backfill telegram_raw table on self-hosted Postgres with ALL posts
 * from Jan 1, 2026 to now. No Grok filtering — stores everything raw.
 *
 * Usage: node scripts/telegram-raw-backfill.js
 * Requires PG_* env vars (or uses defaults for the Hetzner server)
 */

const { Pool } = require('pg');

const TARGET_DATE = new Date('2026-01-01T00:00:00Z');
const PAGE_DELAY_MS = 300;

const CHANNELS = [
  { username: 'rodast_omiddana', label: 'Omid Dana' },
  { username: 'kianmeli1', label: 'Kian Meli' },
  { username: 'IranintlTV', label: 'Iran International' },
  { username: 'bbcpersian', label: 'BBC Persian' },
  { username: 'RadioFarda', label: 'Radio Farda' },
  { username: 'FoxNews', label: 'Fox News' },
  { username: 'CIG_telegram', label: 'CIG OSINT' },
  { username: 'kann_news', label: 'Kan News (Israel)' },
  { username: 'AbuAliExpress', label: 'Abu Ali Express' },
  { username: 'OSINTdefender', label: 'OSINT Defender' },
];

const pool = new Pool({
  host: process.env.PG_HOST || '89.167.33.158',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'rebuilding_iran',
  user: process.env.PG_USER || 'rebuilding',
  password: process.env.PG_PASSWORD || '',
  max: 5,
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

  while (page < 2000) {
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

      const earliestId = Math.min(...posts.map(p => p.message_id));
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

async function main() {
  console.log('=== Raw Telegram Backfill to Local Postgres ===');
  console.log(`Target: ${TARGET_DATE.toISOString().slice(0, 10)} to now`);

  // Test connection
  const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM telegram_raw');
  console.log(`Current telegram_raw count: ${rows[0].count}`);

  // Scrape all channels
  let allPosts = [];
  for (const ch of CHANNELS) {
    console.log(`\nScraping ${ch.label} (${ch.username})...`);
    const posts = await scrapeChannelToDate(ch, TARGET_DATE);
    allPosts.push(...posts);
  }

  console.log(`\nTotal scraped: ${allPosts.length} posts`);

  // Dedup against existing
  const existingLinks = new Set();
  for (let i = 0; i < allPosts.length; i += 500) {
    const batch = allPosts.slice(i, i + 500);
    const placeholders = batch.map((_, j) => `$${j + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT link FROM telegram_raw WHERE link IN (${placeholders})`,
      batch.map(p => p.link)
    );
    rows.forEach(r => existingLinks.add(r.link));
  }

  const newPosts = allPosts.filter(p => !existingLinks.has(p.link));
  console.log(`After dedup: ${newPosts.length} new posts (${existingLinks.size} already in DB)`);

  if (newPosts.length === 0) {
    console.log('All posts already archived.');
    await pool.end();
    return;
  }

  // Insert in batches
  let totalInserted = 0;
  const BATCH_SIZE = 100;
  for (let i = 0; i < newPosts.length; i += BATCH_SIZE) {
    const batch = newPosts.slice(i, i + BATCH_SIZE);
    let batchInserted = 0;

    for (const p of batch) {
      const { rowCount } = await pool.query(
        `INSERT INTO telegram_raw (channel, channel_label, message_id, link, raw_text, pub_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (link) DO NOTHING`,
        [p.channel, p.channel_label, p.message_id, p.link, p.raw_text, p.pub_date || null]
      );
      batchInserted += (rowCount || 0);
    }

    totalInserted += batchInserted;
    process.stdout.write(`  Inserted ${totalInserted}/${newPosts.length}\r`);
  }

  console.log(`\n\n=== Done ===`);
  console.log(`Scraped: ${allPosts.length}, New: ${newPosts.length}, Inserted: ${totalInserted}`);

  // Show per-channel summary
  const { rows: summary } = await pool.query(
    `SELECT channel, COUNT(*)::int as count, MIN(pub_date)::date as oldest, MAX(pub_date)::date as newest
     FROM telegram_raw GROUP BY channel ORDER BY count DESC`
  );
  console.log('\nDB coverage:');
  for (const row of summary) {
    console.log(`  ${row.channel}: ${row.count} posts (${row.oldest || '?'} to ${row.newest || '?'})`);
  }

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
