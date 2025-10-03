-- =====================================================
-- INSERTAR MEDICIONES DE PRUEBA PARA PILOTO
-- =====================================================
-- Fecha: 2025-10-02
-- Objetivo: Insertar mediciones que activen alertas para probar el sistema

-- =====================================================
-- MEDICIONES QUE ACTIVARÁN ALERTAS
-- =====================================================

-- 1. Humedad 50% (fuera de rango 25-40%) - ⚠️Amarilla
-- Umbral ID: 353, Ubicación: Sector 01, Nodo: rls a114 (nodoid: 296), Tipo: Sensor Maceta 10cm
INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES (1, 296, 1, 2, now(), 50.0, 1);

-- 2. Electroconductividad 15 (fuera de rango 8-12) - ⚠️Amarilla  
-- Umbral ID: 354, Ubicación: Sector 01, Nodo: rls a114 (nodoid: 296), Tipo: Sensor Maceta 10cm
INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES (1, 296, 1, 3, now(), 15.0, 1);

-- 3. Humedad 60% (fuera de rango 30-44.96%) - 🚨Roja
-- Umbral ID: 355, Ubicación: Sector 01, Nodo: rls a114 (nodoid: 296), Tipo: Sensor Maceta 20cm
INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES (1, 296, 2, 2, now(), 60.0, 1);

-- 4. Electroconductividad 25 (fuera de rango 12-19.97%) - 🚨Roja
-- Umbral ID: 356, Ubicación: Sector 01, Nodo: rls a114 (nodoid: 296), Tipo: Sensor Maceta 20cm
INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES (1, 296, 2, 3, now(), 25.0, 1);

-- =====================================================
-- VERIFICAR QUE SE INSERTARON LAS MEDICIONES
-- =====================================================

-- Verificar las mediciones insertadas
SELECT 
    m.medicionid,
    m.medicion,
    m.fecha,
    ub.ubicacion,
    n.nodo,
    t.tipo,
    met.metrica
FROM sense.medicion m
JOIN sense.ubicacion ub ON ub.ubicacionid = m.ubicacionid
JOIN sense.nodo n ON n.nodoid = m.nodoid
JOIN sense.tipo t ON t.tipoid = m.tipoid
JOIN sense.metrica met ON met.metricaid = m.metricaid
WHERE ub.ubicacion = 'Sector 01'
  AND n.nodo = 'rls a114'
  AND m.fecha >= now() - interval '1 minute'
ORDER BY m.fecha DESC;

-- =====================================================
-- VERIFICAR QUE SE GENERARON ALERTAS
-- =====================================================

-- Verificar alertas generadas
SELECT 
    a.alertaid,
    a.fecha,
    u.umbral,
    u.minimo,
    u.maximo,
    c.criticidad,
    m.medicion
FROM sense.alerta a
JOIN sense.umbral u ON u.umbralid = a.umbralid
JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
JOIN sense.medicion m ON m.medicionid = a.medicionid
WHERE a.fecha >= now() - interval '1 minute'
ORDER BY a.fecha DESC;

-- =====================================================
-- EJECUTAR CONSOLIDACIÓN DE ALERTAS
-- =====================================================

-- Ejecutar función de consolidación
SELECT sense.fn_consolidar_alertas();

-- =====================================================
-- VERIFICAR ALERTAS CONSOLIDADAS
-- =====================================================

-- Verificar alertas consolidadas
SELECT 
    ac.alertaconsolidadoid,
    ac.fecha_inicio,
    ac.fecha_fin,
    ac.cantidad_alertas,
    u.umbral,
    c.criticidad
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON u.umbralid = ac.umbralid
JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
WHERE ac.fecha_inicio >= now() - interval '1 minute'
ORDER BY ac.fecha_inicio DESC;

-- =====================================================
-- VERIFICAR MENSAJES GENERADOS
-- =====================================================

-- Verificar mensajes generados
SELECT 
    m.mensajeid,
    m.mensaje,
    m.fecha,
    c.celular,
    u.login
FROM sense.mensaje m
JOIN sense.contacto c ON c.contactoid = m.contactoid
JOIN sense.usuario u ON u.usuarioid = c.usuarioid
WHERE m.fecha >= now() - interval '1 minute'
ORDER BY m.fecha DESC;
