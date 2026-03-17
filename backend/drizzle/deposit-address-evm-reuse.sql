-- Allow the same deposit address across multiple networks for the SAME user
-- (e.g. one EVM address for Ethereum/Base/Arbitrum/BSC).
-- We still enforce uniqueness across different users at application level.

DROP INDEX IF EXISTS deposit_address_unique;
CREATE INDEX IF NOT EXISTS deposit_address_lookup_idx ON deposit_addresses(address);
