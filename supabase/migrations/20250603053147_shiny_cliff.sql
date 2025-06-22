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
    - Update status enum

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
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS services uuid[] DEFAULT '{}';

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy for services
CREATE POLICY "Allow all operations for everyone" ON services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time for services
ALTER PUBLICATION supabase_realtime ADD TABLE services;