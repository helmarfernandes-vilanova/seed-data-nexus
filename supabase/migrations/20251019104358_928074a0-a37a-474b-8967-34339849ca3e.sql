-- Adicionar campos para armazenar valores históricos do pedido
ALTER TABLE pedidos_itens
ADD COLUMN verba_unid numeric DEFAULT 0,
ADD COLUMN estoque_atual numeric,
ADD COLUMN custo_atual numeric,
ADD COLUMN preco_atual numeric;