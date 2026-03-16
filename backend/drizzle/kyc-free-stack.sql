-- Free-stack KYC extension (manual-review-first).
-- Run this in Supabase SQL editor if you are not using `bun run db:push`.

ALTER TABLE kyc_submissions
  ADD COLUMN IF NOT EXISTS phone_number varchar(32),
  ADD COLUMN IF NOT EXISTS emergency_contact_name varchar(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone varchar(32),
  ADD COLUMN IF NOT EXISTS document_number varchar(128),
  ADD COLUMN IF NOT EXISTS document_back_url text,
  ADD COLUMN IF NOT EXISTS proof_of_address_url text,
  ADD COLUMN IF NOT EXISTS ocr_confidence numeric(5,4),
  ADD COLUMN IF NOT EXISTS face_match_score numeric(5,4),
  ADD COLUMN IF NOT EXISTS liveness_score numeric(5,4),
  ADD COLUMN IF NOT EXISTS ocr_extracted_text text,
  ADD COLUMN IF NOT EXISTS review_notes text;
