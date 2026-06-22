-- Row Level Security (RLS) policies for Exchange Hub
-- Apply this in Supabase SQL editor (mainnet/prod DB).
--
-- Assumptions for JWT claims (for PostgREST/Supabase direct access):
-- - request.jwt.claims.user_id => UUID of users.id
-- - request.jwt.claims.role    => "user" | "admin" | "support"
--
-- Notes:
-- - Your backend service key may bypass RLS (expected for server-side trusted API).
-- - This script protects direct DB/API access by anon/authenticated clients.

BEGIN;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_id'
$$;

CREATE OR REPLACE FUNCTION app_private.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '')
$$;

CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app_private.current_user_role() IN ('admin', 'support')
$$;

-- ---------------------------------------------------------------------------
-- Lock down schema usage for public clients
-- ---------------------------------------------------------------------------

REVOKE ALL ON SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable + force RLS on all app tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens FORCE ROW LEVEL SECURITY;

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chains FORCE ROW LEVEL SECURITY;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.asset_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_networks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits FORCE ROW LEVEL SECURITY;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals FORCE ROW LEVEL SECURITY;

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.demo_trading_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_trading_balances FORCE ROW LEVEL SECURITY;

ALTER TABLE public.demo_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_transfers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.demo_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_trades FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Drop old policies if rerunning
-- ---------------------------------------------------------------------------

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users',
        'email_verification_tokens',
        'kyc_submissions',
        'chains',
        'assets',
        'asset_networks',
        'deposit_addresses',
        'ledger_entries',
        'deposits',
        'withdrawals',
        'wallet_accounts',
        'demo_trading_balances',
        'demo_transfers',
        'demo_trades'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_self_or_admin
ON public.users
FOR SELECT
USING (id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY users_update_self_or_admin
ON public.users
FOR UPDATE
USING (id::text = app_private.current_user_id() OR app_private.is_admin())
WITH CHECK (id::text = app_private.current_user_id() OR app_private.is_admin());

-- Admin-only user creation/deletion via DB API (optional; backend service key bypasses anyway)
CREATE POLICY users_insert_admin_only
ON public.users
FOR INSERT
WITH CHECK (app_private.is_admin());

CREATE POLICY users_delete_admin_only
ON public.users
FOR DELETE
USING (app_private.is_admin());

-- ---------------------------------------------------------------------------
-- email_verification_tokens (admin-only introspection)
-- ---------------------------------------------------------------------------

CREATE POLICY evt_admin_all
ON public.email_verification_tokens
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- ---------------------------------------------------------------------------
-- kyc_submissions
-- ---------------------------------------------------------------------------

CREATE POLICY kyc_select_self_or_admin
ON public.kyc_submissions
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY kyc_insert_self_or_admin
ON public.kyc_submissions
FOR INSERT
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY kyc_update_self_or_admin
ON public.kyc_submissions
FOR UPDATE
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin())
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY kyc_delete_admin_only
ON public.kyc_submissions
FOR DELETE
USING (app_private.is_admin());

-- ---------------------------------------------------------------------------
-- Public readable metadata tables (assets/chains/network mapping)
-- ---------------------------------------------------------------------------

CREATE POLICY chains_select_all
ON public.chains
FOR SELECT
USING (true);

CREATE POLICY assets_select_all
ON public.assets
FOR SELECT
USING (true);

CREATE POLICY asset_networks_select_all
ON public.asset_networks
FOR SELECT
USING (true);

-- Mutations admin-only
CREATE POLICY chains_admin_mutation
ON public.chains
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY assets_admin_mutation
ON public.assets
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY asset_networks_admin_mutation
ON public.asset_networks
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- ---------------------------------------------------------------------------
-- User financial tables
-- ---------------------------------------------------------------------------

CREATE POLICY deposit_addresses_select_self_or_admin
ON public.deposit_addresses
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY deposit_addresses_admin_mutation
ON public.deposit_addresses
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY ledger_entries_select_self_or_admin
ON public.ledger_entries
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY ledger_entries_admin_mutation
ON public.ledger_entries
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY deposits_select_self_or_admin
ON public.deposits
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY deposits_admin_mutation
ON public.deposits
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY withdrawals_select_self_or_admin
ON public.withdrawals
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY withdrawals_insert_self_or_admin
ON public.withdrawals
FOR INSERT
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY withdrawals_update_admin_only
ON public.withdrawals
FOR UPDATE
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY withdrawals_delete_admin_only
ON public.withdrawals
FOR DELETE
USING (app_private.is_admin());

CREATE POLICY wallet_accounts_select_self_or_admin
ON public.wallet_accounts
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY wallet_accounts_admin_mutation
ON public.wallet_accounts
FOR ALL
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- ---------------------------------------------------------------------------
-- Demo trading tables
-- ---------------------------------------------------------------------------

CREATE POLICY demo_balances_select_self_or_admin
ON public.demo_trading_balances
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_balances_insert_self_or_admin
ON public.demo_trading_balances
FOR INSERT
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_balances_update_self_or_admin
ON public.demo_trading_balances
FOR UPDATE
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin())
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_balances_delete_admin_only
ON public.demo_trading_balances
FOR DELETE
USING (app_private.is_admin());

CREATE POLICY demo_transfers_select_self_or_admin
ON public.demo_transfers
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_transfers_insert_self_or_admin
ON public.demo_transfers
FOR INSERT
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_transfers_admin_mutation
ON public.demo_transfers
FOR UPDATE
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY demo_transfers_admin_delete
ON public.demo_transfers
FOR DELETE
USING (app_private.is_admin());

CREATE POLICY demo_trades_select_self_or_admin
ON public.demo_trades
FOR SELECT
USING (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_trades_insert_self_or_admin
ON public.demo_trades
FOR INSERT
WITH CHECK (user_id::text = app_private.current_user_id() OR app_private.is_admin());

CREATE POLICY demo_trades_admin_mutation
ON public.demo_trades
FOR UPDATE
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY demo_trades_admin_delete
ON public.demo_trades
FOR DELETE
USING (app_private.is_admin());

COMMIT;
