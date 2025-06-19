/*
  # Enable real-time updates for queue management

  1. Changes
    - Drop existing policies
    - Create a single policy for all operations
    - Enable real-time replication for the cars table
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for everyone" ON cars;
DROP POLICY IF EXISTS "Enable read access for all users" ON cars;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON cars;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON cars;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON cars;

-- Create a single policy that allows all operations for everyone
CREATE POLICY "Allow all operations for everyone" ON cars
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable replication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE cars;