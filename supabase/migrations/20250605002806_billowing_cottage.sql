/*
  # Create Registro de Vendas table

  1. New Tables
    - `registro_de_vendas`
      - `id` (uuid, primary key)
      - `empresa_id` (uuid, foreign key)
      - `cliente_id` (uuid, foreign key)
      - `vendedor_id` (uuid, foreign key)
      - `sdr_id` (uuid, foreign key)
      - `servico_id` (uuid, foreign key)
      - `valor` (numeric, required)
      - `origem` (text, required)
      - `nome_cliente` (text, nullable)
      - `registro_venda` (text, required)
      - `data_venda` (date, required)
      - `criado_em` (timestamp with timezone, default now())
      - `modificado_em` (timestamp with timezone, default now())

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create the registro_de_vendas table
CREATE TABLE IF NOT EXISTS registro_de_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id),
  cliente_id uuid REFERENCES clientes(id),
  vendedor_id uuid REFERENCES pessoas(id),
  sdr_id uuid REFERENCES pessoas(id),
  servico_id uuid REFERENCES servicos(id),
  valor numeric NOT NULL,
  origem text NOT NULL,
  nome_cliente text DEFAULT NULL,
  registro_venda text NOT NULL,
  data_venda date NOT NULL,
  criado_em timestamptz DEFAULT now(),
  modificado_em timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE registro_de_vendas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read all sales"
  ON registro_de_vendas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create sales"
  ON registro_de_vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales"
  ON registro_de_vendas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sales"
  ON registro_de_vendas
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to automatically update the modificado_em timestamp
CREATE TRIGGER update_registro_de_vendas_modificado_em
  BEFORE UPDATE ON registro_de_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();