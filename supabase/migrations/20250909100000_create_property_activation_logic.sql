-- Migration: Create property activation logic
-- This migration creates a trigger function that automatically handles the activation
-- of a new property upon its creation.

-- Step 1: Create the trigger function `handle_new_property_activation`
CREATE OR REPLACE FUNCTION public.handle_new_property_activation()
RETURNS TRIGGER AS $$
DECLARE
    -- The activation cost is hardcoded here.
    -- For more flexibility, this could be stored in a configuration table in the future.
    activation_cost NUMERIC := 5000; -- Corresponds to NEXT_PUBLIC_PROPERTY_ACTIVATION_COST
    agent_wallet RECORD;
BEGIN
    -- Find the agent's wallet using the agent_id from the newly inserted property.
    SELECT * INTO agent_wallet FROM public.agent_wallets WHERE agent_id = NEW.agent_id;

    -- If the agent has no wallet, raise an error.
    -- This is a safeguard, as agents should have a wallet created upon signup.
    IF agent_wallet IS NULL THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: No wallet found for agent_id %', NEW.agent_id;
    END IF;

    -- Check if the wallet balance is sufficient for the activation cost.
    IF agent_wallet.balance < activation_cost THEN
        -- This exception will cause the initial INSERT transaction to be rolled back,
        -- preventing the property from being created.
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Le solde de votre portefeuille est insuffisant pour activer cette annonce. Solde actuel : %, Coût : %', agent_wallet.balance, activation_cost;
    END IF;

    -- If the balance is sufficient, deduct the cost from the wallet.
    UPDATE public.agent_wallets
    SET balance = balance - activation_cost,
        updated_at = NOW()
    WHERE agent_id = NEW.agent_id;

    -- Log the activation transaction in the ads_activating table.
    -- The `expires_at` column will be set automatically by its own trigger.
    INSERT INTO public.ads_activating (property_id, agent_id, amount_deducted)
    VALUES (NEW.id, NEW.agent_id, activation_cost);

    -- Update the property to set it as featured. The status is assumed to be 'available' by default.
    UPDATE public.properties
    SET is_featured = true
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger that executes the function after a new property is inserted.
CREATE TRIGGER on_property_insert_activate
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_property_activation();

COMMENT ON FUNCTION public.handle_new_property_activation() IS 'Trigger function to handle the activation of a new property. It checks the agent''s wallet, deducts the activation fee, logs the activation, and marks the property as featured. Rolls back the transaction if funds are insufficient.';
COMMENT ON TRIGGER on_property_insert_activate ON public.properties IS 'After inserting a new property, automatically handles the activation fee deduction from the agent''s wallet.';
