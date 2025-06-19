/*
  # Add services table and update cars table

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (numeric)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to cars table
    - Add `total_cost` column
    - Add `services` column (array of service IDs)

  3. Security
    - Enable RLS on services table
    - Add policies for public access
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to cars table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE cars ADD COLUMN total_cost numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'services'
  ) THEN
    ALTER TABLE cars ADD COLUMN services uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy for services (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Allow all operations for everyone'
  ) THEN
    CREATE POLICY "Allow all operations for everyone" ON services
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Enable real-time for services (handle case where it might already be added)
DO $$
BEGIN
  -- Check if services table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;
END $$;