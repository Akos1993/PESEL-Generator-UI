-- Add all missing columns to the 'people' table in Supabase
-- Using all lowercase naming convention
-- Run this script in your Supabase SQL editor

ALTER TABLE people ADD COLUMN IF NOT EXISTS verificationdetails TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS idphoto TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantapartmentnumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS secondname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS othernames TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS maidenname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birthplace TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS countryofbirth TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS countryofresidence TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS citizenshipstatus TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS fatherfirstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS fathermaidenname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS motherfirstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS mothermaidenname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS civregistryoffice TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS idseriesnumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS idvaliditydate TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS idissuingauthority TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS passportseriesnumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS passportvaliditydate TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS otherdocseriesnumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS otherdocvaliditydate TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS maritalstatus TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spousefirstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spousemaidenname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spousepesel TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS notificationmethod TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS emailaddress TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS epuapaddress TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS createdat BIGINT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS verificationstatus TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantfirstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantlastname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantstreet TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicanthousenumber TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantpostalcode TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS applicantcity TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS firstname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS lastname TEXT;
