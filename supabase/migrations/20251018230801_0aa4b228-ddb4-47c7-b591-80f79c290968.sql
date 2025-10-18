-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela para condições comerciais NIV
CREATE TABLE public.condicoes_comerciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id),
  codigo_ean TEXT,
  codigo_sku TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  itens_por_caixa INTEGER,
  preco_apos_descontos NUMERIC,
  preco_com_impostos NUMERIC,
  preco_unitario NUMERIC,
  ton_por_ean NUMERIC,
  niv_por_ean NUMERIC,
  caixas_por_camada INTEGER,
  caixas_por_pallet INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.condicoes_comerciais ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Permitir leitura pública de condições comerciais" 
ON public.condicoes_comerciais 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública de condições comerciais" 
ON public.condicoes_comerciais 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de condições comerciais" 
ON public.condicoes_comerciais 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão pública de condições comerciais" 
ON public.condicoes_comerciais 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_condicoes_comerciais_updated_at
BEFORE UPDATE ON public.condicoes_comerciais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();