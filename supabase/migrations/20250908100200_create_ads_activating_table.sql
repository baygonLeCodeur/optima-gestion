-- Migration to create the ads_activating table
-- This table logs all ad activation events.

CREATE TABLE public.ads_activating (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    amount_deducted NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- The value will be set by a trigger
);

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION set_activation_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the expiration date to 30 days after the activation date
    NEW.expires_at := NEW.activated_at + INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that fires before inserting a new row
CREATE TRIGGER trigger_set_expires_at_on_activation
BEFORE INSERT ON public.ads_activating
FOR EACH ROW
EXECUTE FUNCTION set_activation_expiration_date();

COMMENT ON TABLE public.ads_activating IS 'Logs property ad activation events and their expiration dates.';
COMMENT ON COLUMN public.ads_activating.amount_deducted IS 'The amount deducted from the agent''s wallet for activation.';
COMMENT ON COLUMN public.ads_activating.expires_at IS 'The date and time when the ad activation automatically expires. Set by a trigger.';