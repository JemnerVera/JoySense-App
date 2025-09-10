-- ACTUALIZAR DATOS DE CONTACTO DE USUARIOS
-- Este script actualiza los usuarios existentes con datos de contacto
-- para el sistema de mensajes de alerta

-- Actualizar datos de contacto de usuarios existentes
UPDATE sense.usuario 
SET 
    telefono = '+56912345678',
    whatsapp = '+56912345678',
    email = 'administrador@migivagroup.com',
    preferencia_mensaje = 'whatsapp'
WHERE usuarioid = 1 AND login = 'administrador@migivagroup.com';

UPDATE sense.usuario 
SET 
    telefono = '+56987654321',
    whatsapp = '+56987654321',
    email = 'patricio.sandoval@migivagroup.com',
    preferencia_mensaje = 'whatsapp'
WHERE usuarioid = 2 AND login = 'patricio.sandoval@migivagroup.com';

UPDATE sense.usuario 
SET 
    telefono = '+56911223344',
    whatsapp = '+56911223344',
    email = 'jemner.vera@agricolaandrea.com',
    preferencia_mensaje = 'whatsapp'
WHERE usuarioid = 3 AND login = 'jemner.vera@agricolaandrea.com';

UPDATE sense.usuario 
SET 
    telefono = '+56955667788',
    whatsapp = '+56955667788',
    email = 'patricio_sandoval@hotmail.com',
    preferencia_mensaje = 'whatsapp'
WHERE usuarioid = 5 AND login = 'patricio_sandoval@hotmail.com';

-- Verificar datos actualizados
SELECT '👥 USUARIOS CON DATOS DE CONTACTO:' as info;
SELECT 
    usuarioid,
    login,
    firstname,
    lastname,
    telefono,
    whatsapp,
    email,
    preferencia_mensaje
FROM sense.usuario
ORDER BY usuarioid;

-- Resumen de usuarios por preferencia de mensaje
SELECT '📱 PREFERENCIAS DE MENSAJE:' as info;
SELECT 
    preferencia_mensaje,
    COUNT(*) as total_usuarios
FROM sense.usuario
GROUP BY preferencia_mensaje
ORDER BY total_usuarios DESC;
