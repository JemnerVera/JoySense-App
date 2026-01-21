-- ===========================================
-- DIAGNÓSTICO PARA USUARIO DEMO (SIMULADO)
-- ===========================================
-- Simula la situación del usuario demo@migivagroup.com
-- con permisos limitados según configuracion_permisos.txt

-- CONFIGURACIÓN DEL USUARIO DEMO:
-- - Usuario: demo@migivagroup.com (usuarioid: 4, useruuid: cb84a9ff-57f3-4570-a924-3c6a28fbaa71)
-- - Perfil: 6 (usuario limitado)
-- - Empresas asignadas: 1, 2, 3, 4, 5 (empresa 1 como default)
-- - Permisos específicos:
--   * País 1 (puede_ver: true)
--   * Empresa 1 (puede_ver: true)
--   * Fundo 1 (puede_ver: true)
--   * Ubicación NULL (todos, puede_ver: true)
--   * Nodo NULL (todos, puede_ver: true)
--   * Localización NULL (todos, puede_ver: true)

-- NOTA: Para simular correctamente, este script debe ejecutarse
-- con el contexto del usuario demo@migivagroup.com

-- 1. VERIFICACIÓN DE IDENTIDAD DEL USUARIO
SELECT
  '=== IDENTIDAD DEL USUARIO ===' as seccion,
  CASE
    WHEN auth.uid()::text = 'cb84a9ff-57f3-4570-a924-3c6a28fbaa71'
    THEN '✅ Usuario DEMO correcto'
    ELSE '❌ Usuario diferente - resultados pueden variar'
  END as verificacion_usuario,
  auth.uid() as useruuid_actual,
  'cb84a9ff-57f3-4570-a924-3c6a28fbaa71' as useruuid_esperado,
  joysense.fn_usuarioid_actual() as usuarioid_actual,
  4 as usuarioid_esperado,
  joysense.fn_es_admin_global() as es_admin_global;

-- 2. VERIFICACIÓN DE PERFIL ASIGNADO
SELECT
  '=== PERFIL ASIGNADO ===' as seccion,
  up.perfilid as perfil_actual,
  6 as perfil_esperado,
  CASE WHEN up.perfilid = 6 THEN '✅ Perfil DEMO correcto' ELSE '❌ Perfil diferente' END as verificacion_perfil,
  p.perfil as nombre_perfil,
  p.is_admin_global
FROM joysense.usuarioperfil up
JOIN joysense.perfil p ON p.perfilid = up.perfilid
WHERE up.usuarioid = joysense.fn_usuarioid_actual()
  AND up.statusid = 1;

-- 3. EMPRESAS ASIGNADAS (DEBERÍAN SER 1,2,3,4,5)
SELECT
  '=== EMPRESAS ASIGNADAS ===' as seccion,
  ue.empresaid,
  e.empresa,
  ue.is_default,
  CASE
    WHEN ue.empresaid IN (1,2,3,4,5) THEN '✅ Empresa esperada'
    ELSE '❌ Empresa NO esperada'
  END as verificacion
FROM joysense.usuario_empresa ue
JOIN joysense.empresa e ON e.empresaid = ue.empresaid
WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
  AND ue.statusid = 1
ORDER BY ue.empresaid;

-- 4. PERMISOS ESPECÍFICOS DEL USUARIO DEMO
SELECT
  '=== PERMISOS DEL USUARIO DEMO ===' as seccion,
  v.origenid,
  v.fuenteid,
  v.objetoid,
  v.puede_ver,
  v.puede_insertar,
  v.puede_actualizar,
  v.puede_eliminar,
  CASE v.fuenteid
    WHEN 1 THEN 'País ' || COALESCE(v.objetoid::text, 'TODOS')
    WHEN 2 THEN 'Empresa ' || COALESCE(v.objetoid::text, 'TODOS')
    WHEN 3 THEN 'Fundo ' || COALESCE(v.objetoid::text, 'TODOS')
    WHEN 4 THEN 'Ubicación ' || COALESCE(v.objetoid::text, 'TODOS')
    WHEN 5 THEN 'Nodo ' || COALESCE(v.objetoid::text, 'TODOS')
    WHEN 6 THEN 'Localización ' || COALESCE(v.objetoid::text, 'TODOS')
    ELSE 'Desconocido'
  END as descripcion_permiso,
  CASE
    WHEN (v.fuenteid = 1 AND v.objetoid = 1 AND v.puede_ver = true) THEN '✅ País 1 - OK'
    WHEN (v.fuenteid = 2 AND v.objetoid = 1 AND v.puede_ver = true) THEN '✅ Empresa 1 - OK'
    WHEN (v.fuenteid = 3 AND v.objetoid = 1 AND v.puede_ver = true) THEN '✅ Fundo 1 - OK'
    WHEN (v.fuenteid = 4 AND v.objetoid IS NULL AND v.puede_ver = true) THEN '✅ Ubicaciones TODAS - OK'
    WHEN (v.fuenteid = 5 AND v.objetoid IS NULL AND v.puede_ver = true) THEN '✅ Nodos TODOS - OK'
    WHEN (v.fuenteid = 6 AND v.objetoid IS NULL AND v.puede_ver = true) THEN '✅ Localizaciones TODAS - OK'
    ELSE '❌ Permiso NO esperado'
  END as verificacion_configuracion
