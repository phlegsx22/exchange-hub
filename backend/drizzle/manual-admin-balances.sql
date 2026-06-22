-- Admin-managed balances seed.
-- Run after schema.sql and receipt-number-columns.sql.
-- Balances are credited by ledger_entries written through:
-- POST /admin/users/:id/balance-adjustments

INSERT INTO chains (slug, name, chain_id, native_symbol, is_mainnet, is_evm)
VALUES
  ('bitcoin', 'Bitcoin', NULL, 'BTC', true, false),
  ('ethereum', 'Ethereum', 1, 'ETH', true, true),
  ('solana', 'Solana', NULL, 'SOL', true, false),
  ('bsc', 'BNB Smart Chain', 56, 'BNB', true, true),
  ('base', 'Base', 8453, 'ETH', true, true),
  ('arbitrum', 'Arbitrum One', 42161, 'ETH', true, true),
  ('tron', 'Tron', NULL, 'TRX', true, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  chain_id = EXCLUDED.chain_id,
  native_symbol = EXCLUDED.native_symbol,
  is_mainnet = EXCLUDED.is_mainnet,
  is_evm = EXCLUDED.is_evm,
  is_enabled = true,
  updated_at = now();

INSERT INTO assets (symbol, name, decimals, is_native)
VALUES
  ('BTC', 'Bitcoin', 8, true),
  ('ETH', 'Ethereum', 18, true),
  ('SOL', 'Solana', 9, true),
  ('BNB', 'BNB', 18, true),
  ('USDT', 'Tether USD', 6, false),
  ('USDC', 'USD Coin', 6, false),
  ('PAXG', 'PAX Gold', 18, false)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  decimals = EXCLUDED.decimals,
  is_native = EXCLUDED.is_native,
  is_enabled = true,
  updated_at = now();

WITH rows(asset_symbol, chain_slug, contract_address) AS (
  VALUES
    ('BTC', 'bitcoin', NULL),
    ('ETH', 'ethereum', NULL),
    ('ETH', 'base', NULL),
    ('ETH', 'arbitrum', NULL),
    ('SOL', 'solana', NULL),
    ('BNB', 'bsc', NULL),
    ('USDT', 'ethereum', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
    ('USDC', 'ethereum', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    ('PAXG', 'ethereum', '0x45804880De22913dAFE09f4980848ECE6EcbAf78')
)
INSERT INTO asset_networks (asset_id, chain_id, contract_address, is_deposit_enabled, is_withdraw_enabled)
SELECT assets.id, chains.id, rows.contract_address, true, true
FROM rows
JOIN assets ON assets.symbol = rows.asset_symbol
JOIN chains ON chains.slug = rows.chain_slug
ON CONFLICT (asset_id, chain_id) DO UPDATE SET
  contract_address = COALESCE(EXCLUDED.contract_address, asset_networks.contract_address),
  is_deposit_enabled = true,
  is_withdraw_enabled = true,
  updated_at = now();
