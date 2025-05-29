/*
  # Create Grupos table

  1. New Tables
    - `grupos`
      - `id` (uuid, primary key)
      - `nome` (text, required)
      - `descricao` (text, optional)
      - `ativo` (boolean, required, default true)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `grupos` table
    - Add policies for:
      - Select: Authenticated users can read all groups
      - Insert: Authenticated users can create groups
      - Update: Authenticated users can update groups
      - Delete: Authenticated users can delete groups
*/

-- Create the grupos table
CREATE TABLE IF NOT EXISTS grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read all groups"
  ON grupos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create groups"
  ON grupos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update groups"
  ON grupos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete groups"
  ON grupos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grupos_updated_at
  BEFORE UPDATE ON grupos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();