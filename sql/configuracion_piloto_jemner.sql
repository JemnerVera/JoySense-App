-- =====================================================
-- CONFIGURACIÓN PILOTO - JEMNER VERA
-- =====================================================
-- Fecha: 2025-10-02
-- Objetivo: Configurar sistema completo para piloto de alertas WhatsApp

-- =====================================================
-- 1. CONFIGURAR UBICACIÓN Y NODO
-- =====================================================

-- Insertar ubicación de prueba (usar tu ubicación real)
INSERT INTO sense.ubicacion (ubicacion, fundoid, statusid, usercreatedid, datecreated) 
VALUES ('Oficina Piloto - Jemner', 1, 1, 1, now())
ON CONFLICT DO NOTHING;

-- Insertar nodo de prueba
INSERT INTO sense.nodo (nodo, statusid, usercreatedid, datecreated) 
VALUES ('NODO-JEMNER-01', 1, 1, now())
ON CONFLICT DO NOTHING;

-- Insertar localización (conectar ubicación + nodo)
INSERT INTO sense.localizacion (ubicacionid, nodoid, referencia, latitud, longitud, statusid, usercreatedid, datecreated) 
VALUES (
    (SELECT ubicacionid FROM sense.ubicacion WHERE ubicacion = 'Oficina Piloto - Jemner'),
    (SELECT nodoid FROM sense.nodo WHERE nodo = 'NODO-JEMNER-01'),
    'Oficina Principal - Piloto',
    -12.0464,  -- Latitud Lima (ajustar a tu ubicación)
    -77.0428,  -- Longitud Lima (ajustar a tu ubicación)
    1, 1, now()
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CONFIGURAR MÉTRICAS Y TIPOS
-- =====================================================

-- Insertar métricas de prueba
INSERT INTO sense.metrica (metrica, unidad, statusid, usercreatedid, datecreated) 
VALUES 
    ('Temperatura', '°C', 1, 1, now()),
    ('Humedad', '%', 1, 1, now()),
    ('Presión', 'hPa', 1, 1, now())
ON CONFLICT DO NOTHING;

-- Insertar tipos de sensores
INSERT INTO sense.tipo (tipo, entidadid, statusid, usercreatedid, datecreated) 
VALUES 
    ('Sensor Temperatura', 1, 1, 1, now()),
    ('Sensor Humedad', 1, 1, 1, now()),
    ('Sensor Presión', 1, 1, 1, now())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CONFIGURAR CRITICIDADES
-- =====================================================

-- Insertar criticidades con frecuencias de prueba
INSERT INTO sense.criticidad (criticidad, frecuencia, escalamiento, escalon, statusid, usercreatedid, datecreated) 
VALUES 
    ('Baja', 0.5, 2, 1, 1, 1, now()),    -- Cada 30 min, escalamiento cada 2 horas
    ('Media', 0.25, 1, 1, 1, 1, now()),  -- Cada 15 min, escalamiento cada 1 hora
    ('Alta', 0.1, 0.5, 1, 1, 1, now())   -- Cada 6 min, escalamiento cada 30 min
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CONFIGURAR UMBRALES DE PRUEBA
-- =====================================================

-- Umbrales que se activarán fácilmente para pruebas
INSERT INTO sense.umbral (
    ubicacionid, nodoid, tipoid, metricaid, 
    minimo, maximo, criticidadid, 
    statusid, usercreatedid, datecreated
) 
SELECT 
    u.ubicacionid,
    n.nodoid,
    t.tipoid,
    m.metricaid,
    CASE 
        WHEN m.metrica = 'Temperatura' THEN 20  -- Temperatura: 20-30°C
        WHEN m.metrica = 'Humedad' THEN 40      -- Humedad: 40-80%
        WHEN m.metrica = 'Presión' THEN 1000    -- Presión: 1000-1020 hPa
    END,
    CASE 
        WHEN m.metrica = 'Temperatura' THEN 30
        WHEN m.metrica = 'Humedad' THEN 80
        WHEN m.metrica = 'Presión' THEN 1020
    END,
    c.criticidadid,
    1, 1, now()
FROM sense.ubicacion u
CROSS JOIN sense.nodo n
CROSS JOIN sense.tipo t
CROSS JOIN sense.metrica m
CROSS JOIN sense.criticidad c
WHERE u.ubicacion = 'Oficina Piloto - Jemner'
  AND n.nodo = 'NODO-JEMNER-01'
  AND t.tipo IN ('Sensor Temperatura', 'Sensor Humedad', 'Sensor Presión')
  AND m.metrica IN ('Temperatura', 'Humedad', 'Presión')
  AND c.criticidad = 'Media'  -- Usar criticidad Media para pruebas
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CONFIGURAR PERFILES Y USUARIOS
-- =====================================================

-- Insertar perfil de prueba
INSERT INTO sense.perfil (perfil, nivel, statusid, usercreatedid, datecreated) 
VALUES ('Piloto Jemner', 3, 1, 1, now())
ON CONFLICT DO NOTHING;

-- Asignar perfil a tu usuario (usar tu usuarioid real)
INSERT INTO sense.usuarioperfil (usuarioid, perfilid, statusid, usercreatedid, datecreated) 
VALUES (
    (SELECT usuarioid FROM sense.usuario WHERE login = 'jemnervera@hotmail.com'),
    (SELECT perfilid FROM sense.perfil WHERE perfil = 'Piloto Jemner'),
    1, 1, now()
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. CONFIGURAR PERFIL-UMBRAL (CONECTAR PERFIL CON UMBRALES)
-- =====================================================

-- Asignar todos los umbrales de prueba a tu perfil
INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid, usercreatedid, datecreated)
SELECT 
    p.perfilid,
    u.umbralid,
    1, 1, now()
FROM sense.perfil p
CROSS JOIN sense.umbral u
JOIN sense.ubicacion ub ON ub.ubicacionid = u.ubicacionid
JOIN sense.nodo n ON n.nodoid = u.nodoid
WHERE p.perfil = 'Piloto Jemner'
  AND ub.ubicacion = 'Oficina Piloto - Jemner'
  AND n.nodo = 'NODO-JEMNER-01'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que todo esté configurado correctamente
SELECT 
    'Ubicación' as tipo,
    ubicacion as nombre,
    ubicacionid as id
FROM sense.ubicacion 
WHERE ubicacion = 'Oficina Piloto - Jemner'

UNION ALL

SELECT 
    'Nodo' as tipo,
    nodo as nombre,
    nodoid as id
FROM sense.nodo 
WHERE nodo = 'NODO-JEMNER-01'

UNION ALL

SELECT 
    'Umbral' as tipo,
    CONCAT(m.metrica, ' (', u.minimo, '-', u.maximo, ')') as nombre,
    u.umbralid as id
FROM sense.umbral u
JOIN sense.ubicacion ub ON ub.ubicacionid = u.ubicacionid
JOIN sense.nodo n ON n.nodoid = u.nodoid
JOIN sense.metrica m ON m.metricaid = u.metricaid
WHERE ub.ubicacion = 'Oficina Piloto - Jemner'
  AND n.nodo = 'NODO-JEMNER-01'

UNION ALL

SELECT 
    'Perfil' as tipo,
    perfil as nombre,
    perfilid as id
FROM sense.perfil 
WHERE perfil = 'Piloto Jemner'

UNION ALL

SELECT 
    'Usuario-Perfil' as tipo,
    CONCAT(u.login, ' -> ', p.perfil) as nombre,
    up.usuarioperfilid as id
FROM sense.usuarioperfil up
JOIN sense.usuario u ON u.usuarioid = up.usuarioid
JOIN sense.perfil p ON p.perfilid = up.perfilid
WHERE u.login = 'jemnervera@hotmail.com'
  AND p.perfil = 'Piloto Jemner';

-- =====================================================
-- 8. DATOS DE PRUEBA PARA SENSORES
-- =====================================================

-- Insertar datos de prueba que activarán alertas
INSERT INTO sense.sensor_valor (id_tipo_sensor, id_unidad, id_device, valor, fecha, statusid) 
VALUES 
    -- Temperatura fuera de rango (activará alerta)
    (1, 1, 'NODO-JEMNER-01', 35.5, now(), 1),
    -- Humedad fuera de rango (activará alerta)
    (2, 2, 'NODO-JEMNER-01', 85.2, now(), 1),
    -- Presión fuera de rango (activará alerta)
    (3, 3, 'NODO-JEMNER-01', 980.5, now(), 1);

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Ajusta las coordenadas (latitud, longitud) a tu ubicación real
-- 2. Verifica que tu usuarioid sea correcto
-- 3. Los umbrales están configurados para activarse fácilmente
-- 4. Los datos de prueba activarán alertas inmediatamente
-- 5. Ejecuta este script en Supabase SQL Editor
