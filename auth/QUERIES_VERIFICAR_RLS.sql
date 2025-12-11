-- ============================================================================
-- QUERIES PARA VERIFICAR POLÍTICAS RLS
-- ============================================================================
-- Ejecutar estas queries en Supabase SQL Editor para diagnosticar el problema
-- ============================================================================

-- ============================================================================
-- QUERY 1: Ver todas las políticas RLS de las tablas de geografía
-- ============================================================================
-- Esta query muestra todas las políticas RLS activas para pais, empresa, fundo
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename IN ('pais', 'empresa', 'fundo', 'ubicacion', 'entidad')
ORDER BY tablename, policyname;

-- ============================================================================
-- QUERY 2: Comparar políticas entre pais (que funciona) y empresa/fundo (que no funcionan)
-- ============================================================================
-- Esta query compara las políticas de pais vs empresa/fundo para encontrar diferencias
WITH pais_policies AS (
    SELECT 
        tablename,
        policyname,
        cmd,
        qual,
        with_check,
        roles
    FROM pg_policies
    WHERE schemaname = 'joysense' AND tablename = 'pais'
),
empresa_fundo_policies AS (
    SELECT 
        tablename,
        policyname,
        cmd,
        qual,
        with_check,
        roles
    FROM pg_policies
    WHERE schemaname = 'joysense' AND tablename IN ('empresa', 'fundo')
)
SELECT 
    'PAIS (FUNCIONA)' as tipo,
    tablename,
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pais_policies
UNION ALL
SELECT 
    'EMPRESA/FUNDO (NO FUNCIONA)' as tipo,
    tablename,
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM empresa_fundo_policies
ORDER BY tipo, tablename, policyname;

-- ============================================================================
-- QUERY 3: Verificar si RLS está habilitado en las tablas
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'joysense'
  AND tablename IN ('pais', 'empresa', 'fundo', 'ubicacion', 'entidad')
ORDER BY tablename;

-- ============================================================================
-- QUERY 4: Verificar permisos GRANT en las tablas
-- ============================================================================
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'joysense'
  AND table_name IN ('pais', 'empresa', 'fundo', 'ubicacion', 'entidad')
  AND grantee IN ('authenticated', 'anon', 'authenticator')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- QUERY 5: Verificar si hay diferencias en los triggers o funciones relacionadas
-- ============================================================================
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'joysense'
  AND event_object_table IN ('pais', 'empresa', 'fundo')
ORDER BY event_object_table, trigger_name;
