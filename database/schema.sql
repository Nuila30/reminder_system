-- =========================================================
-- REMINDER SYSTEM
-- Base de datos inicial
-- PostgreSQL / Neon
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USUARIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE'
        CHECK (
            role IN (
                'ADMIN',
                'SUPERVISOR',
                'EMPLOYEE',
                'READ_ONLY'
            )
        ),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CLIENTES
-- =========================================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED'
            )
        ),

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CASOS / EXPEDIENTES
-- =========================================================

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID NOT NULL
        REFERENCES clients(id)
        ON DELETE CASCADE,

    case_number VARCHAR(100) NOT NULL,

    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED'
            )
        ),

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(client_id, case_number)
);

-- =========================================================
-- TIPOS DE DOCUMENTOS
-- =========================================================

CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL UNIQUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- DOCUMENTOS
-- =========================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID
        REFERENCES cases(id)
        ON DELETE SET NULL,

    document_type_id UUID
        REFERENCES document_types(id)
        ON DELETE SET NULL,

    assigned_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    file_name VARCHAR(255) NOT NULL,

    due_date TIMESTAMPTZ NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'LOW'
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'IN_PROGRESS',
                'COMPLETED',
                'EXPIRED',
                'CANCELLED'
            )
        ),

    notes TEXT,

    completed_at TIMESTAMPTZ,

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- RECORDATORIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    reminder_at TIMESTAMPTZ NOT NULL,

    notification_type VARCHAR(20) NOT NULL
        CHECK (
            notification_type IN (
                'EMAIL',
                'WHATSAPP',
                'BOTH'
            )
        ),

    email_to VARCHAR(255),
    whatsapp_to VARCHAR(30),

    recurrence_type VARCHAR(30) NOT NULL DEFAULT 'NONE'
        CHECK (
            recurrence_type IN (
                'NONE',
                'DAILY',
                'WEEKLY',
                'CUSTOM'
            )
        ),

    recurrence_interval INTEGER,

    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (
            status IN (
                'SCHEDULED',
                'PROCESSING',
                'SENT',
                'FAILED',
                'CANCELLED'
            )
        ),

    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    error_message TEXT,

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INTENTOS DE NOTIFICACIÓN
-- =========================================================

CREATE TABLE IF NOT EXISTS notification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reminder_id UUID NOT NULL
        REFERENCES reminders(id)
        ON DELETE CASCADE,

    channel VARCHAR(20) NOT NULL
        CHECK (
            channel IN (
                'EMAIL',
                'WHATSAPP'
            )
        ),

    attempt_number INTEGER NOT NULL DEFAULT 1,

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'SUCCESS',
                'FAILED'
            )
        ),

    provider_response TEXT,
    error_message TEXT,

    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- HISTORIAL DE ESTADOS
-- =========================================================

CREATE TABLE IF NOT EXISTS document_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    new_status VARCHAR(30) NOT NULL,

    changed_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- AUDITORÍA
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    action VARCHAR(100) NOT NULL,

    new_value JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- BACKUPS
-- =========================================================

CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    backup_type VARCHAR(50) NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'RUNNING',
                'SUCCESS',
                'FAILED'
            )
        ),

    file_name VARCHAR(255),
    location TEXT,
    error_message TEXT,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =========================================================
-- LOGS DEL SISTEMA
-- =========================================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    level VARCHAR(20) NOT NULL
        CHECK (
            level IN (
                'INFO',
                'WARNING',
                'ERROR'
            )
        ),

    source VARCHAR(100),

    message TEXT NOT NULL,

    details JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_clients_status
ON clients(status);

CREATE INDEX IF NOT EXISTS idx_cases_client_id
ON cases(client_id);

CREATE INDEX IF NOT EXISTS idx_documents_case_id
ON documents(case_id);

CREATE INDEX IF NOT EXISTS idx_documents_assigned_user
ON documents(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_documents_due_date
ON documents(due_date);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON documents(status);

CREATE INDEX IF NOT EXISTS idx_documents_priority
ON documents(priority);

CREATE INDEX IF NOT EXISTS idx_reminders_document
ON reminders(document_id);

CREATE INDEX IF NOT EXISTS idx_reminders_date
ON reminders(reminder_at);

CREATE INDEX IF NOT EXISTS idx_reminders_status
ON reminders(status);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_reminder
ON notification_attempts(reminder_id);

-- =========================================================
-- TIPOS DE DOCUMENTOS INICIALES
-- =========================================================

INSERT INTO document_types (name)
VALUES
    ('Written Pleadings'),
    ('I-589'),
    ('EOIR-42B'),
    ('Supplemental Evidence'),
    ('PSG Brief / Statement'),
    ('OYD Brief'),
    ('Witness List'),
    ('Motion to Withdraw'),
    ('Filing Fees'),
    ('Prima Facie Evidence'),
    ('Criminal Records')
ON CONFLICT (name) DO NOTHING;