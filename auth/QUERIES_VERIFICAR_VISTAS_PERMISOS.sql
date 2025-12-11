-- ============================================================================
-- QUERIES PARA VERIFICAR VISTAS DE PERMISOS
-- ============================================================================
-- Estas queries verifican si las vistas de permisos tienen datos para el usuario
-- ============================================================================

-- ============================================================================
-- QUERY 1: Ver estructura de las vistas de permisos
-- ============================================================================
SELECT 
    table_schema,
    table_name as vista_nombre,
    view_definition
FROM information_schema.views
WHERE table_schema = 'joysense'
  AND table_name IN ('v_permiso_pais', 'v_permiso_empresa', 'v_permiso_fundo', 'v_permiso_ubicacion')
ORDER BY table_name;

-- ============================================================================
-- QUERY 2: Ver cuántos registros hay en cada vista de permisos
-- ============================================================================
-- IMPORTANTE: Reemplaza 'TU_USER_UUID_AQUI' con el UUID del usuario autenticado
-- Puedes obtenerlo de: SELECT id FROM auth.users WHERE email = 'administrador@joysense.com';

-- Primero, obtén el UUID del usuario:
SELECT 
    id as user_uuid,
    email
FROM auth.users
WHERE email IN ('administrador@joysense.com', 'admin@joysense.com')
ORDER BY email;

-- Luego, con ese UUID, ejecuta estas queries (reemplaza 'TU_USER_UUID_AQUI'):
-- ============================================================================
-- QUERY 2A: Ver permisos en v_permiso_pais (que funciona)
-- ============================================================================
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN puede_ver THEN 1 END) as puede_ver_count,
    COUNT(CASE WHEN puede_insertar THEN 1 END) as puede_insertar_count,
    COUNT(CASE WHEN puede_actualizar THEN 1 END) as puede_actualizar_count
FROM joysense.v_permiso_pais
WHERE useruuid = 'TU_USER_UUID_AQUI';  -- Reemplaza con el UUID del usuario

-- ============================================================================
-- QUERY 2B: Ver permisos en v_permiso_empresa (que NO funciona)
-- ============================================================================
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN puede_ver THEN 1 END) as puede_ver_count,
    COUNT(CASE WHEN puede_insertar THEN 1 END) as puede_insertar_count,
    COUNT(CASE WHEN puede_actualizar THEN 1 END) as puede_actualizar_count
FROM joysense.v_permiso_empresa
WHERE useruuid = 'TU_USER_UUID_AQUI';  -- Reemplaza con el UUID del usuario

-- ============================================================================
-- QUERY 2C: Ver permisos en v_permiso_fundo (que NO funciona)
-- ============================================================================
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN puede_ver THEN 1 END) as puede_ver_count,
    COUNT(CASE WHEN puede_insertar THEN 1 END) as puede_insertar_count,
    COUNT(CASE WHEN puede_actualizar THEN 1 END) as puede_actualizar_count
FROM joysense.v_permiso_fundo
WHERE useruuid = 'TU_USER_UUID_AQUI';  -- Reemplaza con el UUID del usuario

-- ============================================================================
-- QUERY 3: Ver todos los registros de permisos para el usuario (muestra detalles)
-- ============================================================================
-- Reemplaza 'TU_USER_UUID_AQUI' con el UUID del usuario

-- Permisos de PAIS (que funciona):
SELECT 'PAIS' as tabla, * FROM joysense.v_permiso_pais WHERE useruuid = 'TU_USER_UUID_AQUI';

-- Permisos de EMPRESA (que NO funciona):
SELECT 'EMPRESA' as tabla, * FROM joysense.v_permiso_empresa WHERE useruuid = 'TU_USER_UUID_AQUI';

-- Permisos de FUNDO (que NO funciona):
SELECT 'FUNDO' as tabla, * FROM joysense.v_permiso_fundo WHERE useruuid = 'TU_USER_UUID_AQUI';

-- ============================================================================
-- QUERY 4: Comparar estructura de las vistas (para ver si hay diferencias)
-- ============================================================================
SELECT 
    table_name as vista,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'joysense'
  AND table_name IN ('v_permiso_pais', 'v_permiso_empresa', 'v_permiso_fundo')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- QUERY 5: Verificar si hay datos en las tablas base que alimentan las vistas
-- ============================================================================
-- Esta query ayuda a entender de dónde vienen los datos de las vistas
-- (puede que necesites ajustar los nombres de las tablas según tu esquema)

SELECT 
    'pais' as tabla,
    COUNT(*) as total_registros
FROM joysense.pais
UNION ALL
SELECT 
    'empresa' as tabla,
    COUNT(*) as total_registros
FROM joysense.empresa
UNION ALL
SELECT 
    'fundo' as tabla,
    COUNT(*) as total_registros
FROM joysense.fundo;
