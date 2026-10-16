-- El linter de seguridad de Supabase marco mi_carrier() como ejecutable por el
-- rol anon, o sea sin iniciar sesion. Es SECURITY DEFINER.
--
-- Hoy no filtra nada: para anon, auth.uid() es null y la funcion devuelve null.
-- Pero una funcion SECURITY DEFINER expuesta al publico es superficie que no
-- hace falta, y basta con que alguien edite el cuerpo sin recordar quien puede
-- llamarla para que si filtre. Las demas RPC del proyecto ya tenian su revoke
-- desde la Fase 0; esta se agrego en la migracion t4 y se quedo sin el.
--
-- No cambia el comportamiento de la app: la pantalla del transportista llama a
-- mi_carrier() como authenticated.

revoke execute on function public.mi_carrier() from public;
revoke execute on function public.mi_carrier() from anon;