-- Diagnostics for slow loading in LAVRS Market
-- Run in Supabase SQL Editor

-- 1) Detect events with very large image payloads (often inline data URLs).
SELECT
  id,
  title,
  LEFT(image, 30) AS image_prefix,
  LENGTH(COALESCE(image, '')) AS image_length
FROM events
ORDER BY LENGTH(COALESCE(image, '')) DESC
LIMIT 20;

-- 2) Detect very large application rows.
SELECT
  id,
  user_id,
  status,
  pg_column_size(t) AS row_bytes
FROM applications t
ORDER BY row_bytes DESC
LIMIT 20;

-- Optional cleanup if image column contains data URLs and you want faster list loads.
-- WARNING: this removes embedded images; re-upload them to Storage afterwards.
-- UPDATE events
-- SET image = NULL
-- WHERE image LIKE 'data:%';
