-- Enforce long-term event image policy:
-- 1) remove legacy inline base64 payloads from events.image
-- 2) allow only URL/relative-path values in events.image
-- Run in Supabase SQL Editor.

-- Cleanup legacy payloads first so constraint can be added safely.
UPDATE events
SET image = NULL
WHERE image IS NOT NULL
  AND (
    image ~* '^data:'
    OR btrim(image) = ''
  );

-- Drop previous constraint if it exists.
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_image_must_be_url_or_path;

-- Allow only:
-- - NULL
-- - absolute URL (http/https)
-- - app-relative path (starts with '/')
ALTER TABLE events
ADD CONSTRAINT events_image_must_be_url_or_path
CHECK (
  image IS NULL
  OR (
    image !~* '^data:'
    AND image ~* '^(https?://|/)'
  )
);

