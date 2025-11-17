-- ============================================================================
-- SCRIPT PARA PROBAR ESCALAMIENTO DE ALERTAS
-- ============================================================================
-- Este script verifica la configuración de escalamiento y ajusta las fechas
-- de los consolidados para probar el escalamiento sin esperar horas reales.
-- ============================================================================

-- 1. Verificar perfiles asociados a los umbrales de prueba
SELECT 
    'PERFILES ASOCIADOS A UMBRALES DE PRUEBA' as seccion,
    pu.umbralid,
    u.umbral,
    u.nodoid,
    pu.perfilid,
    p.perfil,
    p.nivel,
    CASE 
        WHEN p.nivel = 0 THEN '🔴 DIRECTOR (Nivel más alto)'
        WHEN p.nivel = 1 THEN '🟠 GERENTE'
        WHEN p.nivel = 2 THEN '🟡 ADMINISTRADOR'
        WHEN p.nivel = 3 THEN '🟢 INGENIERO'
        WHEN p.nivel = 4 THEN '🔵 TÉCNICO'
        WHEN p.nivel = 5 THEN '⚪ OBRERO (Nivel más bajo)'
        ELSE '❓ Nivel ' || p.nivel
    END as descripcion_nivel
FROM sense.perfilumbral pu
JOIN sense.umbral u ON pu.umbralid = u.umbralid
JOIN sense.perfil p ON pu.perfilid = p.perfilid
WHERE pu.statusid = 1
  AND u.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY pu.umbralid, p.nivel ASC;

-- 2. Verificar nivel máximo y mínimo por umbral
SELECT 
    'NIVELES POR UMBRAL' as seccion,
    pu.umbralid,
    u.umbral,
    MIN(p.nivel) as nivel_minimo,
    MAX(p.nivel) as nivel_maximo,
    COUNT(DISTINCT p.nivel) as total_niveles,
    STRING_AGG(DISTINCT p.perfil || ' (nivel ' || p.nivel || ')', ', ' ORDER BY p.nivel) as perfiles,
    CASE 
        WHEN COUNT(DISTINCT p.nivel) = 1 THEN '⚠️ Solo un nivel - NO HAY ESCALAMIENTO'
        WHEN COUNT(DISTINCT p.nivel) > 1 THEN '✅ Múltiples niveles - ESCALAMIENTO POSIBLE'
        ELSE '❌ Sin perfiles'
    END as estado_escalamiento
FROM sense.perfilumbral pu
JOIN sense.umbral u ON pu.umbralid = u.umbralid
JOIN sense.perfil p ON pu.perfilid = p.perfilid
WHERE pu.statusid = 1
  AND u.umbralid IN (13, 14, 15, 16, 17, 18)
GROUP BY pu.umbralid, u.umbral
ORDER BY pu.umbralid;

-- 3. Verificar criticidad y configuración de escalamiento
SELECT 
    'CONFIGURACIÓN DE CRITICIDAD' as seccion,
    u.umbralid,
    u.umbral,
    c.criticidad,
    c.frecuencia as frecuencia_horas,
    c.escalamiento as escalamiento_horas,
    c.escalon as niveles_por_escalamiento
FROM sense.umbral u
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE u.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY u.umbralid;

-- 4. Verificar estado actual de los consolidados activos
SELECT 
    'ESTADO ACTUAL DE CONSOLIDADOS ACTIVOS' as seccion,
    ac.consolidadoid,
    ac.umbralid,
    u.umbral,
    ac.fechainicio,
    ac.ultimoenvio,
    ac.ultimoescalamiento,
    ac.nivelnotificado,
    ac.nivelescalamiento,
    c.escalamiento as escalamiento_horas,
    NOW() as hora_actual,
    CASE 
        WHEN ac.ultimoescalamiento IS NULL 
             AND NOW() - ac.fechainicio >= (c.escalamiento || ' hour')::interval 
        THEN '✅ Listo para escalamiento inicial'
        WHEN ac.ultimoescalamiento IS NOT NULL 
             AND NOW() - ac.ultimoescalamiento >= (c.escalamiento || ' hour')::interval 
        THEN '✅ Listo para re-escalamiento'
        ELSE '⏳ Esperando tiempo de escalamiento'
    END as estado_escalamiento
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON ac.umbralid = u.umbralid
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE ac.statusid = 1
  AND ac.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY ac.consolidadoid;

-- ============================================================================
-- AJUSTE DE FECHAS PARA FORZAR ESCALAMIENTO
-- ============================================================================
-- Descomenta y ajusta según necesites para probar el escalamiento

