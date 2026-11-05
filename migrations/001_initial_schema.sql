-- ============================================================================
-- N7 Aesthetics — Reference SQL Migration & Row-Level Security (001_initial_schema.sql)
-- Provides relational DDL and RLS policies mirroring our live CMS schema.
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_roles (
  uid VARCHAR(128) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(254),
  treatment VARCHAR(120) NOT NULL,
  preferred_date DATE NOT NULL,
  message VARCHAR(500),
  privacy_consent BOOLEAN NOT NULL CHECK (privacy_consent = TRUE),
  status VARCHAR(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'archived')),
  assigned_to VARCHAR(120) NOT NULL DEFAULT 'unassigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatments (
  slug VARCHAR(100) PRIMARY KEY,
  title VARCHAR(140) NOT NULL,
  short_title VARCHAR(80) NOT NULL,
  category VARCHAR(80) NOT NULL,
  summary VARCHAR(600) NOT NULL,
  overview VARCHAR(2500) NOT NULL,
  card_image VARCHAR(1000) NOT NULL,
  approval_status VARCHAR(40) NOT NULL DEFAULT 'draft_pending_clinic_approval'
    CHECK (approval_status IN ('draft_pending_clinic_approval', 'approved_by_clinic')),
  is_signature BOOLEAN NOT NULL DEFAULT TRUE,
  author_uid VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_identifier VARCHAR(100) NOT NULL,
  procedure_context VARCHAR(120) NOT NULL,
  quote VARCHAR(1200) NOT NULL,
  consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  author_uid VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_testimonial_consent CHECK (NOT published OR consent_verified = TRUE)
);

CREATE TABLE IF NOT EXISTS clinical_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_slug VARCHAR(100) NOT NULL,
  treatment_title VARCHAR(140) NOT NULL,
  before_image VARCHAR(1000) NOT NULL,
  after_image VARCHAR(1000) NOT NULL,
  clinical_notes VARCHAR(1000) NOT NULL,
  consent_reference VARCHAR(160) NOT NULL,
  consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  author_uid VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_result_consent CHECK (NOT published OR consent_verified = TRUE)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  slug VARCHAR(120) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  excerpt VARCHAR(600) NOT NULL,
  reading_time VARCHAR(40) NOT NULL,
  seo_title VARCHAR(120) NOT NULL,
  seo_description VARCHAR(240) NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  author_uid VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_id VARCHAR(40) PRIMARY KEY DEFAULT 'main',
  doctor_name VARCHAR(120) NOT NULL DEFAULT 'Dr. Navjot Singh',
  doctor_role VARCHAR(160) NOT NULL DEFAULT 'Plastic & Cosmetic Surgery (Pending Clinic Confirmation)',
  doctor_short_intro VARCHAR(800) NOT NULL,
  doctor_portrait_url VARCHAR(1000) NOT NULL,
  credentials_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone VARCHAR(60) NOT NULL,
  whatsapp_number VARCHAR(40) NOT NULL,
  is_phone_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(160) NOT NULL,
  address VARCHAR(300) NOT NULL,
  hours VARCHAR(160) NOT NULL,
  booking_live_mode BOOLEAN NOT NULL DEFAULT FALSE,
  author_uid VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
