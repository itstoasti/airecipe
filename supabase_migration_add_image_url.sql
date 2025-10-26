-- Migration: Add image_url column to recipes table
-- Run this SQL in your Supabase SQL Editor:
-- https://hlyrnwalexksdzibduhm.supabase.co/project/_/sql

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN recipes.image_url IS 'URL of the generated recipe image from FAL.ai';
