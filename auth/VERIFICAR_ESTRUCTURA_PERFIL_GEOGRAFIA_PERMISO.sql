-- ============================================================================
-- VERIFICAR ESTRUCTURA Y PERMISOS: perfil_geografia_permiso
-- ============================================================================
-- Script para diagnosticar problemas con la tabla perfil_geografia_permiso
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar estructura de la tabla
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
-- PASO 2: Verificar si existe la columna datecreated
-- ============================================================================
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'joysense'
  AND table_name = 'perfil_geografia_permiso'
  AND column_name IN ('datecreated', 'datemodified', 'permisoid');

-- ============================================================================
-- PASO 3: Verificar permisos GRANT en la tabla
-- ============================================================================
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'joysense'
  AND table_name = 'perfil_geografia_permiso'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- PASO 4: Verificar si hay datos en la tabla
-- ============================================================================
SELECT COUNT(*) as total_registros
FROM joysense.perfil_geografia_permiso;

-- ============================================================================
-- PASO 5: Probar SELECT directo (sin paginación)
-- ============================================================================
SELECT *
FROM joysense.perfil_geografia_permiso
LIMIT 5;

-- ============================================================================
-- PASO 6: Probar SELECT con ORDER BY permisoid
-- ============================================================================
SELECT *
FROM joysense.perfil_geografia_permiso
ORDER BY permisoid
LIMIT 5;

-- ============================================================================
-- PASO 7: Verificar foreign keys y relaciones
-- ============================================================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'joysense'
  AND tc.table_name = 'perfil_geografia_permiso';

-- ============================================================================
-- PASO 8: Verificar si hay problemas con el schema
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'joysense'
  AND tablename = 'perfil_geografia_permiso';