-- OPCIÓN 1: Forzar escalamiento inicial (retroceder fechainicio)
-- Esto hace que la función piense que la alerta comenzó hace más tiempo
UPDATE sense.alertaconsolidado
SET 
    fechainicio = NOW() - INTERVAL '2 hours',  -- Ajustar según escalamiento configurado
    ultimoescalamiento = NULL,  -- Resetear para forzar escalamiento inicial
    usermodifiedid = 15,
    datemodified = NOW()
WHERE statusid = 1
  AND umbralid IN (13, 14, 15, 16, 17, 18);

-- OPCIÓN 2: Forzar re-escalamiento (retroceder ultimoescalamiento)
-- Esto hace que la función piense que el último escalamiento fue hace más tiempo
-- UPDATE sense.alertaconsolidado
-- SET 
--     ultimoescalamiento = NOW() - INTERVAL '2 hours',  -- Ajustar según escalamiento configurado
--     usermodifiedid = 15,
--     datemodified = NOW()
-- WHERE statusid = 1
--   AND umbralid IN (13, 14, 15, 16, 17, 18)
--   AND ultimoescalamiento IS NOT NULL;

-- OPCIÓN 3: Ajuste combinado (retroceder todo para pruebas completas)
-- UPDATE sense.alertaconsolidado
-- SET 
--     fechainicio = NOW() - INTERVAL '3 hours',
--     ultimoenvio = NOW() - INTERVAL '2 hours',
--     ultimoescalamiento = NOW() - INTERVAL '2 hours',
--     usermodifiedid = 15,
--     datemodified = NOW()
-- WHERE statusid = 1
--   AND umbralid IN (13, 14, 15, 16, 17, 18);

-- 5. Verificar estado después del ajuste
SELECT 
    'ESTADO DESPUÉS DEL AJUSTE' as seccion,
    ac.consolidadoid,
    ac.umbralid,
    u.umbral,
    ac.fechainicio,
    ac.ultimoenvio,
    ac.ultimoescalamiento,
    ac.nivelnotificado,
    ac.nivelescalamiento,
    c.escalamiento as escalamiento_horas,
    NOW() as hora_actual,
    EXTRACT(EPOCH FROM (NOW() - ac.fechainicio))/3600 as horas_desde_inicio,
    CASE 
        WHEN ac.ultimoescalamiento IS NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - ac.fechainicio))/3600 || ' horas desde inicio'
        ELSE 
            EXTRACT(EPOCH FROM (NOW() - ac.ultimoescalamiento))/3600 || ' horas desde último escalamiento'
    END as tiempo_transcurrido,
    CASE 
        WHEN ac.ultimoescalamiento IS NULL 
             AND NOW() - ac.fechainicio >= (c.escalamiento || ' hour')::interval 
        THEN '✅ Listo para escalamiento inicial'
        WHEN ac.ultimoescalamiento IS NOT NULL 
             AND NOW() - ac.ultimoescalamiento >= (c.escalamiento || ' hour')::interval 
        THEN '✅ Listo para re-escalamiento'
        ELSE '⏳ Esperando tiempo de escalamiento'
    END as estado_escalamiento
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON ac.umbralid = u.umbralid
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE ac.statusid = 1
  AND ac.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY ac.consolidadoid;

-- ============================================================================
-- EJECUTAR FUNCIÓN DE CONSOLIDACIÓN
-- ============================================================================
-- Después de ajustar las fechas, ejecuta esta función para ver el escalamiento

-- SELECT * FROM sense.fn_consolidar_alertas();

-- ============================================================================
-- VERIFICAR MENSAJES GENERADOS POR ESCALAMIENTO
-- ============================================================================
-- Después de ejecutar la función, verifica qué mensajes se crearon

-- SELECT 
--     m.mensajeid,
--     m.consolidadoid,
--     ac.umbralid,
--     m.contactoid,
--     c.celular,
--     p.perfil,
--     p.nivel,
--     m.mensaje,
--     m.fecha
-- FROM sense.mensaje m
-- JOIN sense.alertaconsolidado ac ON m.consolidadoid = ac.consolidadoid
-- JOIN sense.contacto c ON m.contactoid = c.contactoid
-- JOIN sense.usuario u ON c.usuarioid = u.usuarioid
-- JOIN sense.usuarioperfil up ON u.usuarioid = up.usuarioid
-- JOIN sense.perfil p ON up.perfilid = p.perfilid
-- WHERE ac.umbralid IN (13, 14, 15, 16, 17, 18)
--   AND m.fecha >= NOW() - INTERVAL '1 hour'
-- ORDER BY m.fecha DESC, p.nivel ASC;

