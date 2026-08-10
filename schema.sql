-- Run once in the Cloudflare D1 console.

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL,
  site        TEXT    NOT NULL,          -- 'realroofers' or 'jerseycity'
  name        TEXT    NOT NULL,
  town        TEXT,
  job         TEXT,                      -- what the work was
  when_done   TEXT,                      -- e.g. '2019'
  body        TEXT    NOT NULL,          -- their words
  reply       TEXT,                      -- Mark's response
  published   INTEGER NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  ip_hash     TEXT                       -- for rate limiting only
);

CREATE INDEX IF NOT EXISTS idx_reviews_site
  ON reviews (site, published, position DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rate
  ON reviews (ip_hash, created_at);
