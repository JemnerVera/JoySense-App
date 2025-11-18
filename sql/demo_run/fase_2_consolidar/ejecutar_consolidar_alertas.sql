-- ============================================================================
-- FASE 2: EJECUTAR FUNCIÓN DE CONSOLIDACIÓN DE ALERTAS
-- ============================================================================
-- Este script ejecuta la función fn_consolidar_alertas() que:
-- 1. Consolida alertas activas en alertaconsolidado
-- 2. Genera mensajes según la frecuencia configurada
-- 3. Maneja el escalamiento de alertas según los perfiles asociados
-- ============================================================================

-- Ejecutar función de consolidación
SELECT * FROM sense.fn_consolidar_alertas();

-- ============================================================================
-- VERIFICACIÓN: Verificar consolidados creados/actualizados
-- ============================================================================
SELECT 
    'CONSOLIDADOS ACTIVOS' as seccion,
    ac.consolidadoid,
    ac.umbralid,
    u.umbral,
    u.nodoid,
    n.nodo,
    ac.fechainicio,
    ac.ultimoenvio,
    ac.ultimoescalamiento,
    ac.nivelnotificado,
    ac.nivelescalamiento,
    ac.statusid,
    CASE 
        WHEN ac.statusid = 1 THEN '✅ Activo'
        ELSE '❌ Inactivo'
    END as estado
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON ac.umbralid = u.umbralid
LEFT JOIN sense.nodo n ON u.nodoid = n.nodoid
WHERE ac.statusid = 1
ORDER BY ac.consolidadoid DESC;

-- ============================================================================
-- VERIFICACIÓN: Verificar mensajes generados
-- ============================================================================
SELECT 
    'MENSAJES GENERADOS' as seccion,
    m.mensajeid,
    m.consolidadoid,
    ac.umbralid,
    u.umbral,
    m.contactoid,
    c.celular,
    u2.nombre as usuario,
    p.perfil,
    p.nivel,
    m.mensaje,
    m.fecha
FROM sense.mensaje m
JOIN sense.alertaconsolidado ac ON m.consolidadoid = ac.consolidadoid
JOIN sense.umbral u ON ac.umbralid = u.umbralid
JOIN sense.contacto c ON m.contactoid = c.contactoid
JOIN sense.usuario u2 ON c.usuarioid = u2.usuarioid
JOIN sense.usuarioperfil up ON u2.usuarioid = up.usuarioid
JOIN sense.perfil p ON up.perfilid = p.perfilid
WHERE m.fecha >= NOW() - INTERVAL '1 hour'
ORDER BY m.fecha DESC, p.nivel ASC;


