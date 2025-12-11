-- ============================================================================
-- SCRIPT SIMPLIFICADO: Insertar Permisos de Empresa y Fundo
-- ============================================================================
-- Este script inserta permisos para el perfil 1 (Administrador)
-- en todas las empresas y fundos existentes
-- ============================================================================
-- 
-- Datos esperados:
-- - 4 empresas (empresaid 1-4) para paisid 1
-- - 10 fundos (fundoid 1-10)
-- ============================================================================

-- ============================================================================
-- INSERTAR PERMISOS PARA EMPRESAS
-- ============================================================================

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
    1,                  -- perfilid = 1 (Administrador)
    e.empresaid,        -- Cada empresa existente (1-4)
    true,               -- puede_ver
    true,               -- puede_insertar
    true,               -- puede_actualizar
    1,                  -- statusid activo
    1                   -- usercreatedid
FROM joysense.empresa e
WHERE e.statusid = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.perfil_geografia_permiso pgp
      WHERE pgp.perfilid = 1
        AND pgp.empresaid = e.empresaid
        AND pgp.statusid = 1
  );

-- ============================================================================
-- INSERTAR PERMISOS PARA FUNDOS
-- ============================================================================

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
    1,                  -- perfilid = 1 (Administrador)
    f.fundoid,          -- Cada fundo existente (1-10)
    true,               -- puede_ver
    true,               -- puede_insertar
    true,               -- puede_actualizar
    1,                  -- statusid activo
    1                   -- usercreatedid
FROM joysense.fundo f
WHERE f.statusid = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.perfil_geografia_permiso pgp
      WHERE pgp.perfilid = 1
        AND pgp.fundoid = f.fundoid
        AND pgp.statusid = 1
  );

-- ============================================================================
-- VERIFICACIÓN RÁPIDA
-- ============================================================================

-- Contar permisos insertados
SELECT 
    'PAIS' as nivel,
    COUNT(*) as total
FROM joysense.perfil_geografia_permiso
WHERE perfilid = 1 AND statusid = 1 AND paisid IS NOT NULL

UNION ALL

SELECT 
    'EMPRESA' as nivel,
    COUNT(*) as total
FROM joysense.perfil_geografia_permiso
WHERE perfilid = 1 AND statusid = 1 AND empresaid IS NOT NULL

UNION ALL

SELECT 
    'FUNDO' as nivel,
    COUNT(*) as total
FROM joysense.perfil_geografia_permiso
WHERE perfilid = 1 AND statusid = 1 AND fundoid IS NOT NULL;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- nivel   | total
-- --------+------
-- PAIS    | 1
-- EMPRESA | 4
-- FUNDO   | 10
-- ============================================================================
