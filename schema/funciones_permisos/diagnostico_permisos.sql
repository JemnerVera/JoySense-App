-- SCRIPT DE DIAGNÓSTICO DE PERMISOS
-- ==================================
-- Jerarquía Geográfica: País (1) → Empresa (2) → Fundo (3) → Ubicación (4) → Nodo (5) → Localización (6)

-- Este script ayuda a diagnosticar problemas de permisos RLS

-- 1. VERIFICAR USUARIO ACTUAL Y SUS EMPRESAS
SELECT
  'Usuario actual:' as info,
  auth.uid() as useruuid,
  joysense.fn_usuarioid_actual() as usuarioid,
  u.login,
  u.firstname || ' ' || u.lastname as nombre
FROM joysense.usuario u
WHERE u.useruuid = auth.uid() AND u.statusid = 1;

-- 2. VER EMPRESAS ASIGNADAS AL USUARIO
SELECT
  'Empresas asignadas:' as info,
  ue.empresaid,
  e.empresa,
  ue.is_default,
  ue.statusid
FROM joysense.usuario_empresa ue
JOIN joysense.empresa e ON e.empresaid = ue.empresaid
WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
  AND ue.statusid = 1;

-- 3. VERIFICAR SI ES ADMIN GLOBAL
SELECT
  '¿Es admin global?:' as info,
  joysense.fn_es_admin_global() as es_admin_global;

-- 4. VERIFICAR PERMISOS FINOS EN EMPRESAS
SELECT
  'Permisos finos por empresa:' as info,
  e.empresaid,
  e.empresa,
  joysense.fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), e.empresaid) as tiene_permisos_finos
FROM joysense.empresa e
WHERE EXISTS (
  SELECT 1 FROM joysense.usuario_empresa ue
  WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
    AND ue.empresaid = e.empresaid
    AND ue.statusid = 1
);

-- 5. VER PERMISOS ESPECÍFICOS (reemplaza EMPRESA_ID)
-- SELECT * FROM joysense.v_permiso_usuario WHERE useruuid = auth.uid();

-- 6. PROBAR PERMISOS EN EMPRESA (reemplaza EMPRESA_ID)
-- SELECT joysense.fn_tiene_permiso_geo_objeto(2, EMPRESA_ID, 1) as puede_ver_empresa;

-- 7. PROBAR PERMISOS EN FUNDO (reemplaza FUNDO_ID)
-- SELECT joysense.fn_tiene_permiso_geo_objeto(3, FUNDO_ID, 1) as puede_ver_fundo;

-- 8. VER FUNDOs ACCESIBLES
SELECT
  'Fundos accesibles:' as info,
  f.fundoid,
  f.fundo,
  e.empresa,
  joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1) as permiso_directo_fundo,
  joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1) as permiso_por_empresa,
  joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f.fundoid) as puede_ver_subtree
FROM joysense.fundo f
JOIN joysense.empresa e ON e.empresaid = f.empresaid
WHERE joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
   OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
   OR joysense.fn_usuario_puede_ver_subtree_fundo(auth.uid(), f.fundoid);

-- 9. VERIFICAR POLÍTICAS RLS ACTIVAS
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
  AND tablename IN ('empresa', 'fundo', 'ubicacion', 'localizacion')
ORDER BY tablename, policyname;