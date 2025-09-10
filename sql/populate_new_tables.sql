-- 🚀 POBLAR TABLAS NUEVAS CON DATOS DE EJEMPLO
-- Ejecutar en el SQL Editor de Supabase después de explorar la estructura
-- 
-- IMPORTANTE: La tabla 'usuario' ya tiene datos existentes, por lo que solo se actualizan
-- campos faltantes en lugar de insertar nuevos registros.
-- 
-- NOTA: Se han corregido los nombres de las columnas para usar la estructura REAL
-- de las tablas en Supabase, basándose en la exploración del schema
-- 
-- Usuarios existentes:
-- - usuarioid 1: administrador@migivagroup.com (Administrador)
-- - usuarioid 2: patricio.sandoval@migivagroup.com (Patricio Sandoval)  
-- - usuarioid 3: jemner.vera@agricolaandrea.com (Jemner Vera)
-- - usuarioid 5: patricio_sandoval@hotmail.com (patricio_sandoval)

-- ========================================
-- 1. INSERTAR DATOS EN TABLA CRITICIDAD
-- ========================================

INSERT INTO sense.criticidad (criticidadid, criticidad, criticidadbrev, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 'Baja', 'B', 1, 1, NOW(), 1, NOW()),
(2, 'Media', 'M', 1, 1, NOW(), 1, NOW()),
(3, 'Alta', 'A', 1, 1, NOW(), 1, NOW()),
(4, 'Crítica', 'C', 1, 1, NOW(), 1, NOW());

-- ========================================
-- 2. INSERTAR DATOS EN TABLA MEDIO
-- ========================================

INSERT INTO sense.medio (medioid, nombre, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 'Email', 1, 1, NOW(), 1, NOW()),
(2, 'SMS', 1, 1, NOW(), 1, NOW()),
(3, 'WhatsApp', 1, 1, NOW(), 1, NOW()),
(4, 'Push', 1, 1, NOW(), 1, NOW());

-- ========================================
-- 3. INSERTAR DATOS EN TABLA PERFIL
-- ========================================

INSERT INTO sense.perfil (perfilid, perfil, nivel, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 'Administrador', 'Alto', 1, 1, NOW(), 1, NOW()),
(2, 'Supervisor', 'Medio', 1, 1, NOW(), 1, NOW()),
(3, 'Técnico', 'Medio', 1, 1, NOW(), 1, NOW()),
(4, 'Operador', 'Bajo', 1, 1, NOW(), 1, NOW());

-- ========================================
-- 4. ACTUALIZAR DATOS EN TABLA USUARIO EXISTENTE
-- ========================================

-- NOTA: La tabla usuario ya tiene datos existentes, solo actualizamos campos faltantes
-- Los usuarios existentes son:
-- 1. administrador@migivagroup.com (Administrador)
-- 2. patricio.sandoval@migivagroup.com (Patricio Sandoval)
-- 3. jemner.vera@agricolaandrea.com (Jemner Vera)
-- 4. patricio_sandoval@hotmail.com (patricio_sandoval)

-- Actualizar campos faltantes en usuarios existentes
-- NOTA: La tabla usuario ya tiene los campos básicos, solo actualizamos si es necesario
-- Los usuarios ya tienen: firstname, lastname, login, statusid, etc.

-- ========================================
-- 5. INSERTAR DATOS EN TABLA USUARIOPERFIL
-- ========================================

INSERT INTO sense.usuarioperfil (usuarioid, perfilid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 1, 1, 1, NOW(), 1, NOW()),  -- Administrador es Administrador
(2, 2, 1, 1, NOW(), 1, NOW()),  -- Patricio Sandoval es Supervisor
(3, 3, 1, 1, NOW(), 1, NOW()),  -- Jemner Vera es Técnico
(5, 4, 1, 1, NOW(), 1, NOW());  -- patricio_sandoval es Operador

-- ========================================
-- 6. INSERTAR DATOS EN TABLA CONTACTO
-- ========================================

INSERT INTO sense.contacto (contactoid, usuarioid, medioid, celular, correo, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 1, 1, NULL, 'administrador@migivagroup.com', 1, 1, NOW(), 1, NOW()),  -- Email de Administrador
(2, 1, 3, '+56912345678', NULL, 1, 1, NOW(), 1, NOW()),                   -- WhatsApp de Administrador
(3, 2, 1, NULL, 'patricio.sandoval@migivagroup.com', 1, 1, NOW(), 1, NOW()), -- Email de Patricio Sandoval
(4, 2, 2, '+56987654321', NULL, 1, 1, NOW(), 1, NOW()),                   -- SMS de Patricio Sandoval
(5, 3, 1, NULL, 'jemner.vera@agricolaandrea.com', 1, 1, NOW(), 1, NOW()), -- Email de Jemner Vera
(6, 5, 1, NULL, 'patricio_sandoval@hotmail.com', 1, 1, NOW(), 1, NOW());  -- Email de patricio_sandoval

-- ========================================
-- 7. INSERTAR DATOS EN TABLA UMBRAL (SIN DEPENDENCIAS PROBLEMÁTICAS)
-- ========================================

