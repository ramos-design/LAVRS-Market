-- Fix events.status check constraint to allow 'soldout'
-- Run this in Supabase SQL Editor

ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events
ADD CONSTRAINT events_status_check
CHECK (status IN ('open', 'closed', 'waitlist', 'draft', 'soldout'));
