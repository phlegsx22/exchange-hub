-- Ensure no two users share the same deposit address.
-- Run this after checking for duplicates in existing data.
--
-- Optional pre-check:
-- SELECT address, COUNT(*) FROM deposit_addresses GROUP BY address HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS deposit_address_unique
ON deposit_addresses(address);
