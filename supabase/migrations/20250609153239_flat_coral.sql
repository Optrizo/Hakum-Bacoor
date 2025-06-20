/*
  # Fix Real-time Publication Setup

  1. Conditionally add tables to publication
    - Only add tables if they're not already in the publication
    - Use DO blocks to check existence before adding
  
  2. Security
    - Ensure RLS is enabled on all tables
    - Recreate policies for public access
*/

-- Conditionally add tables to real-time publication
DO $$
BEGIN
  -- Add cars table if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cars;
  END IF;

  -- Add services table if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;

  -- Add crew_members table if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'crew_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;
  END IF;

  -- Add service_packages table if not already in publication
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