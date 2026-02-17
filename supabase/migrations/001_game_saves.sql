-- IRAN 14XX Game Saves Table
-- This table stores saved game states for cloud sync

CREATE TABLE IF NOT EXISTS game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  character_id TEXT NOT NULL,
  turn INTEGER NOT NULL DEFAULT 0,
  save_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by session
CREATE INDEX IF NOT EXISTS idx_game_saves_session_id ON game_saves(session_id);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);

-- Enable Row Level Security
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own saves (by session or user_id)
CREATE POLICY "Users can access their own saves" ON game_saves
  FOR ALL
  USING (
    session_id = current_setting('request.headers')::json->>'x-session-id'
    OR user_id = auth.uid()
  );

-- Policy: Service role can access all saves
CREATE POLICY "Service role has full access" ON game_saves
  FOR ALL
  TO service_role
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_saves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS game_saves_updated_at ON game_saves;
CREATE TRIGGER game_saves_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_game_saves_updated_at();

-- Comment on table
COMMENT ON TABLE game_saves IS 'Stores IRAN 14XX game save data for cloud sync';
