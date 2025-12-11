-- ============================================================================
-- VERIFICAR DATOS Y CONSTRAINTS: perfil_geografia_permiso
-- ============================================================================
-- Script para diagnosticar problemas con datos faltantes y entradas inválidas
-- ============================================================================

-- ============================================================================
-- PASO 1: Ver todos los registros ordenados por permisoid
-- ============================================================================
SELECT 
    permisoid,
    perfilid,
    paisid,
    empresaid,
    fundoid,
    ubicacionid,
    puede_ver,
    puede_insertar,
    puede_actualizar,
    statusid,
    usercreatedid,
    datecreated
FROM joysense.perfil_geografia_permiso
ORDER BY permisoid;

-- ============================================================================
-- PASO 2: Verificar constraints CHECK en la tabla
-- ============================================================================
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'joysense.perfil_geografia_permiso'::regclass
  AND contype = 'c'
ORDER BY conname;

-- ============================================================================
-- PASO 3: Buscar registros con país Y empresa (posible violación de constraint)
-- ============================================================================
SELECT 
    permisoid,
    perfilid,
    paisid,
    empresaid,
    fundoid,
    ubicacionid
FROM joysense.perfil_geografia_permiso
WHERE paisid IS NOT NULL 
  AND empresaid IS NOT NULL
ORDER BY permisoid;

-- ============================================================================
-- PASO 4: Contar registros por combinación de campos
-- ============================================================================
SELECT 
    CASE 
        WHEN paisid IS NOT NULL THEN 'Solo País'
        WHEN empresaid IS NOT NULL THEN 'Solo Empresa'
        WHEN fundoid IS NOT NULL THEN 'Solo Fundo'
        WHEN ubicacionid IS NOT NULL THEN 'Solo Ubicación'
        WHEN paisid IS NOT NULL AND empresaid IS NOT NULL THEN 'País + Empresa (INVÁLIDO)'
        ELSE 'Sin geografía'
    END AS tipo_permiso,
    COUNT(*) as cantidad
FROM joysense.perfil_geografia_permiso
GROUP BY 
    CASE 
        WHEN paisid IS NOT NULL THEN 'Solo País'
        WHEN empresaid IS NOT NULL THEN 'Solo Empresa'
        WHEN fundoid IS NOT NULL THEN 'Solo Fundo'
        WHEN ubicacionid IS NOT NULL THEN 'Solo Ubicación'
        WHEN paisid IS NOT NULL AND empresaid IS NOT NULL THEN 'País + Empresa (INVÁLIDO)'
        ELSE 'Sin geografía'
    END
ORDER BY cantidad DESC;

-- ============================================================================
-- PASO 5: Verificar total de registros
-- ============================================================================
SELECT COUNT(*) as total_registros
FROM joysense.perfil_geografia_permiso;

-- ============================================================================
-- PASO 6: Verificar si hay registros con permisoid 3, 4, 5
-- ============================================================================
SELECT 
    permisoid,
    perfilid,
    paisid,
    empresaid,
    fundoid,
    ubicacionid
FROM joysense.perfil_geografia_permiso
WHERE permisoid IN (3, 4, 5)
ORDER BY permisoid;
