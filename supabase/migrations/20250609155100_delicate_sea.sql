/*
  # Remove crew roles and fix crew member display

  1. Schema Changes
    - Remove role column from crew_members table
    - Update any existing data

  2. Notes
    - This migration removes the role functionality from crew members
    - All crew members will be treated equally without role distinctions
*/

-- Remove the role column from crew_members table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crew_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE crew_members DROP COLUMN role;
  END IF;
END $$;