-- ===========================================
-- DIAGNÓSTICO COMPLETO DE RLS ACTUAL
-- ===========================================
-- Este script analiza el estado actual de las políticas RLS
-- y ayuda a entender por qué empresa funciona y las otras no

-- 1. VER USUARIO ACTUAL Y SUS EMPRESAS
SELECT
  '=== USUARIO ACTUAL ===' as seccion,
  auth.uid() as useruuid,
  joysense.fn_usuarioid_actual() as usuarioid,
  u.login,
  u.firstname || ' ' || u.lastname as nombre_completo,
  joysense.fn_es_admin_global() as es_admin_global
FROM joysense.usuario u
WHERE u.useruuid = auth.uid() AND u.statusid = 1;

-- 2. EMPRESAS ASIGNADAS AL USUARIO
SELECT
  '=== EMPRESAS ASIGNADAS ===' as seccion,
  ue.empresaid,
  e.empresa,
  e.paisid,
  p.pais,
  ue.is_default,
  ue.statusid as empresa_asignada
FROM joysense.usuario_empresa ue
JOIN joysense.empresa e ON e.empresaid = ue.empresaid
JOIN joysense.pais p ON p.paisid = e.paisid
WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
  AND ue.statusid = 1;

-- 3. PERMISOS ESPECÍFICOS DEL USUARIO
SELECT
  '=== PERMISOS ESPECÍFICOS ===' as seccion,
  v.origenid,
  v.fuenteid,
  v.objetoid,
  v.puede_ver,
  v.puede_insertar,
  v.puede_actualizar,
  v.puede_eliminar,
  CASE v.fuenteid
    WHEN 1 THEN 'País'
    WHEN 2 THEN 'Empresa'
    WHEN 3 THEN 'Fundo'
    WHEN 4 THEN 'Ubicación'
    WHEN 5 THEN 'Nodo'
    WHEN 6 THEN 'Localización'
    ELSE 'Desconocido'
  END as tipo_objeto
FROM joysense.v_permiso_usuario v
WHERE v.useruuid = auth.uid()
ORDER BY v.fuenteid, v.objetoid;

-- 4. PRUEBA DE PERMISOS EN EMPRESA (DEBERÍA FUNCIONAR)
SELECT
  '=== PRUEBA EMPRESA ===' as seccion,
  e.empresaid,
  e.empresa,
  joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) as permiso_directo_empresa,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_heredado_pais,
  CASE
    WHEN joysense.fn_es_admin_global() THEN 'ADMIN_GLOBAL'
    WHEN joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) THEN 'PERMISO_DIRECTO'
    WHEN joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) THEN 'PERMISO_HEREDADO'
    ELSE 'SIN_PERMISOS'
  END as razon_acceso,
  CASE
    WHEN joysense.fn_es_admin_global() OR joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    THEN '✅ ACCESIBLE' ELSE '❌ NO_ACCESIBLE'
  END as resultado
FROM joysense.empresa e
LIMIT 5;

-- 5. PRUEBA DE PERMISOS EN FUNDO (PROBLEMÁTICO)
SELECT
  '=== PRUEBA FUNDO ===' as seccion,
  f.fundoid,
  f.fundo,
  e.empresa,
  f.empresaid,
  -- Verificar cada parte de la condición RLS compleja
  joysense.fn_es_admin_global() as admin_global,
  EXISTS (
    SELECT 1 FROM joysense.usuario_empresa ue
    WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
      AND ue.empresaid = f.empresaid
      AND ue.statusid = 1
  ) as usuario_asignado_empresa,
  joysense.fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), f.empresaid) as tiene_permisos_finos,
  joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f.fundoid) as puede_ver_subtree,
  -- Condición completa (como está en RLS)
  (
    joysense.fn_es_admin_global()
    OR (
      EXISTS (SELECT 1 FROM joysense.usuario_empresa ue
             WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
               AND ue.empresaid = f.empresaid
               AND ue.statusid = 1)
      AND (
        NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), f.empresaid)
        OR joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f.fundoid)
      )
    )
  ) as resultado_rls_actual,
  -- Comparación con patrón simple (como empresa)
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as resultado_rls_simple
FROM joysense.fundo f
JOIN joysense.empresa e ON e.empresaid = f.empresaid
LIMIT 5;

