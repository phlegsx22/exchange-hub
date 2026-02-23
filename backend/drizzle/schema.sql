-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Creates the same tables as backend/src/db/schema.ts (auth + KYC)

-- Enums
CREATE TYPE "kyc_status" AS ENUM ('none', 'pending', 'under_review', 'approved', 'rejected');
CREATE TYPE "kyc_document_type" AS ENUM ('passport', 'national_id', 'drivers_license');
CREATE TYPE "user_role" AS ENUM ('user', 'admin', 'support');

-- Users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "email_verified" boolean NOT NULL DEFAULT false,
  "email_verified_at" timestamp with time zone,
  "kyc_status" "kyc_status" NOT NULL DEFAULT 'none',
  "kyc_submitted_at" timestamp with time zone,
  "two_factor_enabled" boolean NOT NULL DEFAULT false,
  "two_factor_secret" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_login_at" timestamp with time zone
);
CREATE INDEX "users_email_idx" ON "users" ("email");
CREATE INDEX "users_kyc_status_idx" ON "users" ("kyc_status");

-- Email verification tokens
CREATE TABLE "email_verification_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(255) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- KYC submissions
CREATE TABLE "kyc_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "first_name" varchar(255) NOT NULL,
  "last_name" varchar(255) NOT NULL,
  "date_of_birth" varchar(20) NOT NULL,
  "country_of_residence" varchar(3) NOT NULL,
  "address" text NOT NULL,
  "document_type" "kyc_document_type" NOT NULL,
  "document_url" text,
  "selfie_url" text,
  "status" "kyc_status" NOT NULL DEFAULT 'pending',
  "rejection_reason" text,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid REFERENCES "users"("id"),
  "submitted_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "kyc_submissions_user_id_idx" ON "kyc_submissions" ("user_id");
CREATE INDEX "kyc_submissions_status_idx" ON "kyc_submissions" ("status");
