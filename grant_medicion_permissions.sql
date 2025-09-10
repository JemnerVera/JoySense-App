-- ========================================
-- PERMISOS TEMPORALES PARA PRUEBAS - TABLA MEDICION
-- ========================================
-- Este script otorga permisos temporales para insertar en sense.medicion
-- SOLO para propósitos de prueba del trigger
-- 
-- IMPORTANTE: Estos permisos deben ser REVOCADOS después de las pruebas
-- ya que la tabla medicion normalmente solo debe recibir datos del sistema LoRaWAN

-- ========================================
-- 1. VERIFICAR USUARIO ACTUAL
-- ========================================

SELECT 
    'Usuario actual:' as info,
    current_user as usuario,
    session_user as sesion;

-- ========================================
-- 2. VERIFICAR PERMISOS ACTUALES
-- ========================================

SELECT 
    'Permisos actuales en sense.medicion:' as info,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'sense' 
  AND table_name = 'medicion'
ORDER BY privilege_type, grantee;

-- ========================================
-- 3. OTORGAR PERMISOS TEMPORALES
-- ========================================

-- Dar permisos de INSERT solo a usuarios autenticados (para pruebas)
GRANT INSERT ON sense.medicion TO authenticated;

-- Opcional: Dar permisos a un usuario específico si es necesario
-- GRANT INSERT ON sense.medicion TO tu_usuario_especifico;

-- ========================================
-- 4. VERIFICAR PERMISOS APLICADOS
-- ========================================

SELECT 
    'Permisos después de otorgar:' as info,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'sense' 
  AND table_name = 'medicion'
  AND privilege_type = 'INSERT'
ORDER BY grantee;

-- ========================================
-- 5. PROBAR INSERCIÓN (OPCIONAL)
-- ========================================

-- Descomentar para probar que los permisos funcionan:
/*
INSERT INTO sense.medicion (medicion, fecha, ubicacionid, metricaid, nodoid, tipoid)
VALUES (99.99, NOW(), 1, 1, 1, 1);

-- Verificar que se insertó
SELECT 'Prueba de inserción:' as info, COUNT(*) as total_mediciones 
FROM sense.medicion WHERE medicion = 99.99;

-- Limpiar la prueba
DELETE FROM sense.medicion WHERE medicion = 99.99;
*/

-- ========================================
-- 6. SCRIPT PARA REVOCAR PERMISOS (EJECUTAR DESPUÉS DE PRUEBAS)
-- ========================================

/*
-- IMPORTANTE: Ejecutar este bloque después de completar las pruebas
-- para revocar los permisos temporales:

REVOKE INSERT ON sense.medicion FROM authenticated;

-- Verificar que se revocaron
SELECT 
    'Permisos después de revocar:' as info,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'sense' 
  AND table_name = 'medicion'
  AND privilege_type = 'INSERT'
ORDER BY grantee;
*/

-- ========================================
-- 7. INSTRUCCIONES DE USO
-- ========================================

/*
INSTRUCCIONES:

1. ANTES DE LAS PRUEBAS:
   - Ejecutar este script para otorgar permisos
   - Verificar que los permisos se aplicaron correctamente

2. DURANTE LAS PRUEBAS:
   - Ejecutar el script de prueba del trigger
   - Los permisos permitirán insertar en sense.medicion

3. DESPUÉS DE LAS PRUEBAS:
   - Ejecutar el bloque de revocación (líneas 6)
   - Verificar que los permisos se revocaron
   - La tabla vuelve a su estado de solo lectura para usuarios

NOTAS DE SEGURIDAD:
- Estos permisos son TEMPORALES y solo para pruebas
- La tabla medicion normalmente solo debe recibir datos del sistema LoRaWAN
- Siempre revocar los permisos después de las pruebas
- Solo se otorgan permisos a usuarios autenticados (authenticated)
- NO se otorgan permisos a usuarios anónimos (anon) por seguridad
*/