-- 6. PRUEBA DE PERMISOS EN UBICACIÓN (PROBLEMÁTICO)
SELECT
  '=== PRUEBA UBICACIÓN ===' as seccion,
  ub.ubicacionid,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  -- Condición RLS actual (compleja)
  (
    joysense.fn_es_admin_global()
    OR EXISTS (
      SELECT 1 FROM (joysense.fundo f2
        JOIN joysense.usuario_empresa ue ON ue.empresaid = f2.empresaid
                                      AND ue.usuarioid = joysense.fn_usuarioid_actual()
                                      AND ue.statusid = 1)
      WHERE f2.fundoid = ub.fundoid
        AND (
          NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), f2.empresaid)
          OR joysense.fn_usuario_puede_ver_subtree_ubicacion(auth.uid(), ub.ubicacionid)
          OR joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f2.fundoid)
        )
    )
  ) as resultado_rls_actual,
  -- Patrón simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(4, ub.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as resultado_rls_simple
FROM joysense.ubicacion ub
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
LIMIT 5;

-- 7. PRUEBA DE PERMISOS EN NODO (PROBLEMÁTICO)
SELECT
  '=== PRUEBA NODO ===' as seccion,
  n.nodoid,
  n.nodo,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  -- Condición RLS actual (ultra-compleja)
  (
    joysense.fn_es_admin_global()
    OR EXISTS (
      SELECT 1 FROM ((joysense.ubicacion ub2
        JOIN joysense.fundo f2 ON f2.fundoid = ub2.fundoid)
        JOIN joysense.usuario_empresa ue ON ue.empresaid = f2.empresaid
                                        AND ue.usuarioid = joysense.fn_usuarioid_actual()
                                        AND ue.statusid = 1)
      WHERE ub2.ubicacionid = n.ubicacionid
        AND (
          NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), f2.empresaid)
          OR joysense.fn_usuario_puede_ver_subtree_nodo(auth.uid(), n.nodoid)
          OR joysense.fn_usuario_puede_ver_subtree_ubicacion(auth.uid(), ub2.ubicacionid)
          OR joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f2.fundoid)
        )
    )
  ) as resultado_rls_actual,
  -- Patrón simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(5, n.nodoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as resultado_rls_simple
FROM joysense.nodo n
JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
LIMIT 5;

-- 8. PRUEBA DE PERMISOS EN LOCALIZACIÓN (MEJOR IMPLEMENTADO)
SELECT
  '=== PRUEBA LOCALIZACIÓN ===' as seccion,
  l.localizacionid,
  l.localizacion,
  n.nodo,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  -- Condición RLS actual (usa función centralizada)
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_usuario_puede_operar_localizacion(l.localizacionid, l.nodoid, 1)
  ) as resultado_rls_actual,
  -- Patrón simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(6, l.localizacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(5, l.nodoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as resultado_rls_simple
FROM joysense.localizacion l
JOIN joysense.nodo n ON n.nodoid = l.nodoid
JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
LIMIT 5;

-- 9. POLÍTICAS RLS ACTIVAS EN EL SISTEMA
SELECT
  '=== POLÍTICAS RLS ACTIVAS ===' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN qual LIKE '%fn_es_admin_global()%' THEN '✅ Simple (admin + directos)'
    WHEN qual LIKE '%EXISTS%usuario_empresa%' THEN '❌ Compleja (joins múltiples)'
    WHEN qual LIKE '%fn_usuario_puede_operar%' THEN '⚠️ Funciones complejas'
    ELSE '❓ Otro patrón'
  END as patron_analisis
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename IN ('pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion')
ORDER BY tablename, policyname;

-- 10. RESUMEN EJECUTIVO
SELECT
  '=== RESUMEN EJECUTIVO ===' as seccion,
  COUNT(*) as total_politicas,
  COUNT(CASE WHEN qual LIKE '%fn_es_admin_global()%' THEN 1 END) as politicas_simples,
  COUNT(CASE WHEN qual LIKE '%EXISTS%usuario_empresa%' THEN 1 END) as politicas_complejas,
  COUNT(CASE WHEN qual LIKE '%fn_usuario_puede_operar%' THEN 1 END) as politicas_funciones
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename IN ('pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion');