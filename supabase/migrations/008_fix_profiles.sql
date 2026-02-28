-- Add notes column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop the restrictive relation check constraint and replace with a broader one
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_relation_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_relation_check
  CHECK (relation IN (
    'Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter',
    'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other',
    'self', 'spouse', 'parent', 'child', 'sibling', 'other'
  ));
