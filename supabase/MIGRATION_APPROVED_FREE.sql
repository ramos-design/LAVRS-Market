-- ============================================================================
-- LAVRS Market — Migration: APPROVED_FREE status
-- ============================================================================
-- Run this once in the Supabase SQL Editor.
-- Adds 'APPROVED_FREE' as a valid status for applications.status, used when
-- the curator approves an exhibitor for FREE (no invoice / no payment flow).
-- Idempotent — safe to re-run.
-- ============================================================================

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'PENDING',
      'APPROVED',
      'APPROVED_FREE',
      'REJECTED',
      'WAITLIST',
      'PAID',
      'EXPIRED',
      'PAYMENT_REMINDER',
      'PAYMENT_LAST_CALL',
      'PAYMENT_UNDER_REVIEW',
      'DELETED'
    )
  );

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Migration applied: APPROVED_FREE is now an allowed application status.';
END $$;
