-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Creates tables used by backend/src/db/schema.ts (auth + KYC + wallets)

-- Enums
CREATE TYPE "kyc_status" AS ENUM ('none', 'pending', 'under_review', 'approved', 'rejected');
CREATE TYPE "kyc_document_type" AS ENUM ('passport', 'national_id', 'drivers_license');
CREATE TYPE "user_role" AS ENUM ('user', 'admin', 'support');
CREATE TYPE "account_status" AS ENUM ('active', 'suspended', 'pending', 'blacklisted');

CREATE TYPE "ledger_entry_type" AS ENUM ('deposit', 'withdrawal', 'trade', 'transfer', 'fee', 'adjustment');
CREATE TYPE "deposit_status" AS ENUM ('pending', 'confirming', 'completed', 'failed');
CREATE TYPE "withdrawal_status" AS ENUM ('pending', 'processing', 'broadcast', 'completed', 'failed', 'cancelled');
CREATE TYPE "wallet_status" AS ENUM ('active', 'frozen', 'pending');

-- Users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "promotion_code" varchar(64),
  "role" "user_role" NOT NULL DEFAULT 'user',
  "account_status" "account_status" NOT NULL DEFAULT 'active',
  "email_verified" boolean NOT NULL DEFAULT false,
  "email_verified_at" timestamp with time zone,
  "kyc_status" "kyc_status" NOT NULL DEFAULT 'none',
  "kyc_submitted_at" timestamp with time zone,
  "two_factor_enabled" boolean NOT NULL DEFAULT false,
  "two_factor_secret" varchar(255),
  "can_trade" boolean NOT NULL DEFAULT true,
  "can_withdraw" boolean NOT NULL DEFAULT true,
  "can_transfer" boolean NOT NULL DEFAULT true,
  "can_margin" boolean NOT NULL DEFAULT false,
  "can_futures" boolean NOT NULL DEFAULT false,
  "can_staking" boolean NOT NULL DEFAULT true,
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

-- Wallets / networks
CREATE TABLE "chains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(32) NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "chain_id" integer,
  "native_symbol" varchar(16) NOT NULL,
  "is_mainnet" boolean NOT NULL DEFAULT true,
  "is_evm" boolean NOT NULL DEFAULT false,
  "is_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "chains_slug_idx" ON "chains" ("slug");

CREATE TABLE "assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "symbol" varchar(20) NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "decimals" smallint NOT NULL,
  "is_native" boolean NOT NULL DEFAULT false,
  "icon_url" text,
  "is_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "assets_symbol_idx" ON "assets" ("symbol");

CREATE TABLE "asset_networks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "asset_id" uuid NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "chain_id" uuid NOT NULL REFERENCES "chains"("id") ON DELETE CASCADE,
  "contract_address" varchar(66),
  "is_deposit_enabled" boolean NOT NULL DEFAULT true,
  "is_withdraw_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "asset_network_unique" ON "asset_networks" ("asset_id", "chain_id");
CREATE INDEX "asset_network_asset_idx" ON "asset_networks" ("asset_id");
CREATE INDEX "asset_network_chain_idx" ON "asset_networks" ("chain_id");

CREATE TABLE "deposit_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset_network_id" uuid NOT NULL REFERENCES "asset_networks"("id") ON DELETE CASCADE,
  "address" varchar(128) NOT NULL,
  "memo" varchar(64),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "deposit_address_user_asset_network_unique" ON "deposit_addresses" ("user_id", "asset_network_id");
CREATE INDEX "deposit_address_user_idx" ON "deposit_addresses" ("user_id");

CREATE TABLE "ledger_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset_network_id" uuid NOT NULL REFERENCES "asset_networks"("id") ON DELETE CASCADE,
  "amount" numeric(36,18) NOT NULL,
  "balance_after" numeric(36,18) NOT NULL,
  "type" "ledger_entry_type" NOT NULL,
  "ref_type" varchar(32),
  "ref_id" uuid,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "ledger_user_asset_created_idx" ON "ledger_entries" ("user_id", "asset_network_id", "created_at");

CREATE TABLE "deposits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset_network_id" uuid NOT NULL REFERENCES "asset_networks"("id") ON DELETE CASCADE,
  "amount" numeric(36,18) NOT NULL,
  "tx_hash" varchar(128) NOT NULL,
  "from_address" varchar(128),
  "confirmations" smallint NOT NULL DEFAULT 0,
  "status" "deposit_status" NOT NULL DEFAULT 'pending',
  "external_id" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "deposit_external_unique" ON "deposits" ("asset_network_id", "external_id");
CREATE UNIQUE INDEX "deposit_tx_unique" ON "deposits" ("asset_network_id", "tx_hash");
CREATE INDEX "deposit_user_idx" ON "deposits" ("user_id");

CREATE TABLE "withdrawals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset_network_id" uuid NOT NULL REFERENCES "asset_networks"("id") ON DELETE CASCADE,
  "amount" numeric(36,18) NOT NULL,
  "fee" numeric(36,18) NOT NULL DEFAULT 0,
  "to_address" varchar(128) NOT NULL,
  "tx_hash" varchar(128),
  "status" "withdrawal_status" NOT NULL DEFAULT 'pending',
  "idempotency_key" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "withdraw_idempotency_unique" ON "withdrawals" ("user_id", "idempotency_key");
CREATE INDEX "withdraw_user_idx" ON "withdrawals" ("user_id");

CREATE TABLE "wallet_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset_network_id" uuid NOT NULL REFERENCES "asset_networks"("id") ON DELETE CASCADE,
  "status" "wallet_status" NOT NULL DEFAULT 'pending',
  "frozen" numeric(36,18) NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "wallet_account_user_asset_network_unique" ON "wallet_accounts" ("user_id", "asset_network_id");
CREATE INDEX "wallet_account_user_idx" ON "wallet_accounts" ("user_id");
