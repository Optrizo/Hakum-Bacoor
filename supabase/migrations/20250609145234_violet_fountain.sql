/*
  # Add crew members and service packages tables

  1. New Tables
    - `crew_members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text, optional)
      - `role` (text, default 'worker')
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_packages`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `service_ids` (uuid[])
      - `pricing` (jsonb) - size-based pricing
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to services table
    - Add `pricing` column (jsonb) for size-based pricing

  3. Security
    - Enable RLS on both tables
    - Add policies for public access
*/

-- Create crew_members table
CREATE TABLE IF NOT EXISTS crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  role text DEFAULT 'worker',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_packages table
CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  service_ids uuid[] DEFAULT '{}',
  pricing jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add pricing column to services table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'pricing'
  ) THEN
    ALTER TABLE services ADD COLUMN pricing jsonb DEFAULT '{"small": 0, "medium": 0, "large": 0, "extra_large": 0}';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for crew_members
CREATE POLICY "Allow all operations for everyone on crew_members" ON crew_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for service_packages
CREATE POLICY "Allow all operations for everyone on service_packages" ON service_packages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;
ALTER PUBLICATION supabase_realtime ADD TABLE service_packages;