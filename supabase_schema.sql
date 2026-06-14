-- Add missing columns to the 'people' table
-- Run this in your Supabase SQL Editor

ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantfirstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantlastname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantstreet TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicanthousenumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantpostalcode TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS firstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS lastname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS verificationstatus TEXT;
