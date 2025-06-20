/*
  # Complete Real-time Setup for All Tables

  1. Real-time Configuration
    - Enable real-time for cars, services, crew_members, and service_packages tables
    - Configure proper RLS policies for public access
    
  2. Security
    - Maintain RLS on all tables
    - Allow public access for all operations (as per current setup)
    
  3. Performance
    - Ensure proper indexing for real-time operations
*/

-- First, check if tables are already in the publication and only add if not present
DO $$
BEGIN
  -- Add tables to real-time publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cars;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'crew_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;
  END IF;

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

-- Add indexes for better real-time performance
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_crew_members_active ON crew_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active) WHERE is_active = true;