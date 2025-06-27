-- Create motorcycles table for Hakum Auto Care
-- Run this in Supabase SQL Editor

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

-- Create policy for motorcycles (allow all operations for now)
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

-- Insert some sample data for testing
INSERT INTO motorcycles (plate, model, size, status, phone, total_cost, vehicle_type) VALUES
('123-ABC', 'Honda Click 160', 'small', 'waiting', '09123456789', 500, 'motorcycle'),
('456-DEF', 'Yamaha NMAX', 'large', 'in-progress', '09187654321', 800, 'motorcycle'),
('789-GHI', 'Suzuki Burgman', 'large', 'completed', '09111222333', 1200, 'motorcycle')
ON CONFLICT (plate) DO NOTHING;

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'motorcycles' 
ORDER BY ordinal_position; 