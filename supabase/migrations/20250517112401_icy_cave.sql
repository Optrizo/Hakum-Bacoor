/*
  # Create queue management tables

  1. New Tables
    - `cars`
      - `id` (uuid, primary key)
      - `plate` (text, unique)
      - `model` (text)
      - `size` (text)
      - `service` (text)
      - `status` (text)
      - `crew` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cars` table
    - Add policy for authenticated users to manage cars
    - Add policy for public users to view cars
*/

CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text UNIQUE NOT NULL,
  model text NOT NULL,
  size text NOT NULL,
  service text NOT NULL,
  status text NOT NULL,
  crew text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage cars"
  ON cars
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public users to view cars"
  ON cars
  FOR SELECT
  TO public
  USING (true);