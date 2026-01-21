-- FIX PARA RLS DE TABLAS DE GEOGRAFÍA
-- ======================================
-- Jerarquía: País (1) → Empresa (2) → Fundo (3) → Ubicación (4) → Nodo (5) → Localización (6)

-- Problema identificado:
-- La política RLS de fundo es demasiado compleja y restrictiva
-- Las tablas de geografía no siguen el patrón consistente de herencia de permisos

-- SOLUCIÓN PROPUESTA:
-- Políticas RLS consistentes que siguen la jerarquía geográfica completa

-- 1. POLÍTICA RLS PARA FUNDO (permite herencia de empresa y país)
ALTER POLICY "rls_fundo_sel_auth" ON "joysense"."fundo"
TO authenticated
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(3::bigint, fundoid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(2::bigint, empresaid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(1::bigint, (
    SELECT p.paisid FROM joysense.empresa e
    JOIN joysense.pais p ON p.paisid = e.paisid
    WHERE e.empresaid = fundo.empresaid
  )::bigint, joysense.op_ver())
);

-- 2. POLÍTICA RLS PARA UBICACION (herencia: ubicación → fundo → empresa → país)
ALTER POLICY "rls_ubicacion_sel_auth" ON "joysense"."ubicacion"
TO authenticated
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(4::bigint, ubicacionid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(3::bigint, fundoid::bigint, joysense.op_ver())
  OR EXISTS (
    SELECT 1 FROM joysense.fundo f
    JOIN joysense.empresa e ON e.empresaid = f.empresaid
    JOIN joysense.pais p ON p.paisid = e.paisid
    WHERE f.fundoid = ubicacion.fundoid
      AND (
        joysense.fn_tiene_permiso_geo_objeto(2::bigint, f.empresaid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(1::bigint, p.paisid::bigint, joysense.op_ver())
      )
  )
);

-- 3. POLÍTICA RLS PARA NODO (herencia: nodo → ubicación → fundo → empresa → país)
ALTER POLICY "rls_nodo_sel_auth" ON "joysense"."nodo"
TO authenticated
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(5::bigint, nodoid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(4::bigint, ubicacionid::bigint, joysense.op_ver())
  OR EXISTS (
    SELECT 1 FROM joysense.ubicacion ub
    JOIN joysense.fundo f ON f.fundoid = ub.fundoid
    JOIN joysense.empresa e ON e.empresaid = f.empresaid
    JOIN joysense.pais p ON p.paisid = e.paisid
    WHERE ub.ubicacionid = nodo.ubicacionid
      AND (
        joysense.fn_tiene_permiso_geo_objeto(3::bigint, f.fundoid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(2::bigint, f.empresaid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(1::bigint, p.paisid::bigint, joysense.op_ver())
      )
  )
);

-- 4. POLÍTICA RLS PARA LOCALIZACION (herencia: localización → nodo → ubicación → fundo → empresa → país)
ALTER POLICY "rls_localizacion_sel_auth" ON "joysense"."localizacion"
TO authenticated
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(6::bigint, localizacionid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(5::bigint, nodoid::bigint, joysense.op_ver())
  OR EXISTS (
    SELECT 1
    FROM joysense.nodo n
    JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
    JOIN joysense.fundo f ON f.fundoid = ub.fundoid
    JOIN joysense.empresa e ON e.empresaid = f.empresaid
    JOIN joysense.pais p ON p.paisid = e.paisid
    WHERE n.nodoid = localizacion.nodoid
      AND (
        joysense.fn_tiene_permiso_geo_objeto(4::bigint, ub.ubicacionid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(3::bigint, f.fundoid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(2::bigint, e.empresaid::bigint, joysense.op_ver())
        OR joysense.fn_tiene_permiso_geo_objeto(1::bigint, p.paisid::bigint, joysense.op_ver())
      )
  )
);

-- APLICAR LOS CAMBIOS:
-- 1. Ejecutar este script en la base de datos
-- 2. Verificar que la jerarquía País→Empresa→Fundo→Ubicación→Nodo→Localización funcione
-- 3. Probar consultas a todas las tablas geográficas
-- 4. Usar diagnostico_permisos.sql para verificar funcionamiento