FROM joysense.v_permiso_usuario v
WHERE v.useruuid = auth.uid()
ORDER BY v.fuenteid, v.objetoid;

-- 5. PRUEBA DE ACCESO A PAISES (SOLO PAÍS 1)
SELECT
  '=== PRUEBA ACCESO A PAÍSES ===' as seccion,
  p.paisid,
  p.pais,
  joysense.fn_tiene_permiso_geo_objeto(1, p.paisid, 1) as tiene_permiso,
  CASE
    WHEN p.paisid = 1 AND joysense.fn_tiene_permiso_geo_objeto(1, p.paisid, 1) THEN '✅ País 1 accesible (esperado)'
    WHEN p.paisid = 1 AND NOT joysense.fn_tiene_permiso_geo_objeto(1, p.paisid, 1) THEN '❌ País 1 NO accesible (ERROR)'
    WHEN p.paisid != 1 AND joysense.fn_tiene_permiso_geo_objeto(1, p.paisid, 1) THEN '⚠️ País extra accesible'
    WHEN p.paisid != 1 AND NOT joysense.fn_tiene_permiso_geo_objeto(1, p.paisid, 1) THEN '✅ País NO accesible (correcto)'
    ELSE '❓ Estado desconocido'
  END as resultado_esperado
FROM joysense.pais p
ORDER BY p.paisid;

-- 6. PRUEBA DE ACCESO A EMPRESAS (SOLO EMPRESA 1)
SELECT
  '=== PRUEBA ACCESO A EMPRESAS ===' as seccion,
  e.empresaid,
  e.empresa,
  p.pais,
  joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) as permiso_directo,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_heredado_pais,
  CASE
    WHEN e.empresaid = 1 AND (joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)) THEN '✅ Empresa 1 accesible (esperado)'
    WHEN e.empresaid = 1 AND NOT (joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)) THEN '❌ Empresa 1 NO accesible (ERROR)'
    WHEN e.empresaid != 1 AND (joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)) THEN '⚠️ Empresa extra accesible'
    WHEN e.empresaid != 1 AND NOT (joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1) OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)) THEN '✅ Empresa NO accesible (correcto)'
    ELSE '❓ Estado desconocido'
  END as resultado_esperado
FROM joysense.empresa e
JOIN joysense.pais p ON p.paisid = e.paisid
ORDER BY e.empresaid;

