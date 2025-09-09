-- Migration to create the agent_wallets table
-- This table will store the balance for each agent in a centralized way.

CREATE TABLE public.agent_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'XOF',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.agent_wallets IS 'Stores the virtual wallet and balance for each agent.';
COMMENT ON COLUMN public.agent_wallets.balance IS 'The current available balance for the agent.';
