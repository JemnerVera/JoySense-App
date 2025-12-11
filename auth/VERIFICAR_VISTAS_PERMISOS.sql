-- ============================================================================
-- VERIFICAR VISTAS DE PERMISOS PARA DIAGNÓSTICO DE LOGIN
-- ============================================================================
-- Este script verifica que las vistas de permisos funcionen correctamente
-- para el usuario que está intentando hacer login
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR QUE LAS VISTAS EXISTAN
-- ============================================================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'joysense'
  AND table_name LIKE 'v_permiso%'
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFICAR DEFINICIÓN DE v_permiso_pais
-- ============================================================================
SELECT 
    view_definition
FROM information_schema.views
WHERE table_schema = 'joysense'
  AND table_name = 'v_permiso_pais';

-- ============================================================================
-- 3. PROBAR QUERY DE v_permiso_pais CON EL USERUUID DEL USUARIO
-- ============================================================================
-- Esto simula lo que Supabase podría estar haciendo durante el login
SELECT 
    *
FROM joysense.v_permiso_pais
WHERE useruuid = 'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid;  -- Cambia por el useruuid del usuario

-- ============================================================================
-- 4. VERIFICAR QUE LA VISTA PUEDA ACCEDER A LAS TABLAS BASE
-- ============================================================================
-- Verificar que las tablas base existan y tengan datos
SELECT 
    'perfil_geografia_permiso' AS tabla,
    COUNT(*) AS total_registros
FROM joysense.perfil_geografia_permiso
WHERE statusid = 1
UNION ALL
SELECT 
    'usuarioperfil' AS tabla,
    COUNT(*) AS total_registros
FROM joysense.usuarioperfil
WHERE statusid = 1
UNION ALL
SELECT 
    'usuario' AS tabla,
    COUNT(*) AS total_registros
FROM joysense.usuario
WHERE statusid = 1;

-- ============================================================================
-- 5. VERIFICAR PERMISOS DE LAS VISTAS (RLS)
-- ============================================================================
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
  AND tablename LIKE 'v_permiso%'
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. PROBAR QUERY COMPLETA DE PERMISOS (simulando lo que hace RLS)
-- ============================================================================
-- Esta query simula lo que Supabase podría estar haciendo durante el login
WITH usuario_actual AS (
    SELECT 
        useruuid,
        usuarioid
    FROM joysense.usuario
    WHERE login = 'usuario.1@prueba.com'  -- Cambia por el email del usuario
),
perfiles_usuario AS (
    SELECT DISTINCT
        up.perfilid
    FROM joysense.usuarioperfil up
    JOIN usuario_actual ua ON up.usuarioid = ua.usuarioid
    WHERE up.statusid = 1
),
permisos_perfil AS (
    SELECT 
        pgp.paisid,
        pgp.empresaid,
        pgp.fundoid,
        pgp.ubicacionid,
        pgp.puede_ver,
        pgp.puede_insertar,
        pgp.puede_actualizar
    FROM joysense.perfil_geografia_permiso pgp
    JOIN perfiles_usuario pu ON pgp.perfilid = pu.perfilid
    WHERE pgp.statusid = 1
)
SELECT 
    'Permisos encontrados' AS resultado,
    COUNT(*) AS total
FROM permisos_perfil;

-- ============================================================================
-- 7. VERIFICAR SI HAY ERRORES EN LOS LOGS DE POSTGRES
-- ============================================================================
-- Nota: Esto requiere permisos de superusuario
-- Si tienes acceso, ejecuta esto para ver errores recientes:
/*
SELECT 
    log_time,
    error_severity,
    message
FROM pg_stat_statements
WHERE query LIKE '%v_permiso%'
ORDER BY log_time DESC
LIMIT 10;
*/

-- ============================================================================
-- 8. VERIFICAR CONFIGURACIÓN DEL SCHEMA EN SUPABASE
-- ============================================================================
-- Nota: Esto debe verificarse en Supabase Dashboard → Settings → API
-- El schema 'joysense' debe estar en la lista de "Exposed schemas"
-- 
-- Si el schema NO está expuesto, Supabase no podrá consultarlo durante el login
-- y causará el error "Database error querying schema"
--
-- Para verificar:
-- 1. Ve a Supabase Dashboard
-- 2. Settings → API
-- 3. Busca "Exposed schemas"
-- 4. Asegúrate de que 'joysense' esté en la lista
-- 5. Si no está, agrégalo y guarda

-- ============================================================================
-- SOLUCIÓN PROBABLE
-- ============================================================================
-- Si todas las queries anteriores funcionan correctamente, el problema más
-- probable es que el schema 'joysense' NO está expuesto en Supabase API Settings.
--
-- Pasos para solucionar:
-- 1. Ve a Supabase Dashboard
-- 2. Settings → API
-- 3. Busca "Exposed schemas" o "Schema exposure"
-- 4. Agrega 'joysense' a la lista de schemas expuestos
-- 5. Guarda los cambios
-- 6. Intenta hacer login nuevamente
--
-- ============================================================================
