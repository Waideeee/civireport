BEGIN;

-- Backfill any verification timestamps onto email_verified_at before dropping.
UPDATE users
SET email_verified_at = COALESCE(email_verified_at, verified_at)
WHERE email_verified_at IS NULL
  AND verified_at IS NOT NULL;

ALTER TABLE users
    DROP COLUMN IF EXISTS is_verified,
    DROP COLUMN IF EXISTS verified_at;

COMMIT;
