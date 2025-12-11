-- ============================================================================
-- QUERIES PARA SOLUCIONAR EL PROBLEMA DE PERMISOS
-- ============================================================================
-- Estas queries ayudan a diagnosticar y solucionar el problema de permisos
-- ============================================================================

-- ============================================================================
-- QUERY 1: Ver qué permisos tiene actualmente el usuario administrador
-- ============================================================================
SELECT 
    pgp.permisoid,
    pgp.perfilid,
    p.perfil,
    pgp.paisid,
    pgp.empresaid,
    pgp.fundoid,
    pgp.ubicacionid,
    pgp.puede_ver,
    pgp.puede_insertar,
    pgp.puede_actualizar,
    pgp.statusid
FROM joysense.perfil_geografia_permiso pgp
JOIN joysense.perfil p ON p.perfilid = pgp.perfilid
JOIN joysense.usuarioperfil up ON up.perfilid = pgp.perfilid
JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
WHERE u.login IN ('administrador@joysense.com', 'admin@joysense.com')
  AND pgp.statusid = 1
  AND up.statusid = 1
ORDER BY 
    CASE WHEN pgp.paisid IS NOT NULL THEN 1 ELSE 2 END,
    CASE WHEN pgp.empresaid IS NOT NULL THEN 1 ELSE 2 END,
    CASE WHEN pgp.fundoid IS NOT NULL THEN 1 ELSE 2 END;

-- ============================================================================
-- QUERY 2: Ver qué empresas y fundos existen
-- ============================================================================
SELECT 
    'empresa' as tipo,
    empresaid as id,
    empresa as nombre,
    paisid
FROM joysense.empresa
WHERE statusid = 1
ORDER BY empresaid;

SELECT 
    'fundo' as tipo,
    fundoid as id,
    fundo as nombre,
    empresaid
FROM joysense.fundo
WHERE statusid = 1
ORDER BY fundoid;

-- ============================================================================
-- QUERY 3: Obtener el perfilid del usuario administrador
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.useruuid,
    up.perfilid,
    p.perfil
FROM joysense.usuario u
JOIN joysense.usuarioperfil up ON up.usuarioid = u.usuarioid
JOIN joysense.perfil p ON p.perfilid = up.perfilid
WHERE u.login IN ('administrador@joysense.com', 'admin@joysense.com')
  AND up.statusid = 1
ORDER BY u.login;

-- ============================================================================
-- QUERY 4: Insertar permisos para empresa (EJEMPLO - ajusta los valores)
-- ============================================================================
-- IMPORTANTE: Reemplaza PERFIL_ID y EMPRESA_ID con los valores reales
-- Obtén PERFIL_ID de la Query 3
-- Obtén EMPRESA_ID de la Query 2

-- Ejemplo para TODAS las empresas:
INSERT INTO joysense.perfil_geografia_permiso (
    perfilid,
    empresaid,
    puede_ver,
    puede_insertar,
    puede_actualizar,
    statusid,
    usercreatedid
)
SELECT 
    up.perfilid,        -- Perfil del administrador
    e.empresaid,        -- Cada empresa
    true,               -- puede_ver
    true,               -- puede_insertar
    true,               -- puede_actualizar
    1,                  -- statusid activo
    1                   -- usercreatedid
FROM joysense.usuarioperfil up
JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
CROSS JOIN joysense.empresa e
WHERE u.login IN ('administrador@joysense.com', 'admin@joysense.com')
  AND up.statusid = 1
  AND e.statusid = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.perfil_geografia_permiso pgp
      WHERE pgp.perfilid = up.perfilid
        AND pgp.empresaid = e.empresaid
        AND pgp.statusid = 1
  );

-- ============================================================================
-- QUERY 5: Insertar permisos para fundo (EJEMPLO - ajusta los valores)
-- ============================================================================
-- IMPORTANTE: Reemplaza PERFIL_ID y FUNDO_ID con los valores reales

-- Ejemplo para TODOS los fundos:
INSERT INTO joysense.perfil_geografia_permiso (
    perfilid,
    fundoid,
    puede_ver,
    puede_insertar,
    puede_actualizar,
    statusid,
    usercreatedid
)
SELECT 
    up.perfilid,        -- Perfil del administrador
    f.fundoid,          -- Cada fundo
    true,               -- puede_ver
    true,               -- puede_insertar
    true,               -- puede_actualizar
    1,                  -- statusid activo
    1                   -- usercreatedid
FROM joysense.usuarioperfil up
JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
CROSS JOIN joysense.fundo f
WHERE u.login IN ('administrador@joysense.com', 'admin@joysense.com')
  AND up.statusid = 1
  AND f.statusid = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.perfil_geografia_permiso pgp
      WHERE pgp.perfilid = up.perfilid
        AND pgp.fundoid = f.fundoid
        AND pgp.statusid = 1
  );

-- ============================================================================
-- QUERY 6: Verificar que las vistas ahora tienen datos
-- ============================================================================
-- Ejecuta estas queries DESPUÉS de insertar los permisos
-- Reemplaza 'TU_USER_UUID_AQUI' con el UUID del usuario

-- Ver permisos de pais (debería tener datos)
SELECT COUNT(*) as total_pais
FROM joysense.v_permiso_pais
WHERE useruuid = 'TU_USER_UUID_AQUI';

-- Ver permisos de empresa (debería tener datos después de insertar)
SELECT COUNT(*) as total_empresa
FROM joysense.v_permiso_empresa
WHERE useruuid = 'TU_USER_UUID_AQUI';

-- Ver permisos de fundo (debería tener datos después de insertar)
SELECT COUNT(*) as total_fundo
FROM joysense.v_permiso_fundo
WHERE useruuid = 'TU_USER_UUID_AQUI';
