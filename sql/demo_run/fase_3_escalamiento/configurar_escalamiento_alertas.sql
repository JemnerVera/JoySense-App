-- ============================================================================
-- SCRIPT PARA CONFIGURAR ESCALAMIENTO DE ALERTAS
-- ============================================================================
-- El escalamiento funciona enviando mensajes primero al nivel más alto
-- (jefes/directores) y luego, si no se resuelve, bajando niveles gradualmente.
--
-- Para que funcione el escalamiento necesitas:
-- 1. Múltiples perfiles con diferentes niveles asociados al mismo umbral
-- 2. Los perfiles deben tener una jerarquía (niveles diferentes)
-- 3. El perfil de nivel más alto (jefe) debe estar asociado primero
-- ============================================================================

-- 1. Verificar la jerarquía de perfiles actual
SELECT 
    'JERARQUÍA DE PERFILES' as seccion,
    p.perfilid,
    p.perfil,
    p.nivel,
    p.jefeid,
    CASE 
        WHEN p.nivel = 0 THEN '🔴 DIRECTOR (Nivel más alto)'
        WHEN p.nivel = 1 THEN '🟠 GERENTE'
        WHEN p.nivel = 2 THEN '🟡 ADMINISTRADOR'
        WHEN p.nivel = 3 THEN '🟢 INGENIERO'
        WHEN p.nivel = 4 THEN '🔵 TÉCNICO'
        WHEN p.nivel = 5 THEN '⚪ OBRERO (Nivel más bajo)'
        ELSE '❓ Nivel ' || p.nivel
    END as descripcion_nivel
FROM sense.perfil p
WHERE p.statusid = 1
ORDER BY p.nivel ASC;

-- 2. Verificar qué perfiles están asociados actualmente a los umbrales
SELECT 
    'PERFILES ASOCIADOS A UMBRALES' as seccion,
    pu.umbralid,
    u.umbral,
    pu.perfilid,
    p.perfil,
    p.nivel,
    CASE 
        WHEN COUNT(*) OVER (PARTITION BY pu.umbralid) = 1 THEN '⚠️ Solo un perfil - NO HAY ESCALAMIENTO'
        ELSE '✅ Múltiples perfiles - ESCALAMIENTO POSIBLE'
    END as estado_escalamiento
FROM sense.perfilumbral pu
JOIN sense.umbral u ON pu.umbralid = u.umbralid
JOIN sense.perfil p ON pu.perfilid = p.perfilid
WHERE pu.statusid = 1
  AND u.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY pu.umbralid, p.nivel ASC;

-- 3. Verificar el nivel máximo actual para cada umbral
SELECT 
    'NIVEL MÁXIMO POR UMBRAL' as seccion,
    pu.umbralid,
    u.umbral,
    MAX(p.nivel) as nivel_maximo,
    MIN(p.nivel) as nivel_minimo,
    COUNT(DISTINCT p.nivel) as total_niveles_diferentes,
    STRING_AGG(DISTINCT p.perfil || ' (nivel ' || p.nivel || ')', ', ' ORDER BY p.nivel) as perfiles_asociados,
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

-- ============================================================================
-- CONFIGURACIÓN: Asociar perfiles de diferentes niveles a los umbrales
-- ============================================================================
-- Para habilitar escalamiento, asocia múltiples perfiles con diferentes niveles
-- Ejemplo: Director (nivel 0), Gerente (nivel 1), Administrador (nivel 2), etc.

-- OPCIÓN 1: Asociar Director (nivel 0) y Gerente (nivel 1) a los umbrales
-- (Descomenta y ajusta según necesites)

-- INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
-- SELECT 
--     1,  -- perfilid = 1 (Director, nivel 0)
--     u.umbralid,
--     1,  -- statusid = 1 (activo)
--     15, -- usercreatedid
--     NOW(),
--     15,
--     NOW()
-- FROM sense.umbral u
-- WHERE u.umbralid IN (13, 14, 15, 16, 17, 18)
--   AND NOT EXISTS (
--       SELECT 1 
--       FROM sense.perfilumbral pu 
--       WHERE pu.perfilid = 1 AND pu.umbralid = u.umbralid
--   );

-- INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
-- SELECT 
--     2,  -- perfilid = 2 (Gerente, nivel 1)
--     u.umbralid,
--     1,  -- statusid = 1 (activo)
--     15, -- usercreatedid
--     NOW(),
--     15,
--     NOW()
-- FROM sense.umbral u
-- WHERE u.umbralid IN (13, 14, 15, 16, 17, 18)
--   AND NOT EXISTS (
--       SELECT 1 
--       FROM sense.perfilumbral pu 
--       WHERE pu.perfilid = 2 AND pu.umbralid = u.umbralid
--   );

-- OPCIÓN 2: Asociar todos los perfiles (Director, Gerente, Administrador, Ingeniero, Tecnico)
-- para tener un escalamiento completo desde nivel 0 hasta nivel 4

-- INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
-- SELECT 
--     p.perfilid,
--     u.umbralid,
--     1,
--     15,
--     NOW(),
--     15,
--     NOW()
-- FROM sense.perfil p
-- CROSS JOIN sense.umbral u
-- WHERE p.statusid = 1
--   AND p.perfilid IN (1, 2, 3, 4, 5)  -- Director, Gerente, Administrador, Ingeniero, Tecnico
--   AND u.umbralid IN (13, 14, 15, 16, 17, 18)
--   AND NOT EXISTS (
--       SELECT 1 
--       FROM sense.perfilumbral pu 
--       WHERE pu.perfilid = p.perfilid AND pu.umbralid = u.umbralid
--   );

-- ============================================================================
-- CÓMO FUNCIONA EL ESCALAMIENTO
-- ============================================================================
-- 1. PRIMERA NOTIFICACIÓN: Se envía al nivel MÁXIMO (ej: Director, nivel 0)
-- 2. Si pasa el tiempo de escalamiento (configurado en criticidad.escalamiento):
--    - Se envía al siguiente nivel (ej: Gerente, nivel 1)
--    - Continúa bajando niveles hasta llegar al mínimo
-- 3. Una vez en el nivel mínimo, reenvía periódicamente sin bajar más
--
-- Ejemplo con niveles 0, 1, 2, 3, 4:
-- - Primera notificación: Nivel 0 (Director)
-- - Después de escalamiento: Nivel 1 (Gerente)
-- - Después de escalamiento: Nivel 2 (Administrador)
-- - Después de escalamiento: Nivel 3 (Ingeniero)
-- - Después de escalamiento: Nivel 4 (Técnico) - nivel mínimo
-- - Reenvíos periódicos: Nivel 4 (Técnico)

-- 4. Verificar la configuración después de asociar perfiles
SELECT 
    'CONFIGURACIÓN FINAL DE ESCALAMIENTO' as seccion,
    pu.umbralid,
    u.umbral,
    pu.perfilid,
    p.perfil,
    p.nivel,
    c.escalamiento as horas_escalamiento,
    c.escalon as niveles_por_escalamiento,
    CASE 
        WHEN p.nivel = (SELECT MAX(p2.nivel) FROM sense.perfilumbral pu2 JOIN sense.perfil p2 ON pu2.perfilid = p2.perfilid WHERE pu2.umbralid = pu.umbralid) THEN '🔴 PRIMER NIVEL (notificación inicial)'
        WHEN p.nivel = (SELECT MIN(p2.nivel) FROM sense.perfilumbral pu2 JOIN sense.perfil p2 ON pu2.perfilid = p2.perfilid WHERE pu2.umbralid = pu.umbralid) THEN '⚪ ÚLTIMO NIVEL (reenvíos periódicos)'
        ELSE '🟡 NIVEL INTERMEDIO (escalamiento)'
    END as tipo_nivel
FROM sense.perfilumbral pu
JOIN sense.umbral u ON pu.umbralid = u.umbralid
JOIN sense.perfil p ON pu.perfilid = p.perfilid
LEFT JOIN sense.criticidad c ON u.criticidadid = c.criticidadid
WHERE pu.statusid = 1
  AND u.umbralid IN (13, 14, 15, 16, 17, 18)
ORDER BY pu.umbralid, p.nivel ASC;

