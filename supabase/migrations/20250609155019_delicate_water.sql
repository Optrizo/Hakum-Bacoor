/*
  # Fix Real-time and RLS Configuration

  1. Real-time Setup
    - Safely add tables to supabase_realtime publication (only if not already added)
    - Enable real-time updates for all tables
  
  2. Security
    - Ensure RLS is enabled on all tables
    - Recreate comprehensive policies for public access
    - Drop and recreate policies to ensure consistency

  3. Changes
    - Use DO blocks to safely add tables to publication
    - Maintain existing RLS and policy structure
*/

-- Safely enable real-time for all tables using DO blocks
DO $$
BEGIN
  -- Add cars table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cars;
  END IF;
  
  -- Add services table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;
  
  -- Add crew_members table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'crew_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;
  END IF;
  
  -- Add service_packages table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'service_packages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_packages;
  END IF;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow all operations for everyone" ON cars;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON services;
DROP POLICY IF EXISTS "Allow all operations for everyone on crew_members" ON crew_members;
DROP POLICY IF EXISTS "Allow all operations for everyone on service_packages" ON service_packages;

-- Create comprehensive policies for all tables
CREATE POLICY "Allow all operations for everyone" ON cars
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON services
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone on crew_members" ON crew_members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone on service_packages" ON service_packages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);