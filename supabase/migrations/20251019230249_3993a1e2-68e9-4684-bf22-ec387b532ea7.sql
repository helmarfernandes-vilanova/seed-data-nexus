-- Atualizar políticas de RLS para pedidos_itens
-- Permitir que usuários autenticados possam atualizar itens de pedidos

DROP POLICY IF EXISTS "Only admins can update order items" ON pedidos_itens;
DROP POLICY IF EXISTS "Only admins can insert order items" ON pedidos_itens;
DROP POLICY IF EXISTS "Only admins can delete order items" ON pedidos_itens;

-- Criar novas políticas mais permissivas para usuários autenticados
CREATE POLICY "Authenticated users can update order items" 
ON pedidos_itens 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert order items" 
ON pedidos_itens 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete order items" 
ON pedidos_itens 
FOR DELETE 
TO authenticated
USING (true);