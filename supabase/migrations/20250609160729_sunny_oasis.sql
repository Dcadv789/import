/*
  # Criar tabela despesas_vendedor

  1. Nova Tabela
    - `despesas_vendedor`
      - `id` (uuid, primary key)
      - `pessoa_id` (uuid, foreign key para pessoas)
      - `mes` (integer, valores de 1 a 12)
      - `ano` (integer, 4 dígitos)
      - `combustivel` (numeric)
      - `alimentacao` (numeric)
      - `hospedagem` (numeric)
      - `comissao` (numeric)
      - `salario` (numeric)
      - `outras_despesas` (numeric)
      - `criado_em` (timestamp, default now())
      - `modificado_em` (timestamp, default now())

  2. Segurança
    - Habilita RLS na tabela `despesas_vendedor`
    - Adiciona políticas para usuários autenticados gerenciarem despesas

  3. Validações
    - Restrição para mes entre 1 e 12
    - Restrição para ano com 4 dígitos
    - Índice único para pessoa_id, mes e ano (evita duplicatas)
*/

-- Criar tabela despesas_vendedor
CREATE TABLE IF NOT EXISTS despesas_vendedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL CHECK (ano >= 1900 AND ano <= 9999),
  combustivel numeric DEFAULT 0,
  alimentacao numeric DEFAULT 0,
  hospedagem numeric DEFAULT 0,
  comissao numeric DEFAULT 0,
  salario numeric DEFAULT 0,
  outras_despesas numeric DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  modificado_em timestamptz DEFAULT now(),
  CONSTRAINT unique_pessoa_mes_ano UNIQUE (pessoa_id, mes, ano)
);

-- Habilitar Row Level Security
ALTER TABLE despesas_vendedor ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Permitir leitura de despesas para usuários autenticados"
  ON despesas_vendedor
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de despesas para usuários autenticados"
  ON despesas_vendedor
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de despesas para usuários autenticados"
  ON despesas_vendedor
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de despesas para usuários autenticados"
  ON despesas_vendedor
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar trigger para atualização automática do campo modificado_em
CREATE TRIGGER atualizar_despesas_vendedor_modificado_em
  BEFORE UPDATE ON despesas_vendedor
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_modificado_em();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_despesas_vendedor_pessoa_id ON despesas_vendedor(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_despesas_vendedor_ano_mes ON despesas_vendedor(ano, mes);