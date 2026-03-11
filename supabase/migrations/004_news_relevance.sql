-- Add relevance rating (1-3) to news articles
-- 3 = Directly about Iran, 2 = Regionally relevant, 1 = Tangentially related
ALTER TABLE news_feed ADD COLUMN IF NOT EXISTS relevance SMALLINT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_news_feed_relevance ON news_feed(relevance DESC);
