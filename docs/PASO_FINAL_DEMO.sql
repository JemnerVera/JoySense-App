-- ============================================================================
-- PASO FINAL: Insertar nueva medición después de resetear cooldown
-- ============================================================================

-- 1. Obtener el id_device asociado a tu localización
SELECT 
    a.id_device,
    a.localizacionid,
    l.localizacion
FROM joysense.asociacion a
JOIN joysense.localizacion l ON l.localizacionid = a.localizacionid
WHERE a.statusid = 1
ORDER BY a.datecreated DESC
LIMIT 1;

-- 2. Insertar nueva medición que DISPARA la alerta
-- ⚠️ Reemplaza 'dev-001' con el id_device real obtenido en el paso 1
-- ⚠️ Usa un valor que cumpla el umbral (ej: 4.9 si el umbral es [5.5, 6.5] con operador FUERA)
INSERT INTO joysense.sensor_valor (id_device, fecha, valor, statusid)
VALUES ('dev-001', NOW(), 4.9, 1);

-- 3. Verificar que se generó el mensaje
SELECT 
    m.*,
    c.celular,
    tm.tipo_mensaje,
    ar.reglaid,
    r.nombre as regla_nombre
FROM joysense.mensaje m
JOIN joysense.contacto c ON c.contactoid = m.contactoid
JOIN joysense.tipo_mensaje tm ON tm.tipo_mensajeid = m.tipo_mensajeid
LEFT JOIN joysense.alerta_regla ar ON ar.uuid_alerta_reglaid = m.uuid_origen
LEFT JOIN joysense.regla r ON r.reglaid = ar.reglaid
ORDER BY m.datecreated DESC
LIMIT 5;

-- 4. Verificar el estado del consolidado (debe mostrar nuevo ultimoenvio)
SELECT 
    c.reglaid,
    c.localizacionid,
    c.ultimoenvio,
    c.nivelnotificado,
    r.nombre as regla_nombre,
    r.cooldown,
    CASE 
        WHEN c.ultimoenvio IS NULL THEN 'Pendiente'
        ELSE 'Enviado: ' || to_char(c.ultimoenvio, 'YYYY-MM-DD HH24:MI:SS')
    END as estado
FROM joysense.alerta_regla_consolidado c
JOIN joysense.regla r ON r.reglaid = c.reglaid
WHERE c.statusid = 1
  AND c.reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
  AND c.localizacionid = 1  -- ⚠️ CAMBIAR por tu localizacionid
ORDER BY c.fechaultimo DESC
LIMIT 1;

