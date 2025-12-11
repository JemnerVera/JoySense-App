-- ============================================================================
-- TEST: Acceso directo a joysense.fn_get_table_metadata
-- ============================================================================
-- Script simple para verificar si se puede llamar la función directamente
-- desde el schema joysense sin necesidad del wrapper en public
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar que la función existe en joysense
-- ============================================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'joysense'
  AND p.proname = 'fn_get_table_metadata';

-- ============================================================================
-- PASO 2: Intentar llamar la función directamente desde joysense
-- ============================================================================
-- Esto debería funcionar si tienes permisos directos a PostgreSQL
SELECT joysense.fn_get_table_metadata('pais') as resultado_directo;

-- ============================================================================
-- PASO 3: Verificar permisos GRANT en la función
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
-- PASO 4: Comparar con el wrapper en public
-- ============================================================================
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
  AND r.rolname IN ('authenticated', 'anon', 'service_role', 'authenticator')
ORDER BY r.rolname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Si el PASO 2 funciona: La función es accesible directamente desde PostgreSQL
-- Si el PASO 2 falla: Necesitas el wrapper en public para PostgREST
-- 
-- PostgREST (REST API) solo puede llamar funciones de 'public', 
-- pero PostgreSQL directo puede llamar funciones de cualquier schema
-- ============================================================================


