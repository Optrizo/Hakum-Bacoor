-- Add phone column to cars table
DO $$ 
BEGIN
  -- First add the column as nullable
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'phone'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE cars ADD COLUMN phone text;
    
    -- Update existing rows with a default value
    UPDATE cars SET phone = 'Not provided' WHERE phone IS NULL;
    
    -- Now make it non-nullable
    ALTER TABLE cars ALTER COLUMN phone SET NOT NULL;
  END IF;
END $$;