-- Adicionar coluna preco_cx_niv na tabela pedidos_itens
ALTER TABLE public.pedidos_itens
ADD COLUMN preco_cx_niv numeric;