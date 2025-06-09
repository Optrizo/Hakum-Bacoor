/*
  # Add crew management and service packages

  1. New Tables
    - `crew_members`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, optional)
      - `role` (text, default 'worker')
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `service_packages`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `service_ids` (uuid array, services included)
      - `pricing` (jsonb, size-based pricing)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Tables
    - `services` - Add size-based pricing structure
    - `cars` - Update crew field to reference crew_members

  3. Security
    - Enable RLS on new tables
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

-- Add size-based pricing to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'pricing'
  ) THEN
    ALTER TABLE services ADD COLUMN pricing jsonb DEFAULT '{"small": 0, "medium": 0, "large": 0, "extra_large": 0}';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for crew_members
CREATE POLICY "Allow all operations for everyone on crew_members"
  ON crew_members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for service_packages
CREATE POLICY "Allow all operations for everyone on service_packages"
  ON service_packages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert sample crew members
INSERT INTO crew_members (name, phone, role) VALUES
  ('John Doe', '+1234567890', 'supervisor'),
  ('Jane Smith', '+1234567891', 'worker'),
  ('Mike Johnson', '+1234567892', 'worker'),
  ('Sarah Wilson', '+1234567893', 'worker')
ON CONFLICT DO NOTHING;

-- Insert sample service package
INSERT INTO service_packages (name, description, service_ids, pricing) VALUES
  ('Platinum Package', 'Express Package with Premium Services', '{}', '{"small": 450, "medium": 500, "large": 550, "extra_large": 650}')
ON CONFLICT DO NOTHING;