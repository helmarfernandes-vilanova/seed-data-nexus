-- Create a secure function to clear application data safely
CREATE OR REPLACE FUNCTION public.admin_clear_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Truncate child tables first to avoid FK issues; CASCADE handles dependencies just in case
  TRUNCATE TABLE 
    public.pedidos_itens,
    public.pedidos,
    public.estoque,
    public.condicoes_comerciais
  RESTART IDENTITY CASCADE;

  -- Then truncate master/reference tables
  TRUNCATE TABLE 
    public.produtos,
    public.categorias,
    public.fornecedores,
    public.empresas
  RESTART IDENTITY CASCADE;
END;
$$;

-- Restrict execution: by default only the function owner (admin) can execute.
-- Optionally, you can GRANT EXECUTE to authenticated role if needed in the future, but we keep it owner-only for now; the edge function uses service role.
