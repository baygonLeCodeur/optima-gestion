-- Migration: Create wallet update trigger on deposit completion
-- This migration creates a trigger that automatically updates an agent's wallet balance
-- when a fund deposit transaction is successfully completed.

-- Step 1: Create the trigger function `update_agent_wallet_on_deposit`
CREATE OR REPLACE FUNCTION public.update_agent_wallet_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is triggered on updates to the funds_deposit table.
    -- It checks if the deposit status has just changed to 'completed'.
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        -- If so, it adds the deposit amount to the corresponding agent's wallet balance.
        UPDATE public.agent_wallets
        SET 
            balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id; -- Using the direct wallet_id foreign key for efficiency.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger that executes the function after a deposit is updated.
CREATE TRIGGER on_deposit_complete_update_wallet
AFTER UPDATE ON public.funds_deposit
FOR EACH ROW
EXECUTE FUNCTION public.update_agent_wallet_on_deposit();

COMMENT ON FUNCTION public.update_agent_wallet_on_deposit() IS 'Trigger function to automatically credit an agent''s wallet upon the successful completion of a fund deposit.';
COMMENT ON TRIGGER on_deposit_complete_update_wallet ON public.funds_deposit IS 'After a deposit record is updated, checks if the status is "completed" and updates the agent''s wallet balance accordingly.';
