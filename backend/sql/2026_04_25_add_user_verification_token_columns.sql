ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP NULL;