-- NOTA: Usamos solo IDs que sabemos que existen (1) para evitar problemas de foreign key
INSERT INTO sense.umbral (umbralid, ubicacionid, criticidadid, nodoid, metricaid, umbral, maximo, minimo, tipoid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 1, 1, 1, 1, 'Temperatura', 35.0, 15.0, 1, 1, 1, NOW(), 1, NOW()),   -- Temperatura para Sensor Maceta 10cm
(2, 1, 1, 1, 1, 'Temperatura', 35.0, 15.0, 2, 1, 1, NOW(), 1, NOW()),   -- Temperatura para Sensor Maceta 20cm
(3, 1, 1, 1, 1, 'Temperatura', 35.0, 15.0, 3, 1, 1, NOW(), 1, NOW()),   -- Temperatura para Sensor Maceta 30cm
(4, 1, 2, 1, 2, 'Humedad', 80.0, 40.0, 1, 1, 1, NOW(), 1, NOW()),       -- Humedad para Sensor Maceta 10cm
(5, 1, 2, 1, 2, 'Humedad', 80.0, 40.0, 2, 1, 1, NOW(), 1, NOW()),       -- Humedad para Sensor Maceta 20cm
(6, 1, 2, 1, 2, 'Humedad', 80.0, 40.0, 3, 1, 1, NOW(), 1, NOW()),       -- Humedad para Sensor Maceta 30cm
(7, 1, 3, 1, 3, 'pH', 7.5, 5.5, 1, 1, 1, NOW(), 1, NOW()),              -- pH para Sensor Maceta 10cm
(8, 1, 3, 1, 3, 'pH', 7.5, 5.5, 2, 1, 1, NOW(), 1, NOW()),              -- pH para Sensor Maceta 20cm
(9, 1, 3, 1, 3, 'pH', 7.5, 5.5, 3, 1, 1, NOW(), 1, NOW());              -- pH para Sensor Maceta 30cm

-- ========================================
-- 8. INSERTAR DATOS EN TABLA PERFILUMBRAL
-- ========================================

INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid, usercreatedid, datecreated, usermodifiedid, datemodified) VALUES
(1, 1, 1, 1, NOW(), 1, NOW()),   -- Administrador recibe alertas de temperatura
(1, 4, 1, 1, NOW(), 1, NOW()),   -- Administrador recibe alertas de humedad
(1, 7, 1, 1, NOW(), 1, NOW()),   -- Administrador recibe alertas de pH
(2, 1, 1, 1, NOW(), 1, NOW()),   -- Supervisor recibe alertas de temperatura
(2, 4, 1, 1, NOW(), 1, NOW()),   -- Supervisor recibe alertas de humedad
(3, 1, 1, 1, NOW(), 1, NOW()),   -- Técnico recibe alertas de temperatura
(3, 4, 1, 1, NOW(), 1, NOW()),   -- Técnico recibe alertas de humedad
(4, 1, 1, 1, NOW(), 1, NOW());   -- Operador recibe alertas de temperatura

-- ========================================
-- 9. INSERTAR DATOS EN TABLA AUDIT_LOG_UMBRAL
-- ========================================

INSERT INTO sense.audit_log_umbral (auditid, umbralid, old_minimo, new_minimo, old_maximo, new_maximo, old_criticidadid, new_criticidadid, modified_by, modified_at, accion) VALUES
(1, 1, NULL, 15.0, NULL, 35.0, NULL, 1, 1, NOW(), 'INSERT'),
(2, 4, NULL, 40.0, NULL, 80.0, NULL, 2, 1, NOW(), 'INSERT'),
(3, 7, NULL, 5.5, NULL, 7.5, NULL, 3, 1, NOW(), 'INSERT');

-- ========================================
-- 10. VERIFICAR DATOS INSERTADOS
-- ========================================

SELECT 'Datos insertados correctamente' as resultado;

-- Contar registros en cada tabla
SELECT 'umbral' as tabla, COUNT(*) as total FROM sense.umbral
UNION ALL
SELECT 'perfilumbral' as tabla, COUNT(*) as total FROM sense.perfilumbral
UNION ALL
SELECT 'audit_log_umbral' as tabla, COUNT(*) as total FROM sense.audit_log_umbral
UNION ALL
SELECT 'criticidad' as tabla, COUNT(*) as total FROM sense.criticidad
UNION ALL
SELECT 'usuario' as tabla, COUNT(*) as total FROM sense.usuario
UNION ALL
SELECT 'perfil' as tabla, COUNT(*) as total FROM sense.perfil
UNION ALL
SELECT 'usuarioperfil' as tabla, COUNT(*) as total FROM sense.usuarioperfil
UNION ALL
SELECT 'contacto' as tabla, COUNT(*) as total FROM sense.contacto
UNION ALL
SELECT 'medio' as tabla, COUNT(*) as total FROM sense.medio
ORDER BY tabla;

-- Verificar usuarios existentes y sus perfiles asignados
SELECT 
    u.usuarioid,
    u.login,
    u.firstname,
    u.lastname,
    p.perfil,
    up.statusid as perfil_status
FROM sense.usuario u
LEFT JOIN sense.usuarioperfil up ON u.usuarioid = up.usuarioid
LEFT JOIN sense.perfil p ON up.perfilid = p.perfilid
WHERE u.statusid = 1
ORDER BY u.usuarioid;

-- ========================================
-- NOTA IMPORTANTE: TABLAS ALERTA Y MENSAJE NO SE INSERTAN
-- ========================================
-- 
-- Estas tablas tienen dependencias complejas que requieren:
-- 1. medicionid válidos (que no tenemos acceso)
-- 2. umbralid válidos (que ya insertamos)
-- 3. contactoid válidos (que ya insertamos)
-- 
-- Para insertar en estas tablas, necesitarías:
-- - IDs válidos de mediciones existentes
-- - O crear mediciones de prueba primero
-- 
-- Por ahora, nos enfocamos en las tablas de configuración
-- que son la base del sistema de alertas
