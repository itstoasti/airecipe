-- Migration: Store API keys securely server-side
-- Run this in your Supabase SQL Editor

-- Create table for API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to READ api keys
CREATE POLICY "Authenticated users can read api keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can INSERT/UPDATE/DELETE
-- (You'll manage keys through Supabase Dashboard or SQL)
CREATE POLICY "Only service role can modify api keys"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true);

-- Insert your API keys (REPLACE WITH YOUR ACTUAL KEYS)
INSERT INTO api_keys (key_name, key_value)
VALUES
  ('openai_api_key', 'sk-your-openai-key-here'),
  ('fal_api_key', 'your-fal-key-here')
ON CONFLICT (key_name)
DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

-- Create function to get API keys securely
CREATE OR REPLACE FUNCTION get_api_key(key_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_value TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get the key
  SELECT api_keys.key_value INTO key_value
  FROM api_keys
  WHERE api_keys.key_name = get_api_key.key_name;

  RETURN key_value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_api_key(TEXT) TO authenticated;
