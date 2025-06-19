-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON cars;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON cars;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON cars;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON cars;

-- Create a single policy that allows all operations for everyone
CREATE POLICY "Allow all operations for everyone" ON cars
  FOR ALL
  USING (true)
  WITH CHECK (true);