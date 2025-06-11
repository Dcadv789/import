/*
  # Criar tabela metas_vendas

  1. Nova Tabela
    - `metas_vendas`
      - `id` (uuid, primary key)
      - `pessoa_id` (uuid, foreign key para pessoas)
      - `mes` (integer, valores de 1 a 12)
      - `ano` (integer, 4 dígitos)
      - `valor_meta` (numeric, valor da meta de vendas)
      - `observacao` (text, opcional, para anotações sobre a meta)
      - `ativo` (boolean, default true)
      - `criado_em` (timestamp, default now())
      - `modificado_em` (timestamp, default now())

  2. Segurança
    - Habilita RLS na tabela `metas_vendas`
    - Adiciona políticas para usuários autenticados gerenciarem metas

  3. Validações
    - Restrição para mes entre 1 e 12
    - Restrição para ano com 4 dígitos
    - Índice único para pessoa_id, mes e ano (evita duplicatas)
*/

-- Criar tabela metas_vendas
CREATE TABLE IF NOT EXISTS metas_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL CHECK (ano >= 1900 AND ano <= 9999),
  valor_meta numeric NOT NULL,
  observacao text DEFAULT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  modificado_em timestamptz DEFAULT now(),
  CONSTRAINT unique_pessoa_mes_ano_meta UNIQUE (pessoa_id, mes, ano)
);

-- Habilitar Row Level Security
ALTER TABLE metas_vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Permitir leitura de metas para usuários autenticados"
  ON metas_vendas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de metas para usuários autenticados"
  ON metas_vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de metas para usuários autenticados"
  ON metas_vendas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de metas para usuários autenticados"
  ON metas_vendas
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar trigger para atualização automática do campo modificado_em
CREATE TRIGGER atualizar_metas_vendas_modificado_em
  BEFORE UPDATE ON metas_vendas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_modificado_em();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metas_vendas_pessoa_id ON metas_vendas(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_metas_vendas_ano_mes ON metas_vendas(ano, mes);
CREATE INDEX IF NOT EXISTS idx_metas_vendas_ativo ON metas_vendas(ativo);