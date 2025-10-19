-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for condicoes_comerciais
DROP POLICY IF EXISTS "Permitir leitura pública de condições comerciais" ON public.condicoes_comerciais;
DROP POLICY IF EXISTS "Permitir inserção pública de condições comerciais" ON public.condicoes_comerciais;
DROP POLICY IF EXISTS "Permitir atualização pública de condições comerciais" ON public.condicoes_comerciais;
DROP POLICY IF EXISTS "Permitir exclusão pública de condições comerciais" ON public.condicoes_comerciais;

CREATE POLICY "Authenticated users can view commercial conditions"
ON public.condicoes_comerciais FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert commercial conditions"
ON public.condicoes_comerciais FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update commercial conditions"
ON public.condicoes_comerciais FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete commercial conditions"
ON public.condicoes_comerciais FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for estoque
DROP POLICY IF EXISTS "Permitir leitura pública de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir inserção pública de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir atualização pública de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir exclusão pública de estoque" ON public.estoque;

CREATE POLICY "Authenticated users can view inventory"
ON public.estoque FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert inventory"
ON public.estoque FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update inventory"
ON public.estoque FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete inventory"
ON public.estoque FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for pedidos
DROP POLICY IF EXISTS "Permitir leitura pública de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir inserção pública de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir atualização pública de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir exclusão pública de pedidos" ON public.pedidos;

CREATE POLICY "Authenticated users can view orders"
ON public.pedidos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert orders"
ON public.pedidos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update orders"
ON public.pedidos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orders"
ON public.pedidos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for pedidos_itens
DROP POLICY IF EXISTS "Permitir leitura pública de itens de pedidos" ON public.pedidos_itens;
DROP POLICY IF EXISTS "Permitir inserção pública de itens de pedidos" ON public.pedidos_itens;
DROP POLICY IF EXISTS "Permitir atualização pública de itens de pedidos" ON public.pedidos_itens;
DROP POLICY IF EXISTS "Permitir exclusão pública de itens de pedidos" ON public.pedidos_itens;

CREATE POLICY "Authenticated users can view order items"
ON public.pedidos_itens FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert order items"
ON public.pedidos_itens FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update order items"
ON public.pedidos_itens FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete order items"
ON public.pedidos_itens FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for master data tables (keep SELECT public, restrict writes)
DROP POLICY IF EXISTS "Permitir inserção pública de empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir atualização pública de empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir exclusão pública de empresas" ON public.empresas;

CREATE POLICY "Only admins can insert empresas"
ON public.empresas FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update empresas"
ON public.empresas FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete empresas"
ON public.empresas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Permitir inserção pública de fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Permitir atualização pública de fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Permitir exclusão pública de fornecedores" ON public.fornecedores;

CREATE POLICY "Only admins can insert fornecedores"
ON public.fornecedores FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update fornecedores"
ON public.fornecedores FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete fornecedores"
ON public.fornecedores FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Permitir inserção pública de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir atualização pública de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir exclusão pública de categorias" ON public.categorias;

CREATE POLICY "Only admins can insert categorias"
ON public.categorias FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update categorias"
ON public.categorias FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete categorias"
ON public.categorias FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Permitir inserção pública de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir atualização pública de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir exclusão pública de produtos" ON public.produtos;

CREATE POLICY "Only admins can insert produtos"
ON public.produtos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update produtos"
ON public.produtos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete produtos"
ON public.produtos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));