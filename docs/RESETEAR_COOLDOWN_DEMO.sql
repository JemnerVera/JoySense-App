-- ============================================================================
-- RESETEAR COOLDOWN PARA DEMO
-- ============================================================================
-- Este script resetea el cooldown de una regla para poder probar de nuevo
-- ⚠️ SOLO PARA PRUEBAS - NO USAR EN PRODUCCIÓN
-- ============================================================================

-- OPCIÓN 1: Resetear cooldown de una regla específica (recomendado para demo)
-- ⚠️ Reemplaza 3 por tu reglaid y 1 por tu localizacionid
UPDATE joysense.alerta_regla_consolidado
SET 
    ultimoenvio = NULL,
    nivelnotificado = NULL,
    usermodifiedid = 1,
    datemodified = now()
WHERE reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
  AND localizacionid = 1  -- ⚠️ CAMBIAR por tu localizacionid
  AND statusid = 1;

-- Verificar que se reseteó
SELECT 
    c.reglaid,
    c.localizacionid,
    c.ultimoenvio,
    CASE 
        WHEN c.ultimoenvio IS NULL THEN '✅ RESETEADO - Listo para enviar'
        ELSE '⚠️ Aún tiene cooldown'
    END as estado
FROM joysense.alerta_regla_consolidado c
WHERE c.reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
  AND c.localizacionid = 1;  -- ⚠️ CAMBIAR por tu localizacionid

-- ============================================================================
-- OPCIÓN 2: Cambiar el cooldown de la regla a un tiempo menor (ej: 5 minutos)
-- ============================================================================
-- ⚠️ Reemplaza 3 por tu reglaid
UPDATE joysense.regla
SET 
    cooldown = interval '00:05:00',  -- 5 minutos (en lugar de 1 día)
    usermodifiedid = 1,
    datemodified = now()
WHERE reglaid = 3;  -- ⚠️ CAMBIAR por tu reglaid

-- Verificar el cambio
SELECT 
    reglaid,
    nombre,
    cooldown,
    ventana
FROM joysense.regla
WHERE reglaid = 3;  -- ⚠️ CAMBIAR por tu reglaid

-- ============================================================================
-- OPCIÓN 3: Eliminar completamente el consolidado (reset total)
-- ============================================================================
-- ⚠️ CUIDADO: Esto elimina el historial de cooldown
-- DELETE FROM joysense.alerta_regla_consolidado
-- WHERE reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
--   AND localizacionid = 1;  -- ⚠️ CAMBIAR por tu localizacionid