-- 7. PRUEBA DE ACCESO A FUNDOS (SOLO FUNDO 1)
SELECT
  '=== PRUEBA ACCESO A FUNDOS ===' as seccion,
  f.fundoid,
  f.fundo,
  e.empresa,
  f.empresaid,
  joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1) as permiso_directo_fundo,
  joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1) as permiso_por_empresa,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_por_pais,
  -- RLS actual (compleja)
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
  ) as rls_actual_resultado,
  -- RLS simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as rls_simple_resultado,
  CASE
    WHEN f.fundoid = 1 AND (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '✅ Fundo 1 accesible (esperado)'
    WHEN f.fundoid = 1 AND NOT (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '❌ Fundo 1 NO accesible (ERROR en patrón simple)'
    WHEN f.fundoid != 1 AND (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '⚠️ Fundo extra accesible'
    WHEN f.fundoid != 1 AND NOT (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '✅ Fundo NO accesible (correcto)'
    ELSE '❓ Estado desconocido'
  END as resultado_esperado_simple
FROM joysense.fundo f
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY f.fundoid
LIMIT 10;

-- 8. PRUEBA DE ACCESO A UBICACIONES (TODAS, debido a objetoid=NULL)
SELECT
  '=== PRUEBA ACCESO A UBICACIONES ===' as seccion,
  ub.ubicacionid,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  joysense.fn_tiene_permiso_geo_objeto(4, ub.ubicacionid, 1) as permiso_directo_ubicacion,
  joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1) as permiso_por_fundo,
  joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1) as permiso_por_empresa,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_por_pais,
  -- RLS actual (compleja)
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
  ) as rls_actual_resultado,
  -- RLS simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(4, ub.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as rls_simple_resultado,
  CASE
    WHEN (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(4, ub.ubicacionid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '✅ Ubicación accesible (esperado - permisos globales)'
    ELSE '❌ Ubicación NO accesible (ERROR)'
  END as resultado_esperado_simple
FROM joysense.ubicacion ub
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY ub.ubicacionid
LIMIT 10;

-- 9. PRUEBA DE ACCESO A NODOS (TODOS, debido a objetoid=NULL)
SELECT
  '=== PRUEBA ACCESO A NODOS ===' as seccion,
  n.nodoid,
  n.nodo,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  joysense.fn_tiene_permiso_geo_objeto(5, n.nodoid, 1) as permiso_directo_nodo,
  joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1) as permiso_por_ubicacion,
  joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1) as permiso_por_fundo,
  joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1) as permiso_por_empresa,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_por_pais,
  -- RLS actual (ultra-compleja)
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
  ) as rls_actual_resultado,
  -- RLS simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(5, n.nodoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as rls_simple_resultado,
  CASE
    WHEN (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(5, n.nodoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '✅ Nodo accesible (esperado - permisos globales)'
    ELSE '❌ Nodo NO accesible (ERROR)'
  END as resultado_esperado_simple
FROM joysense.nodo n
JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY n.nodoid
LIMIT 10;

-- 10. PRUEBA DE ACCESO A LOCALIZACIONES (TODAS, debido a objetoid=NULL)
SELECT
  '=== PRUEBA ACCESO A LOCALIZACIONES ===' as seccion,
  l.localizacionid,
  l.localizacion,
  n.nodo,
  ub.ubicacion,
  f.fundo,
  e.empresa,
  joysense.fn_tiene_permiso_geo_objeto(6, l.localizacionid, 1) as permiso_directo_localizacion,
  joysense.fn_tiene_permiso_geo_objeto(5, l.nodoid, 1) as permiso_por_nodo,
  joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1) as permiso_por_ubicacion,
  joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1) as permiso_por_fundo,
  joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1) as permiso_por_empresa,
  joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1) as permiso_por_pais,
  -- RLS actual (usa función centralizada)
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_usuario_puede_operar_localizacion(l.localizacionid, l.nodoid, 1)
  ) as rls_actual_resultado,
  -- RLS simple propuesto
  (
    joysense.fn_es_admin_global()
    OR joysense.fn_tiene_permiso_geo_objeto(6, l.localizacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(5, l.nodoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
    OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
  ) as rls_simple_resultado,
  CASE
    WHEN (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(6, l.localizacionid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(5, l.nodoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(4, n.ubicacionid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
    ) THEN '✅ Localización accesible (esperado - permisos globales)'
    ELSE '❌ Localización NO accesible (ERROR)'
  END as resultado_esperado_simple
FROM joysense.localizacion l
JOIN joysense.nodo n ON n.nodoid = l.nodoid
JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY l.localizacionid
LIMIT 10;

-- 11. RESUMEN EJECUTIVO PARA USUARIO DEMO
SELECT
  '=== RESUMEN EJECUTIVO - USUARIO DEMO ===' as seccion,
  COUNT(*) as total_registros_analizados,
  COUNT(CASE WHEN rls_actual_resultado THEN 1 END) as accesibles_rls_actual,
  COUNT(CASE WHEN rls_simple_resultado THEN 1 END) as accesibles_rls_simple,
  COUNT(CASE WHEN rls_actual_resultado != rls_simple_resultado THEN 1 END) as diferencias_resultados
FROM (
  SELECT true as rls_actual_resultado, true as rls_simple_resultado, 'pais' as tabla FROM joysense.pais LIMIT 1
  UNION ALL
  SELECT true as rls_actual_resultado, true as rls_simple_resultado, 'empresa' as tabla FROM joysense.empresa LIMIT 1
  UNION ALL
  SELECT
    CASE WHEN f.fundoid = 1 THEN (
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
    ) ELSE false END as rls_actual_resultado,
    CASE WHEN f.fundoid = 1 THEN (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, (SELECT p.paisid FROM joysense.empresa e JOIN joysense.pais p ON p.paisid = e.paisid WHERE e.empresaid = f.empresaid), 1)
    ) ELSE (
      joysense.fn_es_admin_global()
      OR joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
      OR joysense.fn_tiene_permiso_geo_objeto(1, (SELECT p.paisid FROM joysense.empresa e JOIN joysense.pais p ON p.paisid = e.paisid WHERE e.empresaid = f.empresaid), 1)
    ) END as rls_simple_resultado,
    'fundo' as tabla
  FROM joysense.fundo f LIMIT 5
) as resumen;