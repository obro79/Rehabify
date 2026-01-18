-- =============================================================================
-- Patient Medical Information Migration
-- Version: 004
-- Description: Adds patient medical information table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Patient Medical Information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Demographics
  date_of_birth DATE,
  gender TEXT,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Medical Information
  primary_condition TEXT,
  condition_type TEXT,
  diagnosis_date DATE,
  primary_physician TEXT,
  physician_phone TEXT,

  -- Medical History
  past_medical_history JSONB DEFAULT '[]'::JSONB,
  surgeries JSONB DEFAULT '[]'::JSONB,
  allergies JSONB DEFAULT '[]'::JSONB,
  medications JSONB DEFAULT '[]'::JSONB,

  -- Insurance & Emergency Contact
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Additional Notes
  additional_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_info_patient_id ON patient_medical_info(patient_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_patient_medical_info_updated_at ON patient_medical_info;
CREATE TRIGGER update_patient_medical_info_updated_at
  BEFORE UPDATE ON patient_medical_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

