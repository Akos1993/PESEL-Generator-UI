-- Add all missing columns to the 'people' table in Supabase
-- Using snake_case naming convention for all columns
-- Run this script in your Supabase SQL editor

ALTER TABLE people ADD COLUMN IF NOT EXISTS verification_details TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS id_photo TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicant_apartment_number TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS second_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS other_names TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS maiden_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS country_of_birth TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS country_of_residence TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS citizenship_status TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS father_first_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS father_maiden_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS mother_first_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS mother_maiden_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS civ_registry_office TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS id_series_number TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS id_validity_date TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS id_issuing_authority TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS passport_series_number TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS passport_validity_date TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS other_doc_series_number TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS other_doc_validity_date TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spouse_first_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spouse_maiden_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spouse_pesel TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS notification_method TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS email_address TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS epuap_address TEXT;
