-- Conversation history for all Instagram DM interactions
CREATE TABLE IF NOT EXISTS stf_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id  TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'bot')),
  content    TEXT    NOT NULL,
  created_at INTEGER NOT NULL  -- unix seconds
);

CREATE INDEX IF NOT EXISTS idx_stf_messages_sender_created
  ON stf_messages (sender_id, created_at);

-- Pending Sightengine analysis jobs (replaces KV for job state)
CREATE TABLE IF NOT EXISTS stf_analysis_jobs (
  job_id       TEXT    PRIMARY KEY,
  sender_id    TEXT    NOT NULL,
  content_url  TEXT    NOT NULL,
  phase        TEXT    NOT NULL CHECK (phase IN ('genai', 'deepfake')),
  genai_frames TEXT,             -- JSON string, NULL until genai callback arrives
  created_at   INTEGER NOT NULL  -- unix seconds
);
