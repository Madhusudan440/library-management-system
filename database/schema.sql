-- ==============================================================================
-- CloudLib Pro - Advanced Cloud-Based Library Management System
-- Database Schema: PostgreSQL (Supabase Compatible)
-- Authors: B.Tech CSE Cloud Computing Project Team
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing schema if necessary (safe rerun)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS reservations CASCADE;
-- DROP TABLE IF EXISTS loans CASCADE;
-- DROP TABLE IF EXISTS book_copies CASCADE;
-- DROP TABLE IF EXISTS books CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS library_settings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase Auth auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'librarian', 'student')),
    student_id TEXT UNIQUE,
    department TEXT DEFAULT 'Computer Science & Engineering',
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching and filtering users
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'BookOpen',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. BOOKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    publication_year INTEGER,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_name TEXT,
    description TEXT,
    cover_url TEXT,
    edition TEXT DEFAULT '1st Edition',
    pages INTEGER,
    shelf_location TEXT DEFAULT 'Section A-1',
    total_copies INTEGER DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INTEGER DEFAULT 1 CHECK (available_copies >= 0),
    issued_copies INTEGER DEFAULT 0 CHECK (issued_copies >= 0),
    reserved_copies INTEGER DEFAULT 0 CHECK (reserved_copies >= 0),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance book search and catalogue filtering
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_available ON books(available_copies);
CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. BOOK COPIES TABLE (Inventory Barcode Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL,
    copy_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'reserved', 'maintenance', 'lost')),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'damaged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_barcode ON book_copies(barcode);
CREATE INDEX IF NOT EXISTS idx_book_copies_status ON book_copies(status);

