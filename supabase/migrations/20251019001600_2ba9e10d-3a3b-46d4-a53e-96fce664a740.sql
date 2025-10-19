-- Criar tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'rascunho',
  observacoes TEXT
);

-- Criar tabela de itens do pedido
CREATE TABLE public.pedidos_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  qtd_pallet INTEGER NOT NULL DEFAULT 0,
  qtd_camada INTEGER NOT NULL DEFAULT 0,
  qtd_pedido INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_itens ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público
CREATE POLICY "Permitir leitura pública de pedidos"
  ON public.pedidos FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública de pedidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de pedidos"
  ON public.pedidos FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão pública de pedidos"
  ON public.pedidos FOR DELETE
  USING (true);

CREATE POLICY "Permitir leitura pública de itens de pedidos"
  ON public.pedidos_itens FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública de itens de pedidos"
  ON public.pedidos_itens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de itens de pedidos"
  ON public.pedidos_itens FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão pública de itens de pedidos"
  ON public.pedidos_itens FOR DELETE
  USING (true);

-- Criar trigger para atualizar data_atualizacao
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();