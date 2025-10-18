-- Adicionar políticas de DELETE para permitir limpeza do banco
CREATE POLICY "Permitir exclusão pública de estoque" 
  ON public.estoque FOR DELETE 
  TO public 
  USING (true);

CREATE POLICY "Permitir exclusão pública de produtos" 
  ON public.produtos FOR DELETE 
  TO public 
  USING (true);

CREATE POLICY "Permitir exclusão pública de categorias" 
  ON public.categorias FOR DELETE 
  TO public 
  USING (true);

CREATE POLICY "Permitir exclusão pública de fornecedores" 
  ON public.fornecedores FOR DELETE 
  TO public 
  USING (true);

CREATE POLICY "Permitir exclusão pública de empresas" 
  ON public.empresas FOR DELETE 
  TO public 
  USING (true);