-- Cache completed AI detection results keyed by content URL.
-- Allows replaying results instantly without re-calling Sightengine/OpenAI.
CREATE TABLE IF NOT EXISTS stf_analysis_results (
  content_url      TEXT    PRIMARY KEY,
  genai_report     TEXT    NOT NULL,  -- the genai mini-report message
  deepfake_report  TEXT    NOT NULL,  -- the deepfake mini-report message
  summary          TEXT    NOT NULL,  -- the GPT-4o combined summary message
  created_at       INTEGER NOT NULL   -- unix seconds
);
