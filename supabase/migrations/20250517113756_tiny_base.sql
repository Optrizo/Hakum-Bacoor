/*
  # Create cars table with policies

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
    - Add policies for authenticated users to manage cars
    - Add policies for public users to view cars
*/

-- Create the cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text UNIQUE NOT NULL,
  model text NOT NULL,
  size text NOT NULL,
  service text NOT NULL,
  status text NOT NULL,
  crew text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to manage cars" ON public.cars;
  DROP POLICY IF EXISTS "Allow public users to view cars" ON public.cars;
END $$;

-- Create policies
CREATE POLICY "Allow authenticated users to manage cars"
  ON public.cars
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public users to view cars"
  ON public.cars
  FOR SELECT
  TO public
  USING (true);