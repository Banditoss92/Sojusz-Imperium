/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies that are too restrictive
    - Add new policies to allow:
      - Users to create their own profile
      - Users to update their own profile
      - Everyone to view profiles
    
  2. Security
    - Enable RLS (already enabled)
    - Add comprehensive policies for all operations
    - Ensure users can only modify their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);