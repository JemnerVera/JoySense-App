-- ============================================================================
-- SCRIPT PARA INSERTAR MEDICIONES DE DEMO DEL SISTEMA DE ALERTAS
-- ============================================================================
-- Este script inserta mediciones de prueba para los nodos 258 y 259
-- para demostrar el funcionamiento del sistema de alertas.
--
-- Nodos:
-- - Nodo 258 (Nodo Prueba 3) - ubicacionid: 189
-- - Nodo 259 (Nodo Prueba 4) - ubicacionid: 190
--
-- Umbrales configurados (metricaid=3, Electroconductividad):
-- - tipoid 1, 2, 3: min=500, max=1000 (rango normal/aceptable)
--   - Umbral 1 (tipoid 1): min=500, max=1000
--   - Umbral 2 (tipoid 2): min=500.01, max=1000
--   - Umbral 3 (tipoid 3): min=500, max=1000
--
-- Estrategia:
-- - 2 mediciones NORMALES por nodo (valores entre 500-1000, no disparan alertas)
-- - 2 mediciones con ALERTAS por nodo (valores fuera del rango 500-1000)
-- ============================================================================

-- ========================================================================
-- PARTE 1: NODO 258 (Nodo Prueba 3) - ubicacionid: 189
-- ========================================================================

-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
-- Tipoid 1, Metricaid 3
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '5 minutes', 750.0, 15, 1, 189), -- Dentro del rango normal (500-1000)
    (3, 258, NOW() - INTERVAL '4 minutes', 850.0, 15, 1, 189); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
-- Tipoid 1, Metricaid 3
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 258, NOW() - INTERVAL '3 minutes', 300.0, 15, 1, 189), -- Fuera del rango (300 < 500) → ALERTA
    (3, 258, NOW() - INTERVAL '2 minutes', 1200.0, 15, 1, 189); -- Fuera del rango (1200 > 1000) → ALERTA

-- ========================================================================
-- PARTE 2: NODO 259 (Nodo Prueba 4) - ubicacionid: 190
-- ========================================================================

-- 1. MEDICIONES NORMALES (no disparan alertas) - valores entre 500-1000
-- Tipoid 1, Metricaid 3
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '5 minutes', 650.0, 15, 1, 190), -- Dentro del rango normal (500-1000)
    (3, 259, NOW() - INTERVAL '4 minutes', 900.0, 15, 1, 190); -- Dentro del rango normal (500-1000)

-- 2. MEDICIONES CON ALERTAS (disparan alertas) - valores fuera del rango 500-1000
-- Tipoid 1, Metricaid 3
INSERT INTO sense.medicion (metricaid, nodoid, fecha, medicion, usercreatedid, tipoid, ubicacionid)
VALUES 
    (3, 259, NOW() - INTERVAL '3 minutes', 400.0, 15, 1, 190), -- Fuera del rango (400 < 500) → ALERTA
    (3, 259, NOW() - INTERVAL '2 minutes', 1500.0, 15, 1, 190); -- Fuera del rango (1500 > 1000) → ALERTA

-- Verificar las mediciones insertadas
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
ORDER BY m.nodoid, m.fecha DESC;

