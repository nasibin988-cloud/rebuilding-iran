-- Add full_text column to store complete article body text
ALTER TABLE news_feed ADD COLUMN IF NOT EXISTS full_text TEXT;

-- Index for finding articles missing full text (for backfill)
CREATE INDEX IF NOT EXISTS idx_news_feed_fulltext_null ON news_feed (created_at DESC) WHERE full_text IS NULL;
