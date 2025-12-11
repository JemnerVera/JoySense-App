-- ============================================================================
-- OTORGAR PERMISOS A joysense.fn_get_table_metadata
-- ============================================================================
-- Script para verificar y otorgar permisos de ejecución a la función
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar permisos actuales
-- ============================================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    r.rolname as grantee,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'joysense'
  AND p.proname = 'fn_get_table_metadata'
  AND r.rolname IN ('authenticated', 'anon', 'service_role', 'authenticator')
ORDER BY r.rolname;

-- ============================================================================
-- PASO 2: Otorgar permisos de ejecución
-- ============================================================================
-- Otorgar permisos a los roles necesarios para que puedan ejecutar la función

GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO authenticated;
GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO service_role;
GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO anon;

-- ============================================================================
-- PASO 3: Verificar permisos después de otorgarlos
-- ============================================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    r.rolname as grantee,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'joysense'
  AND p.proname = 'fn_get_table_metadata'
  AND r.rolname IN ('authenticated', 'anon', 'service_role', 'authenticator')
ORDER BY r.rolname;

-- ============================================================================
-- PASO 4: Probar llamada directa (debería funcionar ahora)
-- ============================================================================
SELECT joysense.fn_get_table_metadata('pais') as resultado_directo;

-- ============================================================================
-- NOTA:
-- ============================================================================
-- Aunque otorgues permisos a la función en joysense, PostgREST (REST API)
-- aún solo puede llamar funciones de 'public'. Por eso necesitas el wrapper.
-- 
-- Estos permisos son útiles si:
-- 1. Accedes directamente a PostgreSQL (no vía REST API)
-- 2. El wrapper en public necesita llamar a la función en joysense
-- ============================================================================


