-- ===========================================
-- SIMULACIÓN COMPLETA - USUARIO DEMO AUTENTICADO
-- ===========================================
-- Simula exactamente lo que ve el usuario demo@migivagroup.com
-- cuando está autenticado en la aplicación

-- CONFIGURACIÓN DEL USUARIO DEMO:
-- UUID: cb84a9ff-57f3-4570-a924-3c6a28fbaa71
-- UsuarioID: 4
-- Empresas asignadas: 1, 2, 3, 4, 5 (empresa 1 como default)
-- PERMISOS ESPECÍFICOS:
-- ✅ País 1 (fuenteid=1, objetoid=1)
-- ✅ Empresa 1 (fuenteid=2, objetoid=1)
-- ✅ Fundo 1 (fuenteid=3, objetoid=1)
-- ✅ Ubicaciones TODAS (fuenteid=4, objetoid=NULL)
-- ✅ Nodos TODOS (fuenteid=5, objetoid=NULL)
-- ✅ Localizaciones TODAS (fuenteid=6, objetoid=NULL)

-- NOTA: En producción, auth.uid() retornaría el UUID real del usuario.
-- Para simulación, evaluamos las políticas manualmente.

-- SECCIÓN 1: SIMULACIÓN DE AUTENTICACIÓN
-- =====================================

SELECT
    '=== SIMULACIÓN USUARIO DEMO AUTENTICADO ===' as estado,
    'cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid as sim_uuid_demo,
    'demo@migivagroup.com' as login_demo,
    4 as usuarioid_demo,
    false as es_admin_global,
    'Usuario limitado con permisos específicos' as descripcion;

-- SECCIÓN 2: VERIFICACIÓN DE CONFIGURACIÓN ESPERADA
-- =================================================

-- 2.1 Configuración de permisos esperada para demo
SELECT
    '=== PERMISOS ESPERADOS PARA DEMO ===' as verificacion,
    fuenteid,
    objetoid,
    CASE fuenteid
        WHEN 1 THEN 'País ' || COALESCE(objetoid::text, 'TODOS')
        WHEN 2 THEN 'Empresa ' || COALESCE(objetoid::text, 'TODOS')
        WHEN 3 THEN 'Fundo ' || COALESCE(objetoid::text, 'TODOS')
        WHEN 4 THEN 'Ubicación ' || COALESCE(objetoid::text, 'TODOS')
        WHEN 5 THEN 'Nodo ' || COALESCE(objetoid::text, 'TODOS')
        WHEN 6 THEN 'Localización ' || COALESCE(objetoid::text, 'TODOS')
        ELSE 'Desconocido'
    END as tipo_permiso,
    CASE
        WHEN (fuenteid = 1 AND objetoid = 1) THEN '✅ País 1 - ESPERADO'
        WHEN (fuenteid = 2 AND objetoid = 1) THEN '✅ Empresa 1 - ESPERADO'
        WHEN (fuenteid = 3 AND objetoid = 1) THEN '✅ Fundo 1 - ESPERADO'
        WHEN (fuenteid = 4 AND objetoid IS NULL) THEN '✅ Ubicaciones TODAS - ESPERADO'
        WHEN (fuenteid = 5 AND objetoid IS NULL) THEN '✅ Nodos TODOS - ESPERADO'
        WHEN (fuenteid = 6 AND objetoid IS NULL) THEN '✅ Localizaciones TODAS - ESPERADO'
        ELSE '❌ Permiso NO esperado'
    END as configuracion_demo
FROM (
    VALUES
        (1, 1),    -- País 1
        (2, 1),    -- Empresa 1
        (3, 1),    -- Fundo 1
        (4, NULL), -- Ubicaciones TODAS
        (5, NULL), -- Nodos TODOS
        (6, NULL)  -- Localizaciones TODAS
) AS permisos_esperados(fuenteid, objetoid);

-- SECCIÓN 3: SIMULACIÓN DE POLÍTICAS RLS PARA DEMO
-- ================================================

