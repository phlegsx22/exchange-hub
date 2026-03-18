-- Demo trading internal tables (paper engine)

DO $$ BEGIN
  CREATE TYPE demo_transfer_direction AS ENUM ('funding_to_trading', 'trading_to_funding');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE demo_trade_side AS ENUM ('buy', 'sell');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS demo_trading_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_symbol varchar(20) NOT NULL,
  balance numeric(36,18) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS demo_trading_balance_user_symbol_unique
  ON demo_trading_balances (user_id, asset_symbol);

CREATE TABLE IF NOT EXISTS demo_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_symbol varchar(20) NOT NULL,
  amount numeric(36,18) NOT NULL,
  direction demo_transfer_direction NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_transfers_user_created_idx
  ON demo_transfers (user_id, created_at);

CREATE TABLE IF NOT EXISTS demo_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_symbol varchar(20) NOT NULL,
  quote_symbol varchar(20) NOT NULL,
  side demo_trade_side NOT NULL,
  base_amount numeric(36,18) NOT NULL,
  quote_amount numeric(36,18) NOT NULL,
  price_usd numeric(36,18) NOT NULL,
  quote_price_usd numeric(36,18) NOT NULL,
  notional_usd numeric(36,18) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_trades_user_created_idx
  ON demo_trades (user_id, created_at);
