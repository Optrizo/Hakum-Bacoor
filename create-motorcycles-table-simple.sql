-- Step 1: Create the motorcycles table
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

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_motorcycles_plate ON motorcycles(plate);
CREATE INDEX IF NOT EXISTS idx_motorcycles_status ON motorcycles(status);
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_at ON motorcycles(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy
CREATE POLICY "Allow all operations for everyone" ON motorcycles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE motorcycles;

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION update_motorcycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
CREATE TRIGGER trigger_update_motorcycles_updated_at
  BEFORE UPDATE ON motorcycles
  FOR EACH ROW
  EXECUTE FUNCTION update_motorcycles_updated_at();

-- Step 8: Test the table
SELECT 'Motorcycles table created successfully!' as status; 