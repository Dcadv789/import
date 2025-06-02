/*
  # Criação das Tabelas de Configuração do DRE

  1. Novas Tabelas
    - `dre_contas`
      - Tabela principal de configuração das contas do DRE
      - Suporta estrutura hierárquica através de auto-referência
      - Inclui propriedades de exibição e cálculo
    
    - `dre_componentes`
      - Vincula contas do DRE aos seus componentes
      - Componentes podem ser categorias, indicadores ou outras contas do DRE
      - Controla comportamento de cálculo através de símbolos
    
    - `dre_empresas`
      - Mapeia contas do DRE para empresas específicas
      - Permite configurações de DRE específicas por empresa

  2. Segurança
    - Habilita RLS em todas as tabelas
    - Adiciona políticas para usuários autenticados gerenciarem seus dados
    
  3. Relacionamentos
    - Restrições de chave estrangeira para garantir integridade dos dados
    - Atualizações em cascata onde apropriado
    - Previne exclusão de registros referenciados
*/

-- Criar tabela dre_contas
CREATE TABLE IF NOT EXISTS dre_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ordem integer NOT NULL,
  simbolo text NOT NULL CHECK (simbolo IN ('+', '-', '=')),
  conta_pai uuid REFERENCES dre_contas(id),
  ativo boolean NOT NULL DEFAULT true,
  visivel boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  modificado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_hierarchy CHECK (id != conta_pai)
);

-- Criar tabela dre_componentes
CREATE TABLE IF NOT EXISTS dre_componentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dre_conta_id uuid NOT NULL REFERENCES dre_contas(id),
  categoria_id uuid REFERENCES categorias(id),
  indicador_id uuid REFERENCES indicadores(id),
  conta_id uuid REFERENCES dre_contas(id),
  simbolo text NOT NULL CHECK (simbolo IN ('+', '-', '=')),
  ordem integer NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  visivel boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  modificado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_component_type CHECK (
    (categoria_id IS NOT NULL AND indicador_id IS NULL AND conta_id IS NULL) OR
    (categoria_id IS NULL AND indicador_id IS NOT NULL AND conta_id IS NULL) OR
    (categoria_id IS NULL AND indicador_id IS NULL AND conta_id IS NOT NULL)
  )
);

-- Criar tabela dre_empresas
CREATE TABLE IF NOT EXISTS dre_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  dre_conta_id uuid NOT NULL REFERENCES dre_contas(id),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  modificado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_empresa_conta UNIQUE (empresa_id, dre_conta_id)
);

-- Habilitar Row Level Security
ALTER TABLE dre_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dre_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dre_empresas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para dre_contas
CREATE POLICY "Permitir leitura de contas para usuários autenticados"
  ON dre_contas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de contas para usuários autenticados"
  ON dre_contas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de contas para usuários autenticados"
  ON dre_contas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de contas para usuários autenticados"
  ON dre_contas FOR DELETE TO authenticated USING (true);

-- Criar políticas de segurança para dre_componentes
CREATE POLICY "Permitir leitura de componentes para usuários autenticados"
  ON dre_componentes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de componentes para usuários autenticados"
  ON dre_componentes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de componentes para usuários autenticados"
  ON dre_componentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de componentes para usuários autenticados"
  ON dre_componentes FOR DELETE TO authenticated USING (true);

-- Criar políticas de segurança para dre_empresas
CREATE POLICY "Permitir leitura de empresas DRE para usuários autenticados"
  ON dre_empresas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de empresas DRE para usuários autenticados"
  ON dre_empresas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de empresas DRE para usuários autenticados"
  ON dre_empresas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de empresas DRE para usuários autenticados"
  ON dre_empresas FOR DELETE TO authenticated USING (true);

-- Criar função para atualizar o campo modificado_em
CREATE OR REPLACE FUNCTION atualizar_modificado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modificado_em = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualização automática do campo modificado_em
CREATE TRIGGER atualizar_dre_contas_modificado_em
  BEFORE UPDATE ON dre_contas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_modificado_em();

CREATE TRIGGER atualizar_dre_componentes_modificado_em
  BEFORE UPDATE ON dre_componentes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_modificado_em();

CREATE TRIGGER atualizar_dre_empresas_modificado_em
  BEFORE UPDATE ON dre_empresas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_modificado_em();