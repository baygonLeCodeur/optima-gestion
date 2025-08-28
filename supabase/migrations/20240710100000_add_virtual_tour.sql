
-- Add virtual_tour_config column to properties table (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'virtual_tour_config'
	) THEN
		ALTER TABLE public.properties
		ADD COLUMN virtual_tour_config JSONB;
	END IF;
END$$;