-- ------------------------------------------------------------------------------
-- 5. LIBRARY SETTINGS TABLE (Configurable Policies)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_borrow_limit INTEGER DEFAULT 4,
    loan_duration_days INTEGER DEFAULT 14,
    max_renewal_count INTEGER DEFAULT 2,
    late_fee_per_day NUMERIC(10,2) DEFAULT 2.00,
    reservation_pickup_days INTEGER DEFAULT 3,
    enable_late_fees BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. LOANS TABLE (Issue, Due, Return, Renewals, Fines)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_code TEXT UNIQUE NOT NULL,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    copy_id UUID REFERENCES book_copies(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    issued_by UUID REFERENCES profiles(id),
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    renewal_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    fine_amount NUMERIC(10,2) DEFAULT 0.00,
    fine_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

-- ------------------------------------------------------------------------------
-- 7. RESERVATIONS TABLE (Queued Book Holds)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code TEXT UNIQUE NOT NULL,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready_for_pickup', 'fulfilled', 'cancelled', 'expired')),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ready_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate active reservations for the same book by the same student
    CONSTRAINT unique_active_user_book_reservation UNIQUE (book_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- ------------------------------------------------------------------------------
-- 8. NOTIFICATIONS TABLE (In-App Alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'due_date', 'overdue', 'reservation')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ------------------------------------------------------------------------------
-- 9. AUDIT LOGS TABLE (Compliance & Activity Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. DATABASE TRIGGERS & STORED PROCEDURES
-- ------------------------------------------------------------------------------

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_books_updated_at ON books;
CREATE TRIGGER trigger_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_book_copies_updated_at ON book_copies;
CREATE TRIGGER trigger_book_copies_updated_at BEFORE UPDATE ON book_copies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_loans_updated_at ON loans;
CREATE TRIGGER trigger_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
CREATE TRIGGER trigger_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Supabase Auth new user profile sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, student_id, department)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Library User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'student_id',
        COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering')
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic Issue Book Procedure
CREATE OR REPLACE FUNCTION issue_book(
    p_book_id UUID,
    p_copy_id UUID,
    p_user_id UUID,
    p_issued_by UUID,
    p_loan_code TEXT,
    p_due_date TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    v_loan_id UUID;
    v_available_copies INTEGER;
BEGIN
    -- Check copy availability
    SELECT available_copies INTO v_available_copies FROM books WHERE id = p_book_id FOR UPDATE;
    IF v_available_copies <= 0 THEN
        RAISE EXCEPTION 'No copies available to issue for this book.';
    END IF;

    -- Update book copy status if specified
    IF p_copy_id IS NOT NULL THEN
        UPDATE book_copies SET status = 'issued' WHERE id = p_copy_id;
    END IF;

    -- Update book counters
    UPDATE books
    SET available_copies = available_copies - 1,
        issued_copies = issued_copies + 1
    WHERE id = p_book_id;

    -- Insert loan record
    INSERT INTO loans (loan_code, book_id, copy_id, user_id, issued_by, due_date, status)
    VALUES (p_loan_code, p_book_id, p_copy_id, p_user_id, p_issued_by, p_due_date, 'active')
    RETURNING id INTO v_loan_id;

    RETURN v_loan_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic Return Book Procedure
CREATE OR REPLACE FUNCTION return_book(
    p_loan_id UUID,
    p_fine_amount NUMERIC(10,2) DEFAULT 0.00
)
RETURNS VOID AS $$
DECLARE
    v_book_id UUID;
    v_copy_id UUID;
    v_next_reservation_id UUID;
    v_reserved_user_id UUID;
BEGIN
    -- Get loan details
    SELECT book_id, copy_id INTO v_book_id, v_copy_id FROM loans WHERE id = p_loan_id;

    -- Mark loan returned
    UPDATE loans
    SET return_date = NOW(),
        status = 'returned',
        fine_amount = p_fine_amount
    WHERE id = p_loan_id;

    -- Check if there is an active reservation waiting for this book
    SELECT id, user_id INTO v_next_reservation_id, v_reserved_user_id
    FROM reservations
    WHERE book_id = v_book_id AND status = 'pending'
    ORDER BY queue_position ASC, reserved_at ASC
    LIMIT 1;

    IF v_next_reservation_id IS NOT NULL THEN
        -- Mark reservation ready for pickup
        UPDATE reservations
        SET status = 'ready_for_pickup',
            ready_at = NOW(),
            expires_at = NOW() + INTERVAL '3 days'
        WHERE id = v_next_reservation_id;

        -- Reserve the copy
        IF v_copy_id IS NOT NULL THEN
            UPDATE book_copies SET status = 'reserved' WHERE id = v_copy_id;
        END IF;

        UPDATE books
        SET issued_copies = issued_copies - 1,
            reserved_copies = reserved_copies + 1
        WHERE id = v_book_id;

        -- Send notification to student
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            v_reserved_user_id,
            'Reserved Book Ready for Pickup!',
            'Your reserved book is now available at the library counter. Please pick it up within 3 days.',
            'reservation',
            '/student/reservations'
        );
    ELSE
        -- Return to general inventory
        IF v_copy_id IS NOT NULL THEN
            UPDATE book_copies SET status = 'available' WHERE id = v_copy_id;
        END IF;

        UPDATE books
        SET issued_copies = issued_copies - 1,
            available_copies = available_copies + 1
        WHERE id = v_book_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is admin/librarian
CREATE OR REPLACE FUNCTION is_admin_or_librarian()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Anyone can view their own profile; admins can view all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_admin_or_librarian());
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id OR is_admin_or_librarian());

-- Categories: Read public, Write admin/librarian
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL USING (is_admin_or_librarian());

-- Books: Read public, Write admin/librarian
CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Admin write books" ON books FOR ALL USING (is_admin_or_librarian());

-- Book Copies: Read public, Write admin/librarian
CREATE POLICY "Public read copies" ON book_copies FOR SELECT USING (true);
CREATE POLICY "Admin write copies" ON book_copies FOR ALL USING (is_admin_or_librarian());

-- Loans: Students can view their own loans; Admins can view/manage all
CREATE POLICY "View loans" ON loans
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_librarian());
CREATE POLICY "Admin manage loans" ON loans
    FOR ALL USING (is_admin_or_librarian());

-- Reservations: Students view & create own; Admins manage all
CREATE POLICY "View reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_librarian());
CREATE POLICY "Student insert reservation" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Student cancel own reservation" ON reservations
    FOR UPDATE USING (auth.uid() = user_id OR is_admin_or_librarian());

-- Notifications: Users view/update own notifications
CREATE POLICY "User notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id OR is_admin_or_librarian());

-- Audit logs: Admin only
CREATE POLICY "Admin audit logs" ON audit_logs
    FOR ALL USING (is_admin_or_librarian());

-- Library Settings: Read public, Write admin
CREATE POLICY "Public read settings" ON library_settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON library_settings FOR ALL USING (is_admin_or_librarian());
