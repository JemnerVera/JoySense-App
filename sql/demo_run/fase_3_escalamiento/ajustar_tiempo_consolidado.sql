-- ============================================================================
-- SCRIPT PARA AJUSTAR ARTIFICIALMENTE EL TIEMPO EN CONSOLIDADOS
-- ============================================================================
-- Este script permite modificar las fechas de los consolidados para probar
-- la funcionalidad de frecuencia y escalamiento sin esperar horas reales.
-- ============================================================================

-- Verificar el estado actual del consolidado
SELECT 
    'ESTADO ACTUAL' as seccion,
    ac.consolidadoid,
    ac.umbralid,
    u.umbral,
    c.frecuencia,
    c.escalamiento,
    ac.ultimoenvio,
    ac.fechainicio,
    ac.ultimoescalamiento,
    ac.nivelnotificado,
    NOW() as hora_actual,
    CASE 
        WHEN ac.ultimoenvio IS NULL THEN '✅ Listo para primera notificación'
        WHEN NOW() - ac.ultimoenvio >= (c.frecuencia || ' hour')::interval THEN '✅ Listo para reenvío (frecuencia cumplida)'
        ELSE '⏳ Esperando frecuencia: ' || 
             EXTRACT(EPOCH FROM ((c.frecuencia || ' hour')::interval - (NOW() - ac.ultimoenvio)))::integer || 
             ' segundos restantes'
    END as estado_frecuencia,
    CASE 
        WHEN ac.ultimoescalamiento IS NULL AND NOW() - ac.fechainicio >= (c.escalamiento || ' hour')::interval THEN '✅ Listo para escalamiento'
        WHEN ac.ultimoescalamiento IS NOT NULL AND NOW() - ac.ultimoescalamiento >= (c.escalamiento || ' hour')::interval THEN '✅ Listo para escalamiento'
        ELSE '⏳ Esperando escalamiento'
    END as estado_escalamiento
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON ac.umbralid = u.umbralid
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE ac.consolidadoid = 1  -- Cambiar según el consolidado que quieras ajustar
ORDER BY ac.consolidadoid;

-- ============================================================================
-- OPCIÓN 1: RETROCEDER ultimoenvio PARA FORZAR REENVÍO POR FRECUENCIA
-- ============================================================================
-- Esto hace que la función piense que el último envío fue hace más tiempo
-- del configurado en frecuencia, forzando un nuevo envío.

-- Ejemplo: Retroceder ultimoenvio 2 horas (ajustar según frecuencia)
UPDATE sense.alertaconsolidado
SET 
    ultimoenvio = NOW() - INTERVAL '2 hours',  -- Cambiar según necesidad
    usermodifiedid = 15,
    datemodified = NOW()
WHERE consolidadoid = 1;  -- Cambiar según el consolidado

-- ============================================================================
-- OPCIÓN 2: AVANZAR fechainicio PARA FORZAR ESCALAMIENTO
-- ============================================================================
-- Esto hace que la función piense que la alerta comenzó hace más tiempo,
-- forzando el escalamiento.

-- Ejemplo: Retroceder fechainicio 2 horas (ajustar según escalamiento)
UPDATE sense.alertaconsolidado
SET 
    fechainicio = NOW() - INTERVAL '2 hours',  -- Cambiar según necesidad
    usermodifiedid = 15,
    datemodified = NOW()
WHERE consolidadoid = 1;  -- Cambiar según el consolidado

-- ============================================================================
-- OPCIÓN 3: RETROCEDER ultimoescalamiento PARA FORZAR RE-ESCALAMIENTO
-- ============================================================================
-- Esto hace que la función piense que el último escalamiento fue hace más tiempo,
-- forzando un nuevo escalamiento.

-- Ejemplo: Retroceder ultimoescalamiento 2 horas
UPDATE sense.alertaconsolidado
SET 
    ultimoescalamiento = NOW() - INTERVAL '2 hours',  -- Cambiar según necesidad
    usermodifiedid = 15,
    datemodified = NOW()
WHERE consolidadoid = 1;  -- Cambiar según el consolidado

-- ============================================================================
-- OPCIÓN 4: AJUSTE COMBINADO (Retroceder todo para pruebas completas)
-- ============================================================================
-- Retrocede todas las fechas relevantes para probar todo el flujo

UPDATE sense.alertaconsolidado
SET 
    ultimoenvio = NOW() - INTERVAL '2 hours',        -- Forzar reenvío por frecuencia
    fechainicio = NOW() - INTERVAL '2 hours',       -- Forzar escalamiento inicial
    ultimoescalamiento = NOW() - INTERVAL '2 hours', -- Forzar re-escalamiento
    usermodifiedid = 15,
    datemodified = NOW()
WHERE consolidadoid = 1;  -- Cambiar según el consolidado

-- ============================================================================
-- OPCIÓN 5: RESETEAR TODO (Volver a estado inicial)
-- ============================================================================
-- Resetea todas las fechas para empezar desde cero

UPDATE sense.alertaconsolidado
SET 
    ultimoenvio = NULL,
    nivelnotificado = NULL,
    ultimoescalamiento = NULL,
    nivelescalamiento = NULL,
    usermodifiedid = 15,
    datemodified = NOW()
WHERE consolidadoid = 1;  -- Cambiar según el consolidado

-- Verificar el estado después del ajuste
SELECT 
    'ESTADO DESPUÉS DEL AJUSTE' as seccion,
    ac.consolidadoid,
    ac.umbralid,
    u.umbral,
    c.frecuencia,
    c.escalamiento,
    ac.ultimoenvio,
    ac.fechainicio,
    ac.ultimoescalamiento,
    ac.nivelnotificado,
    NOW() as hora_actual,
    CASE 
        WHEN ac.ultimoenvio IS NULL THEN '✅ Listo para primera notificación'
        WHEN NOW() - ac.ultimoenvio >= (c.frecuencia || ' hour')::interval THEN '✅ Listo para reenvío (frecuencia cumplida)'
        ELSE '⏳ Esperando frecuencia'
    END as estado_frecuencia,
    CASE 
        WHEN ac.ultimoescalamiento IS NULL AND NOW() - ac.fechainicio >= (c.escalamiento || ' hour')::interval THEN '✅ Listo para escalamiento'
        WHEN ac.ultimoescalamiento IS NOT NULL AND NOW() - ac.ultimoescalamiento >= (c.escalamiento || ' hour')::interval THEN '✅ Listo para escalamiento'
        ELSE '⏳ Esperando escalamiento'
    END as estado_escalamiento
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON ac.umbralid = u.umbralid
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE ac.consolidadoid = 1  -- Cambiar según el consolidado que ajustaste
ORDER BY ac.consolidadoid;

-- NOTA: Después de ejecutar cualquiera de estas opciones, ejecuta:
-- SELECT * FROM sense.fn_consolidar_alertas();
-- para ver los resultados.

