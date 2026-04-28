DO $$
BEGIN
    IF to_regclass('public.complaint') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_complaint_user_id'
       ) THEN
        ALTER TABLE public.complaint
        ADD CONSTRAINT fk_complaint_user_id
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE
        NOT VALID;
        ALTER TABLE public.complaint
        VALIDATE CONSTRAINT fk_complaint_user_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_audit_logs_user_id'
       ) THEN
        ALTER TABLE public.audit_logs
        ADD CONSTRAINT fk_audit_logs_user_id
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE SET NULL
        NOT VALID;
        ALTER TABLE public.audit_logs
        VALIDATE CONSTRAINT fk_audit_logs_user_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_audit_logs_complaint_id'
       ) THEN
        ALTER TABLE public.audit_logs
        ADD CONSTRAINT fk_audit_logs_complaint_id
        FOREIGN KEY (complaint_id)
        REFERENCES public.complaint(complaint_id)
        ON DELETE SET NULL
        NOT VALID;
        ALTER TABLE public.audit_logs
        VALIDATE CONSTRAINT fk_audit_logs_complaint_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_audit_logs_emergency_id'
       ) THEN
        ALTER TABLE public.audit_logs
        ADD CONSTRAINT fk_audit_logs_emergency_id
        FOREIGN KEY (emergency_id)
        REFERENCES public.emergencies(emergency_id)
        ON DELETE SET NULL
        NOT VALID;
        ALTER TABLE public.audit_logs
        VALIDATE CONSTRAINT fk_audit_logs_emergency_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.announcements') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_announcements_user_id'
       ) THEN
        ALTER TABLE public.announcements
        ADD CONSTRAINT fk_announcements_user_id
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE SET NULL
        NOT VALID;
        ALTER TABLE public.announcements
        VALIDATE CONSTRAINT fk_announcements_user_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.emergencies') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_emergencies_user_id'
       ) THEN
        ALTER TABLE public.emergencies
        ADD CONSTRAINT fk_emergencies_user_id
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE SET NULL
        NOT VALID;
        ALTER TABLE public.emergencies
        VALIDATE CONSTRAINT fk_emergencies_user_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.complaint_media') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_complaint_media_complaint_id'
       ) THEN
        ALTER TABLE public.complaint_media
        ADD CONSTRAINT fk_complaint_media_complaint_id
        FOREIGN KEY (complaint_id)
        REFERENCES public.complaint(complaint_id)
        ON DELETE CASCADE
        NOT VALID;
        ALTER TABLE public.complaint_media
        VALIDATE CONSTRAINT fk_complaint_media_complaint_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.superadmin_audit_logs') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_superadmin_audit_logs_admin_id'
       ) THEN
        ALTER TABLE public.superadmin_audit_logs
        ADD CONSTRAINT fk_superadmin_audit_logs_admin_id
        FOREIGN KEY (admin_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE
        NOT VALID;
        ALTER TABLE public.superadmin_audit_logs
        VALIDATE CONSTRAINT fk_superadmin_audit_logs_admin_id;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.superadmin_audit_logs') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_superadmin_audit_logs_target_user_id'
       ) THEN
        ALTER TABLE public.superadmin_audit_logs
        ADD CONSTRAINT fk_superadmin_audit_logs_target_user_id
        FOREIGN KEY (target_user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE
        NOT VALID;
        ALTER TABLE public.superadmin_audit_logs
        VALIDATE CONSTRAINT fk_superadmin_audit_logs_target_user_id;
    END IF;
END $$;
