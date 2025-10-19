-- Atualizar políticas de RLS para pedidos
-- Permitir que usuários autenticados possam criar e gerenciar pedidos

DROP POLICY IF EXISTS "Only admins can insert orders" ON pedidos;
DROP POLICY IF EXISTS "Only admins can update orders" ON pedidos;
DROP POLICY IF EXISTS "Only admins can delete orders" ON pedidos;

-- Criar novas políticas mais permissivas para usuários autenticados
CREATE POLICY "Authenticated users can insert orders" 
ON pedidos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders" 
ON pedidos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders" 
ON pedidos 
FOR DELETE 
TO authenticated
USING (true);