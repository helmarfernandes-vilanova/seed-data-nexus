-- Function to compute total inventory value without 1000-row limit
CREATE OR REPLACE FUNCTION public.total_valor_estoque()
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(COALESCE(custo_cx,0) * COALESCE(qtd_disponivel,0)), 0)::numeric
  FROM public.estoque;
$$;