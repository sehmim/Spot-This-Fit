CREATE TABLE IF NOT EXISTS video_cache (
    id               SERIAL PRIMARY KEY,
    platform         TEXT NOT NULL,
    video_id         TEXT NOT NULL,
    original_url     TEXT NOT NULL,
    local_path       TEXT NOT NULL,
    public_url       TEXT NOT NULL,
    duration_seconds INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (platform, video_id)
);
