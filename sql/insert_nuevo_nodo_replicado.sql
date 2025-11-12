-- ============================================================================
-- SCRIPT PARA CREAR NUEVO NODO CON MISMOS TIPOS Y MÉTRICAS QUE NODO TEST 1
-- ============================================================================
-- Este script crea un nuevo nodo replicando la configuración del nodo 297
-- 
-- IMPORTANTE: Ajusta los valores según tus necesidades:
-- - nodoid: Se genera automáticamente
-- - nodo: Nombre del nuevo nodo
-- - deveui: DevEUI único del nuevo nodo
-- - ubicacionid: ID de la ubicación donde se instalará
-- - usercreatedid: ID del usuario que crea el nodo
-- ============================================================================

-- ============================================================================
-- PASO 1: INSERTAR EL NUEVO NODO
-- ============================================================================
INSERT INTO sense.nodo (nodo, deveui, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
VALUES 
  ('NODO TEST 2', 'NT2', 1, 15, NOW(), 15, NOW())
RETURNING nodoid;

-- NOTA: Guarda el nodoid generado para usarlo en los siguientes pasos
-- Ejemplo: Si el nodoid generado es 298, úsalo en los siguientes INSERTs

-- ============================================================================
-- PASO 2: INSERTAR SENSORES (Mismos tipos que nodo 297)
-- ============================================================================
-- Tipos detectados en nodo 297: tipoid 1 y tipoid 3
-- Ajusta el nodoid según el valor retornado en el paso anterior

INSERT INTO sense.sensor (nodoid, tipoid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
VALUES 
  (298, 1, 1, 15, NOW(), 15, NOW()),  -- Tipo 1
  (298, 3, 1, 15, NOW(), 15, NOW())   -- Tipo 3
RETURNING sensorid, nodoid, tipoid;

-- ============================================================================
-- PASO 3: INSERTAR MÉTRICAS SENSOR (Mismas métricas que nodo 297)
-- ============================================================================
-- Métricas detectadas en nodo 297: metricaid 1 (Temperatura), 2 (Humedad), 3 (EC)
-- Para cada combinación de nodo-tipo-métrica

INSERT INTO sense.metricasensor (nodoid, tipoid, metricaid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
VALUES 
  -- Tipo 1 con las 3 métricas
  (298, 1, 1, 1, 15, NOW(), 15, NOW()),  -- Temperatura
  (298, 1, 2, 1, 15, NOW(), 15, NOW()),  -- Humedad
  (298, 1, 3, 1, 15, NOW(), 15, NOW()),  -- Electroconductividad
  -- Tipo 3 con las 3 métricas
  (298, 3, 1, 1, 15, NOW(), 15, NOW()),  -- Temperatura
  (298, 3, 2, 1, 15, NOW(), 15, NOW()),  -- Humedad
  (298, 3, 3, 1, 15, NOW(), 15, NOW())   -- Electroconductividad
RETURNING metricasensorid, nodoid, tipoid, metricaid;

-- ============================================================================
-- PASO 4: INSERTAR LOCALIZACIÓN (Opcional - si necesitas GPS)
-- ============================================================================
-- Ajusta ubicacionid, latitud, longitud según la ubicación real
INSERT INTO sense.localizacion (ubicacionid, nodoid, referencia, latitud, longitud, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
VALUES 
  (1, 298, 'Referencia NODO TEST 2', -12.0464, -77.0428, 1, 15, NOW(), 15, NOW())
RETURNING localizacionid, ubicacionid, nodoid;

-- ============================================================================
-- PASO 5: INSERTAR UMBRALES (Opcional - replicar umbrales del nodo 297)
-- ============================================================================
-- Si quieres replicar los mismos umbrales del nodo 297
-- Ajusta ubicacionid según corresponda

INSERT INTO sense.umbral (ubicacionid, criticidadid, nodoid, metricaid, umbral, maximo, minimo, statusid, usercreatedid, datecreated, usermodifiedid, datemodified, tipoid)
SELECT 
  1,  -- ubicacionid (ajusta según corresponda)
  u.criticidadid,
  298,  -- nuevo nodoid
  u.metricaid,
  u.umbral,
  u.maximo,
  u.minimo,
  1,
  15,
  NOW(),
  15,
  NOW(),
  u.tipoid
FROM sense.umbral u
WHERE u.nodoid = 297
  AND u.statusid = 1
RETURNING umbralid, nodoid, metricaid, tipoid, umbral;

-- ============================================================================
-- VERIFICACIÓN: Consultar el nuevo nodo y su configuración
-- ============================================================================
SELECT 
  n.nodoid,
  n.nodo,
  n.deveui,
  n.statusid,
  COUNT(DISTINCT s.tipoid) AS tipos_sensor,
  COUNT(DISTINCT ms.metricaid) AS metricas_configuradas,
  COUNT(DISTINCT u.umbralid) AS umbrales_configurados
FROM sense.nodo n
LEFT JOIN sense.sensor s ON s.nodoid = n.nodoid AND s.statusid = 1
LEFT JOIN sense.metricasensor ms ON ms.nodoid = n.nodoid AND ms.statusid = 1
LEFT JOIN sense.umbral u ON u.nodoid = n.nodoid AND u.statusid = 1
WHERE n.nodoid = 298
GROUP BY n.nodoid, n.nodo, n.deveui, n.statusid;

