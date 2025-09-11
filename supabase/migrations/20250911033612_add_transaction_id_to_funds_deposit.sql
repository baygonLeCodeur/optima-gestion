ALTER TABLE funds_deposit 
ADD COLUMN transaction_id VARCHAR(100) UNIQUE;

CREATE INDEX idx_funds_deposit_transaction_id ON funds_deposit(transaction_id);