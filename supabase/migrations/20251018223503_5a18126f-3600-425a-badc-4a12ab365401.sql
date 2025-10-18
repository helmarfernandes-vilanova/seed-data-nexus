-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  ean TEXT,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  qt_cx_compra INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(codigo, fornecedor_id)
);

-- Criar tabela de estoque
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  qtd_disponivel DECIMAL(10,2) DEFAULT 0,
  pendente DECIMAL(10,2) DEFAULT 0,
  dias_estoque DECIMAL(10,2),
  m_3 DECIMAL(10,2),
  m_2 DECIMAL(10,2),
  m_1 DECIMAL(10,2),
  m_0 DECIMAL(10,2),
  custo_un DECIMAL(10,2),
  custo_cx DECIMAL(10,2),
  livro DECIMAL(10,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(produto_id, empresa_id)
);

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público para leitura (ajuste conforme necessário)
CREATE POLICY "Permitir leitura pública de empresas" 
  ON public.empresas FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Permitir leitura pública de fornecedores" 
  ON public.fornecedores FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Permitir leitura pública de categorias" 
  ON public.categorias FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Permitir leitura pública de produtos" 
  ON public.produtos FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Permitir leitura pública de estoque" 
  ON public.estoque FOR SELECT 
  TO public 
  USING (true);

-- Criar índices para melhorar performance de consultas
CREATE INDEX idx_produtos_fornecedor ON public.produtos(fornecedor_id);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_estoque_produto ON public.estoque(produto_id);
CREATE INDEX idx_estoque_empresa ON public.estoque(empresa_id);
CREATE INDEX idx_produtos_ean ON public.produtos(ean);
CREATE INDEX idx_produtos_descricao ON public.produtos(descricao);