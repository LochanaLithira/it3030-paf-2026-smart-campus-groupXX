-- ================================================================
--  SMART CAMPUS RESOURCE MANAGEMENT PLATFORM
--  Flyway V2 — Seed Roles & Admin User
--  Date: 2026-03-08
-- ================================================================

-- ======================== ADMIN ROLE (all permissions) ========================

INSERT INTO roles (role_id, role_name, permissions)
VALUES (
    gen_random_uuid(),
    'ADMIN',
    ARRAY[
        -- User Management
        'users.read', 'users.create', 'users.update', 'users.delete_soft', 'users.delete',
        -- Student Group Management
        'students.read', 'students.create', 'students.update', 'students.manage_enrollment',
        'students.read_inactive', 'students.activate', 'students.delete_soft', 'students.delete',
        -- Course Management
        'courses.read', 'courses.create', 'courses.read_inactive', 'courses.update',
        'courses.delete_soft', 'courses.delete', 'courses.manage_content',
        -- Chapter Management
        'chapters.read', 'chapters.create', 'chapters.update', 'chapters.delete',
        -- Week Management
        'weeks.read', 'weeks.create', 'weeks.update', 'weeks.delete',
        -- Content Management
        'content.read', 'content.create', 'content.delete', 'content.download', 'content.view',
        -- Trial-exams Management
        'trial_exams.read', 'trial_exams.create', 'trial_exams.update', 'trial_exams.delete',
        'trial_exams.delete_soft', 'trial_exams.read_inactive',
        -- Payment & Billing
        'payments.process', 'invoices.read', 'invoices.create', 'invoices.update', 'invoices.delete',
        -- Feedback Management
        'feedback.read', 'feedback.create', 'feedback.update', 'feedback.delete',
        -- Results Management
        'results.read', 'results.create', 'results.update',
        -- Role Management
        'roles.read', 'roles.create', 'roles.update', 'roles.delete', 'users.manage_roles',
        -- Settings & Configuration
        'settings.view', 'admin.update', 'admin.create', 'admin.delete',
        -- Dashboard & Overview
        'dashboard.view_admin', 'dashboard.view_student', 'dashboard.view_parent'
    ]
)
ON CONFLICT (role_name) DO UPDATE
    SET permissions = EXCLUDED.permissions;

-- ======================== USER ROLE (basic permissions) ========================

INSERT INTO roles (role_id, role_name, permissions)
VALUES (
    gen_random_uuid(),
    'USER',
    ARRAY[
        'dashboard.view_student',
        'courses.read',
        'content.read', 'content.view', 'content.download',
        'chapters.read',
        'weeks.read',
        'results.read',
        'feedback.read', 'feedback.create',
        'trial_exams.read'
    ]
)
ON CONFLICT (role_name) DO UPDATE
    SET permissions = EXCLUDED.permissions;

-- ======================== TECHNICIAN ROLE ========================

INSERT INTO roles (role_id, role_name, permissions)
VALUES (
    gen_random_uuid(),
    'TECHNICIAN',
    ARRAY[
        'dashboard.view_admin',
        'users.read',
        'courses.read',
        'content.read', 'content.view',
        'chapters.read',
        'weeks.read',
        'results.read', 'results.create', 'results.update',
        'feedback.read'
    ]
)
ON CONFLICT (role_name) DO UPDATE
    SET permissions = EXCLUDED.permissions;

-- ======================== SEED ADMIN USER ========================
-- Password: Admin@123 (bcrypt cost 12 via pgcrypto)

DO $$
DECLARE
    v_user_id UUID;
    v_admin_role_id UUID;
BEGIN
    -- Get admin role id
    SELECT role_id INTO v_admin_role_id FROM roles WHERE role_name = 'ADMIN';

    -- Insert admin user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@smartcampus.com') THEN
        v_user_id := gen_random_uuid();

        INSERT INTO users (user_id, email, full_name, password_hash, is_active)
        VALUES (
            v_user_id,
            'admin@smartcampus.com',
            'System Admin',
            crypt('Admin@123', gen_salt('bf', 12)),
            true
        );

        -- Assign ADMIN role
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES (v_user_id, v_admin_role_id, NOW());

        RAISE NOTICE 'Admin user seeded: admin@smartcampus.com / Admin@123';
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping seed.';
    END IF;
END;
$$;
