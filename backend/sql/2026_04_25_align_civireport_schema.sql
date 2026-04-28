BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS two_factor_secret TEXT NULL,
    ADD COLUMN IF NOT EXISTS two_factor_recovery_code TEXT NULL,
    ADD COLUMN IF NOT EXISTS two_factor_confirmed_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS profile_photo_path VARCHAR(2048) NULL,
    ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS approved_at DATE NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS date_registered DATE DEFAULT CURRENT_DATE;

ALTER TABLE users
    DROP COLUMN IF EXISTS barangay;

DO $$
BEGIN
    BEGIN
        ALTER TYPE user_role RENAME VALUE 'admin' TO 'barangay_admin';
    EXCEPTION
        WHEN invalid_parameter_value THEN NULL;
        WHEN undefined_object THEN NULL;
    END;

    BEGIN
        ALTER TYPE user_role RENAME VALUE 'Resident' TO 'resident';
    EXCEPTION
        WHEN invalid_parameter_value THEN NULL;
        WHEN undefined_object THEN NULL;
    END;
END $$;

UPDATE users
SET role = 'barangay_admin'
WHERE LOWER(COALESCE(role::text, '')) = 'admin';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'announcement_id'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN id TO announcement_id';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'title'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'announcement_title'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN title TO announcement_title';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'category'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'announcement_category'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN category TO announcement_category';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'venue'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'announcement_venue'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN venue TO announcement_venue';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'description'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'announcement_description'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN description TO announcement_description';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'admin_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'announcements' AND column_name = 'user_id'
    ) THEN
        EXECUTE 'ALTER TABLE announcements RENAME COLUMN admin_id TO user_id';
    END IF;
END $$;

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'admin_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        EXECUTE 'ALTER TABLE audit_logs RENAME COLUMN admin_id TO user_id';
    END IF;
END $$;

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE complaint
    ALTER COLUMN complaint_status TYPE VARCHAR(50) USING complaint_status::text,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS resolved_media VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS resolved_notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS ai_recommendation TEXT NULL,
    ADD COLUMN IF NOT EXISTS revision_feedback TEXT NULL,
    ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS service_rating INTEGER NULL;

UPDATE complaint
SET complaint_status = 'resolved'
WHERE LOWER(COALESCE(complaint_status::text, '')) = 'approved';

ALTER TABLE complaint_media
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(100);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'emergencies' AND column_name = 'location'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'emergencies' AND column_name = 'address'
    ) THEN
        EXECUTE 'ALTER TABLE emergencies RENAME COLUMN location TO address';
    END IF;
END $$;

ALTER TABLE emergencies
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT NULL;

UPDATE audit_logs
SET new_status = REPLACE(new_status, 'Approved', 'Resolved')
WHERE new_status ILIKE '%Approved%';

UPDATE audit_logs
SET old_status = REPLACE(old_status, 'Approved', 'Resolved')
WHERE old_status ILIKE '%Approved%';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_ci ON users ((LOWER(email)));

COMMIT;
