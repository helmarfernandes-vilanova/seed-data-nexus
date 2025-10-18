-- Adicionar índice único para evitar duplicatas
-- Primeiro, remover possíveis duplicatas existentes
DELETE FROM public.condicoes_comerciais a
USING public.condicoes_comerciais b
WHERE a.id < b.id 
AND a.empresa_id = b.empresa_id 
AND a.codigo_sku = b.codigo_sku;

-- Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS condicoes_comerciais_empresa_sku_unique 
ON public.condicoes_comerciais (empresa_id, codigo_sku);