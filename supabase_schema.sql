-- Add all missing columns to the 'people' table in Supabase
-- Using camelCase naming convention (PostgreSQL quoted identifiers)
-- Run this script in your Supabase SQL editor if columns don't exist

ALTER TABLE people ADD COLUMN IF NOT EXISTS "verificationDetails" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "idPhoto" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "applicantApartmentNumber" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "secondName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "otherNames" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "maidenName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "birthPlace" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "countryOfBirth" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "countryOfResidence" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "citizenshipStatus" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "fatherFirstName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "fatherMaidenName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "motherFirstName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "motherMaidenName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "civRegistryOffice" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "idSeriesNumber" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "idValidityDate" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "idIssuingAuthority" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "passportSeriesNumber" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "passportValidityDate" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "otherDocSeriesNumber" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "otherDocValidityDate" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "maritalStatus" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "spouseFirstName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "spouseMaidenName" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "spousePesel" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "notificationMethod" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "emailAddress" TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS "epuapAddress" TEXT;
