-- ============================================================================
-- SCRIPT PARA INSERTAR MEDICIONES DE DEMO DEL SISTEMA DE ALERTAS
-- TIPOS DE SENSOR 2 Y 3 (Sensor Maceta 20cm y Sensor Suelo 30cm)
-- ============================================================================
-- Este script inserta mediciones de prueba para los nodos 258 y 259
-- para los tipos de sensor 2 y 3 (además del tipo 1 que ya se insertó).
--
-- Nodos:
-- - Nodo 258 (Nodo Prueba 3) - ubicacionid: 189
-- - Nodo 259 (Nodo Prueba 4) - ubicacionid: 190
--
-- Umbrales configurados (metricaid=3, Electroconductividad):
-- - tipoid 1, 2, 3: min=500, max=1000 (rango normal/aceptable)
--   - Umbral 16 (nodoid 258, tipoid 1): min=500, max=1000
--   - Umbral 17 (nodoid 258, tipoid 2): min=500.01, max=1000
--   - Umbral 18 (nodoid 258, tipoid 3): min=500, max=1000
--   - Umbral 13 (nodoid 259, tipoid 1): min=500, max=1000
--   - Umbral 14 (nodoid 259, tipoid 2): min=500.01, max=1000
--   - Umbral 15 (nodoid 259, tipoid 3): min=500, max=1000
--
-- Estrategia:
-- - 2 mediciones NORMALES por nodo/tipo (valores entre 500-1000, no disparan alertas)
-- - 2 mediciones con ALERTAS por nodo/tipo (valores fuera del rango 500-1000)
-- ============================================================================

-- ========================================================================
-- PARTE 1: NODO 258 (Nodo Prueba 3) - ubicacionid: 189
-- ========================================================================

-- TIPO 2: Sensor Maceta 20cm
-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '10 minutes', 700.0, 15, 2, 189), -- Dentro del rango normal (500-1000)
    (3, 258, NOW() - INTERVAL '9 minutes', 850.0, 15, 2, 189); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '8 minutes', 400.0, 15, 2, 189), -- Fuera del rango (400 < 500.01) → ALERTA
    (3, 258, NOW() - INTERVAL '7 minutes', 1100.0, 15, 2, 189); -- Fuera del rango (1100 > 1000) → ALERTA

-- TIPO 3: Sensor Suelo 30cm
-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '6 minutes', 600.0, 15, 3, 189), -- Dentro del rango normal (500-1000)
    (3, 258, NOW() - INTERVAL '5 minutes', 950.0, 15, 3, 189); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '4 minutes', 350.0, 15, 3, 189), -- Fuera del rango (350 < 500) → ALERTA
    (3, 258, NOW() - INTERVAL '3 minutes', 1300.0, 15, 3, 189); -- Fuera del rango (1300 > 1000) → ALERTA

-- ========================================================================
-- PARTE 2: NODO 259 (Nodo Prueba 4) - ubicacionid: 190
-- ========================================================================

-- TIPO 2: Sensor Maceta 20cm
-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '10 minutes', 750.0, 15, 2, 190), -- Dentro del rango normal (500-1000)
    (3, 259, NOW() - INTERVAL '9 minutes', 900.0, 15, 2, 190); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '8 minutes', 450.0, 15, 2, 190), -- Fuera del rango (450 < 500.01) → ALERTA
    (3, 259, NOW() - INTERVAL '7 minutes', 1200.0, 15, 2, 190); -- Fuera del rango (1200 > 1000) → ALERTA

-- TIPO 3: Sensor Suelo 30cm
-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '6 minutes', 650.0, 15, 3, 190), -- Dentro del rango normal (500-1000)
    (3, 259, NOW() - INTERVAL '5 minutes', 880.0, 15, 3, 190); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '4 minutes', 300.0, 15, 3, 190), -- Fuera del rango (300 < 500) → ALERTA
    (3, 259, NOW() - INTERVAL '3 minutes', 1400.0, 15, 3, 190); -- Fuera del rango (1400 > 1000) → ALERTA

-- ========================================================================
-- VERIFICACIÓN: Verificar las mediciones insertadas
-- ========================================================================
SELECT 
    m.medicionid,
    m.nodoid,
    n.nodo,
    m.tipoid,
    t.tipo,
    m.metricaid,
    met.metrica,
    m.medicion,
    m.fecha,
    CASE 
        WHEN m.medicion >= 500 AND m.medicion <= 1000 THEN '✅ NORMAL: Dentro del rango aceptable (500-1000)'
        WHEN m.medicion < 500 THEN '⚠️ ALERTA: Valor muy bajo (< 500)'
        WHEN m.medicion > 1000 THEN '⚠️ ALERTA: Valor muy alto (> 1000)'
        ELSE '❌ ALERTA: Fuera de rango'
    END as estado_alerta
FROM sense.medicion m
JOIN sense.nodo n ON m.nodoid = n.nodoid
JOIN sense.tipo t ON m.tipoid = t.tipoid
JOIN sense.metrica met ON m.metricaid = met.metricaid
WHERE m.nodoid IN (258, 259)
  AND m.tipoid IN (2, 3)
  AND m.metricaid = 3
  AND m.fecha >= NOW() - INTERVAL '1 hour'
ORDER BY m.nodoid, m.tipoid, m.fecha DESC;

-- ========================================================================
-- VERIFICACIÓN: Verificar alertas generadas
-- ========================================================================
SELECT 
    a.alertaid,
    a.umbralid,
    u.umbral,
    a.medicionid,
    m.nodoid,
    m.tipoid,
    t.tipo,
    m.medicion,
    m.fecha as fecha_medicion,
    a.fecha as fecha_alerta,
    CASE 
        WHEN a.alertaid IS NULL THEN '❌ NO SE GENERÓ ALERTA'
        ELSE '✅ ALERTA GENERADA'
    END as estado_alerta
FROM sense.medicion m
JOIN sense.tipo t ON m.tipoid = t.tipoid
LEFT JOIN sense.alerta a ON a.medicionid = m.medicionid
LEFT JOIN sense.umbral u ON a.umbralid = u.umbralid
WHERE m.nodoid IN (258, 259)
  AND m.tipoid IN (2, 3)
  AND m.metricaid = 3
  AND m.fecha >= NOW() - INTERVAL '1 hour'
ORDER BY m.nodoid, m.tipoid, m.fecha DESC;

