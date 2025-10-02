-- Adiciona política para permitir que clientes autenticados se auto-cadastrem
CREATE POLICY "Users can insert their own customer record"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Adiciona política para permitir que clientes vejam seus próprios dados
CREATE POLICY "Users can view their own customer record"
ON public.customers
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Adiciona política para permitir que clientes atualizem seus próprios dados
CREATE POLICY "Users can update their own customer record"
ON public.customers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());