-- Adicionar políticas de INSERT para todas as tabelas
CREATE POLICY "Permitir inserção pública de empresas" 
  ON public.empresas FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Permitir inserção pública de fornecedores" 
  ON public.fornecedores FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Permitir inserção pública de categorias" 
  ON public.categorias FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Permitir inserção pública de produtos" 
  ON public.produtos FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Permitir inserção pública de estoque" 
  ON public.estoque FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Adicionar políticas de UPDATE para atualizar dados existentes
CREATE POLICY "Permitir atualização pública de empresas" 
  ON public.empresas FOR UPDATE 
  TO public 
  USING (true);

CREATE POLICY "Permitir atualização pública de fornecedores" 
  ON public.fornecedores FOR UPDATE 
  TO public 
  USING (true);

CREATE POLICY "Permitir atualização pública de categorias" 
  ON public.categorias FOR UPDATE 
  TO public 
  USING (true);

CREATE POLICY "Permitir atualização pública de produtos" 
  ON public.produtos FOR UPDATE 
  TO public 
  USING (true);

CREATE POLICY "Permitir atualização pública de estoque" 
  ON public.estoque FOR UPDATE 
  TO public 
  USING (true);