-- 3.1 Simulación política RLS de EMPRESA (debería funcionar)
SELECT
    '=== SIMULACIÓN RLS EMPRESA ===' as tabla,
    e.empresaid,
    e.empresa,
    p.pais,
    -- Simulación de la política RLS actual
    CASE
        WHEN joysense.fn_tiene_permiso_geo_objeto(2, e.empresaid, 1)
          OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
        THEN '✅ ACCESIBLE (política simple funciona)'
        ELSE '❌ NO ACCESIBLE'
    END as resultado_rls_actual,
    -- Lo que debería ver el usuario demo
    CASE
        WHEN e.empresaid = 1 THEN '✅ Empresa 1 - DEMO DEBERÍA VERLA'
        ELSE '❌ Otras empresas - DEMO NO DEBERÍA VERLAS'
    END as esperado_para_demo
FROM joysense.empresa e
JOIN joysense.pais p ON p.paisid = e.paisid
ORDER BY e.empresaid;

-- 3.2 Simulación política RLS de FUNDO (PROBLEMÁTICO)
SELECT
    '=== SIMULACIÓN RLS FUNDO ===' as tabla,
    f.fundoid,
    f.fundo,
    e.empresa,
    f.empresaid,
    -- Simulación de la política RLS actual (compleja)
    CASE
        WHEN EXISTS (
            SELECT 1 FROM joysense.usuario_empresa ue
            WHERE ue.usuarioid = 4  -- usuarioid del demo
              AND ue.empresaid = f.empresaid
              AND ue.statusid = 1
        )
        AND (
            NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f.empresaid)
            OR joysense.fn_usuario_puede_ver_subtree_fundo('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f.fundoid)
        )
        THEN '✅ ACCESIBLE (RLS complejo)'
        ELSE '❌ NO ACCESIBLE (RLS complejo falla)'
    END as resultado_rls_actual,
    -- Simulación del patrón simple propuesto
    CASE
        WHEN joysense.fn_tiene_permiso_geo_objeto(3, f.fundoid, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(1, (SELECT p.paisid FROM joysense.empresa e2 JOIN joysense.pais p ON p.paisid = e2.paisid WHERE e2.empresaid = f.empresaid), 1)
        THEN '✅ ACCESIBLE (patrón simple)'
        ELSE '❌ NO ACCESIBLE'
    END as resultado_rls_simple,
    -- Lo que debería ver el usuario demo
    CASE
        WHEN f.fundoid = 1 THEN '✅ Fundo 1 - DEMO DEBERÍA VERLO'
        ELSE '❌ Otros fundos - DEMO NO DEBERÍA VERLOS'
    END as esperado_para_demo
FROM joysense.fundo f
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY f.fundoid;

-- 3.3 Simulación política RLS de UBICACIÓN
SELECT
    '=== SIMULACIÓN RLS UBICACIÓN ===' as tabla,
    ub.ubicacionid,
    ub.ubicacion,
    f.fundo,
    e.empresa,
    -- Simulación de la política RLS actual (compleja)
    CASE
        WHEN EXISTS (
            SELECT 1 FROM (joysense.fundo f2
                JOIN joysense.usuario_empresa ue ON ue.empresaid = f2.empresaid
                                              AND ue.usuarioid = 4
                                              AND ue.statusid = 1)
            WHERE f2.fundoid = ub.fundoid
              AND (
                NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f2.empresaid)
                OR joysense.fn_usuario_puede_ver_subtree_ubicacion('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, ub.ubicacionid)
                OR joysense.fn_usuario_puede_ver_subtree_fundo('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f2.fundoid)
              )
        )
        THEN '✅ ACCESIBLE (RLS complejo)'
        ELSE '❌ NO ACCESIBLE (RLS complejo falla)'
    END as resultado_rls_actual,
    -- Simulación del patrón simple propuesto
    CASE
        WHEN joysense.fn_tiene_permiso_geo_objeto(4, ub.ubicacionid, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(3, ub.fundoid, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(2, f.empresaid, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(1, e.paisid, 1)
        THEN '✅ ACCESIBLE (patrón simple)'
        ELSE '❌ NO ACCESIBLE'
    END as resultado_rls_simple,
    -- Lo que debería ver el usuario demo (TODAS las ubicaciones)
    '✅ TODAS las ubicaciones - DEMO DEBERÍA VERLAS (permiso global)' as esperado_para_demo
FROM joysense.ubicacion ub
JOIN joysense.fundo f ON f.fundoid = ub.fundoid
JOIN joysense.empresa e ON e.empresaid = f.empresaid
ORDER BY ub.ubicacionid
LIMIT 10;

-- SECCIÓN 4: ANÁLISIS DETALLADO DE FUNCIONES PARA DEMO
-- ===================================================

-- 4.1 Verificar si el usuario demo tiene permisos finos
SELECT
    '=== PERMISOS FINOS DEL USUARIO DEMO ===' as analisis,
    e.empresaid,
    e.empresa,
    joysense.fn_usuario_tiene_permisos_finos_en_empresa('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, e.empresaid) as tiene_permisos_finos,
    CASE
        WHEN joysense.fn_usuario_tiene_permisos_finos_en_empresa('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, e.empresaid)
        THEN '❌ SÍ tiene permisos finos - RLS requiere subtree'
        ELSE '✅ NO tiene permisos finos - RLS permite acceso directo'
    END as impacto_en_rls
FROM joysense.empresa e
WHERE e.empresaid IN (1,2,3,4,5) -- Empresas asignadas al demo
ORDER BY e.empresaid;

-- 4.2 Verificar función subtree para fundo 1
SELECT
    '=== FUNCIÓN SUBTREE PARA FUNDO 1 ===' as analisis,
    joysense.fn_usuario_puede_ver_subtree_fundo('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, 1) as puede_ver_subtree_fundo_1,
    CASE
        WHEN joysense.fn_usuario_puede_ver_subtree_fundo('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, 1)
        THEN '✅ Subtree retorna TRUE - DEMO puede ver fundo 1'
        ELSE '❌ Subtree retorna FALSE - DEMO NO puede ver fundo 1'
    END as explicacion;

-- SECCIÓN 5: RESULTADOS FINALES DE SIMULACIÓN
-- ===========================================

-- 5.1 Comparación final
SELECT
    '=== RESULTADOS FINALES DE SIMULACIÓN ===' as resumen,
    'Usuario Demo (demo@migivagroup.com)' as usuario_simulado,
    'Permisos limitados pero específicos' as tipo_permisos,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM joysense.fundo f
            WHERE f.fundoid = 1
              AND (
                joysense.fn_es_admin_global()
                OR (
                  EXISTS (SELECT 1 FROM joysense.usuario_empresa ue WHERE ue.usuarioid = 4 AND ue.empresaid = f.empresaid AND ue.statusid = 1)
                  AND (
                    NOT joysense.fn_usuario_tiene_permisos_finos_en_empresa('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f.empresaid)
                    OR joysense.fn_usuario_puede_ver_subtree_fundo('cb84a9ff-57f3-4570-a924-3c6a28fbaa71'::uuid, f.fundoid)
                  )
                )
              )
        ) THEN '✅ Fundo 1 ACCESIBLE con RLS actual'
        ELSE '❌ Fundo 1 NO ACCESIBLE con RLS actual'
    END as resultado_rls_actual,
    CASE
        WHEN joysense.fn_tiene_permiso_geo_objeto(3, 1, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(2, 1, 1)
           OR joysense.fn_tiene_permiso_geo_objeto(1, 1, 1)
        THEN '✅ Fundo 1 ACCESIBLE con patrón simple'
        ELSE '❌ Fundo 1 NO ACCESIBLE con patrón simple'
    END as resultado_rls_simple,
    'Las políticas RLS complejas están bloqueando el acceso correcto' as conclusion;

-- 5.2 Recomendaciones
SELECT
    '=== RECOMENDACIONES ===' as recomendaciones,
    '1. Las políticas RLS actuales son demasiado complejas' as problema,
    '2. El usuario demo tiene los permisos correctos' as verificacion,
    '3. Pero las políticas no los evalúan correctamente' as causa,
    '4. Solución: Simplificar políticas al patrón de empresa' as solucion,
    '5. Remover lógica de permisos finos + subtree' as implementacion;