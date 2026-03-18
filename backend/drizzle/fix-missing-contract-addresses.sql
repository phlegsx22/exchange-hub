-- Fix asset_networks rows that were created without contract addresses.
-- These values must match the SEED_ASSET_NETWORKS presets in admin.ts.

UPDATE asset_networks
SET contract_address = sub.contract_address
FROM (
  VALUES
    ('USDT', 'bsc',      '0x55d398326f99059ff775485246999027b3197955'),
    ('USDC', 'bsc',      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'),
    ('USDT', 'ethereum',  '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
    ('USDC', 'ethereum',  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    ('USDT', 'arbitrum',  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
    ('USDC', 'arbitrum',  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
    ('USDT', 'base',      '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'),
    ('USDC', 'base',      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
    ('ARB',  'arbitrum',  '0x912CE59144191C1204E64559FE8253a0e49E6548'),
    ('TRX',  'ethereum',  '0x50327c6c5a14dcade707abad2e27eb517df87ab5'),
    ('USDT', 'tron',      'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
    ('USDC', 'tron',      'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'),
    ('USDT', 'solana',    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    ('USDC', 'solana',    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
) AS sub(asset_symbol, chain_slug, contract_address)
JOIN assets a ON a.symbol = sub.asset_symbol
JOIN chains c ON c.slug = sub.chain_slug
WHERE asset_networks.asset_id = a.id
  AND asset_networks.chain_id = c.id
  AND asset_networks.contract_address IS NULL;
