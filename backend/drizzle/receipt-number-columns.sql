ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(32);

UPDATE deposits
SET receipt_no = 'DPT-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 16))
WHERE receipt_no IS NULL;

ALTER TABLE deposits
ALTER COLUMN receipt_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS deposit_receipt_unique ON deposits(receipt_no);

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(32);

UPDATE withdrawals
SET receipt_no = 'WDL-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 16))
WHERE receipt_no IS NULL;

ALTER TABLE withdrawals
ALTER COLUMN receipt_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS withdraw_receipt_unique ON withdrawals(receipt_no);
