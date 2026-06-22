-- Adds optional promotion code captured during user registration.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "promotion_code" varchar(64);
