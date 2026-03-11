-- News feed articles from RSS sources
-- Stores all fetched articles with AI summaries

CREATE TABLE news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  pub_date TIMESTAMPTZ,
  bias SMALLINT NOT NULL DEFAULT 0,
  paywall BOOLEAN DEFAULT FALSE,
  summary TEXT,
  lang TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_news_feed_lang_pub ON news_feed(lang, pub_date DESC);
CREATE INDEX idx_news_feed_source ON news_feed(source);
CREATE INDEX idx_news_feed_created ON news_feed(created_at DESC);

-- RLS: everyone can read, only service role can write
ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news feed"
  ON news_feed FOR SELECT USING (true);
