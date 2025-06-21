-- Remove unique constraint from plate column in cars table
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_plate_key;

-- Optionally, update the table definition if needed (no-op if already correct)
-- ALTER TABLE public.cars ALTER COLUMN plate DROP NOT NULL; -- keep NOT NULL if you want to require a plate
