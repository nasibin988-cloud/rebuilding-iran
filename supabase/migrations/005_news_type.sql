-- Distinguish RSS articles from Telegram posts
ALTER TABLE news_feed ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'rss';

CREATE INDEX IF NOT EXISTS idx_news_feed_type ON news_feed(type);
