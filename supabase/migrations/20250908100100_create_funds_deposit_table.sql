-- Migration to create the funds_deposit table
-- This table logs all fund deposit transactions made by agents.

CREATE TABLE public.funds_deposit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.agent_wallets(id) ON DELETE CASCADE,
    
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'XOF',
    
    -- CinetPay Payment Gateway Details
    payment_method TEXT NOT NULL,
    cinetpay_transaction_id TEXT UNIQUE,
    cinetpay_payment_token TEXT,
    
    -- Transaction Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    
    -- Timestamps
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.funds_deposit IS 'Logs all fund deposit transactions from agents into their wallets.';
COMMENT ON COLUMN public.funds_deposit.amount IS 'The amount of money deposited in the transaction.';
COMMENT ON COLUMN public.funds_deposit.status IS 'The current status of the deposit transaction.';
