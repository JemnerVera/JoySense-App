-- ============================================================================
-- SOLUCIÓN: Políticas RLS para Edge Function
-- ============================================================================
-- Este script crea políticas que permiten a service_role (Edge Function)
-- acceder a las tablas contacto y usuario en el schema joysense
-- ============================================================================

-- PASO 1: Habilitar RLS en las tablas (si no está habilitado)
ALTER TABLE joysense.contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE joysense.usuario ENABLE ROW LEVEL SECURITY;

-- PASO 2: Crear política para que service_role pueda leer contacto
-- Esta política permite a service_role (usado por Edge Functions) leer contactos activos
CREATE POLICY "service_role_can_read_contacto"
ON joysense.contacto
FOR SELECT
TO service_role
USING (statusid = 1);

-- PASO 3: Crear política para que service_role pueda leer usuario
-- Esta política permite a service_role leer usuarios activos
CREATE POLICY "service_role_can_read_usuario"
ON joysense.usuario
FOR SELECT
TO service_role
USING (statusid = 1);

-- PASO 4: Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename IN ('contacto', 'usuario')
ORDER BY tablename, policyname;

-- PASO 5: Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'joysense'
  AND tablename IN ('contacto', 'usuario');

-- ============================================================================
-- NOTA: Si prefieres una política más restrictiva, puedes usar:
-- ============================================================================
-- DROP POLICY IF EXISTS "service_role_can_read_contacto" ON joysense.contacto;
-- CREATE POLICY "service_role_can_read_contacto"
-- ON joysense.contacto
-- FOR SELECT
-- TO service_role
-- USING (
--   statusid = 1 
--   AND contactoid = current_setting('app.contactoid', true)::bigint
-- );
-- 
-- Pero esto requeriría pasar el contactoid como variable de sesión,
-- lo cual es más complejo. La política simple de arriba es suficiente
-- para el caso de uso de la Edge Function.
-- ============================================================================

