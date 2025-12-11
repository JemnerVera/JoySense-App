-- ============================================================================
-- ELIMINAR WRAPPER: public.fn_get_table_metadata
-- ============================================================================
-- Este script elimina la función wrapper en public que ya no es necesaria
-- porque ahora accedemos directamente a joysense.fn_get_table_metadata
-- usando .schema('joysense').rpc()
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar que existe el wrapper y sus permisos
-- ============================================================================
-- Verificar que existe la función
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'fn_get_table_metadata';

-- Verificar permisos otorgados (opcional, solo para referencia)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    r.rolname as grantee,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND p.proname = 'fn_get_table_metadata'
  AND r.rolname IN ('authenticated', 'anon', 'service_role')
ORDER BY r.rolname;

-- ============================================================================
-- PASO 2: Eliminar la función wrapper
-- ============================================================================
-- Eliminar la función wrapper de public (ya no es necesaria)
DROP FUNCTION IF EXISTS public.fn_get_table_metadata(text);

-- ============================================================================
-- PASO 3: Verificar que se eliminó correctamente
-- ============================================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'fn_get_table_metadata';
-- Debe retornar 0 filas

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. La función original joysense.fn_get_table_metadata NO se elimina,
--    solo se elimina el wrapper en public que ya no es necesario.
-- 
-- 2. Al ejecutar DROP FUNCTION, PostgreSQL elimina automáticamente:
--    - La función
--    - Todos los permisos (GRANT) otorgados a la función
--    - El comentario (COMMENT) asociado
--    No es necesario hacer REVOKE explícito antes de eliminar.
-- 
-- 3. El backend ahora accede directamente usando:
--    supabase.schema('joysense').rpc('fn_get_table_metadata', params)
-- ============================================================================
