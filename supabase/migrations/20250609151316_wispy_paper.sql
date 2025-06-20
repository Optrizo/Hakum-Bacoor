/*
  # Fix Real-time Setup for All Tables

  1. Tables
    - Ensure all tables have proper RLS policies
    - Add real-time subscriptions for all tables
    - Fix any missing configurations

  2. Security
    - Update RLS policies to allow proper access
    - Ensure real-time works with current setup
*/

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS cars;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS services;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS crew_members;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS service_packages;

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