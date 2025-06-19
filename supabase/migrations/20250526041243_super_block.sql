/*
  # Fix RLS policies for cars table

  1. Changes
    - Drop existing RLS policies on cars table
    - Create new, properly configured RLS policies for all operations
    
  2. Security
    - Enable RLS on cars table (already enabled)
    - Add policies for:
      - INSERT: Allow authenticated users to add new cars
      - SELECT: Allow public access to view cars
      - UPDATE: Allow authenticated users to update cars
      - DELETE: Allow authenticated users to delete cars
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage cars" ON cars;
DROP POLICY IF EXISTS "Allow public users to view cars" ON cars;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON cars
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON cars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON cars
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON cars
  FOR DELETE
  TO authenticated
  USING (true);