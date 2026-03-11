-- Tracks metadata for the news system (e.g. last refresh time)
CREATE TABLE IF NOT EXISTS news_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE news_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news meta"
  ON news_meta FOR SELECT USING (true);
