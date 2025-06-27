/*
  # Add motorcycles table

  1. New Tables
    - `motorcycles`
      - `id` (uuid, primary key)
      - `plate` (text, unique)
      - `model` (text)
      - `size` (enum: 'small', 'large')
      - `status` (enum: same as cars)
      - `phone` (text, optional)
      - `crew` (uuid array)
      - `total_cost` (numeric)
      - `services` (uuid array)
      - `package` (text, optional)
      - `vehicle_type` (text, default 'motorcycle')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on motorcycles table
    - Add policies for public access
    - Add unique constraint on plate
*/

-- Create motorcycles table
CREATE TABLE IF NOT EXISTS motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  model text NOT NULL,
  size text NOT NULL CHECK (size IN ('small', 'large')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'payment-pending', 'completed', 'cancelled')),
  phone text,
  crew uuid[] DEFAULT '{}',
  total_cost numeric DEFAULT 0,
  services uuid[] DEFAULT '{}',
  package text,
  vehicle_type text DEFAULT 'motorcycle',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on plate for faster lookups
CREATE INDEX IF NOT EXISTS idx_motorcycles_plate ON motorcycles(plate);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_motorcycles_status ON motorcycles(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_at ON motorcycles(created_at DESC);

-- Enable RLS on motorcycles table
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;

-- Create policy for motorcycles
CREATE POLICY "Allow all operations for everyone" ON motorcycles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time for motorcycles
ALTER PUBLICATION supabase_realtime ADD TABLE motorcycles;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_motorcycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_motorcycles_updated_at
  BEFORE UPDATE ON motorcycles
  FOR EACH ROW
  EXECUTE FUNCTION update_motorcycles_updated_at(); 