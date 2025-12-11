-- ============================================================================
-- VERIFICACIÓN: Permisos y estructura de perfil_geografia_permiso
-- ============================================================================
-- Ejecutar estos queries para diagnosticar el problema del error 500
-- ============================================================================

-- ============================================================================
-- QUERY 1: Verificar permisos GRANT en la tabla
-- ============================================================================
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'joysense'
  AND table_name = 'perfil_geografia_permiso'
  AND grantee IN ('authenticated', 'anon', 'authenticator', 'service_role')
ORDER BY grantee, privilege_type;

-- ============================================================================
-- QUERY 2: Verificar estructura de la tabla
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'joysense'
  AND table_name = 'perfil_geografia_permiso'
ORDER BY ordinal_position;

-- ============================================================================
-- QUERY 3: Verificar si hay datos en la tabla
-- ============================================================================
SELECT COUNT(*) as total_registros
FROM joysense.perfil_geografia_permiso;

-- ============================================================================
-- QUERY 4: Verificar constraint CHECK
-- ============================================================================
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'joysense.perfil_geografia_permiso'::regclass
  AND contype = 'c';

-- ============================================================================
-- QUERY 5: Intentar SELECT directo (para verificar si el problema es de acceso)
-- ============================================================================
-- Ejecutar como usuario autenticado
SELECT * FROM joysense.perfil_geografia_permiso LIMIT 5;

-- ============================================================================
-- QUERY 6: Verificar si el problema es con el ordenamiento
-- ============================================================================
-- Probar ordenamiento por permisoid
SELECT * FROM joysense.perfil_geografia_permiso ORDER BY permisoid LIMIT 5;

-- Probar ordenamiento por datecreated
SELECT * FROM joysense.perfil_geografia_permiso ORDER BY datecreated LIMIT 5;

-- ============================================================================
-- SOLUCIÓN: Otorgar permisos si faltan
-- ============================================================================
-- Si el QUERY 1 muestra que faltan permisos, ejecutar esto:

-- GRANT SELECT, INSERT, UPDATE, DELETE ON joysense.perfil_geografia_permiso TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON joysense.perfil_geografia_permiso TO service_role;
-- GRANT USAGE, SELECT ON SEQUENCE joysense.perfil_geografia_permiso_permisoid_seq TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE joysense.perfil_geografia_permiso_permisoid_seq TO service_role;
