-- 🧹 LIMPIAR LOCALIZACIONES CON DATOS INVÁLIDOS
-- Ejecutar este script en el SQL Editor de Supabase

-- Opción 1: Eliminar localizaciones con latitud o longitud NULL
DELETE FROM sense.localizacion 
WHERE latitud IS NULL OR longitud IS NULL;

-- Opción 2: Eliminar localizaciones con latitud o longitud = 0
DELETE FROM sense.localizacion 
WHERE latitud = 0 OR longitud = 0;

-- Opción 3: Eliminar localizaciones con latitud o longitud vacía (string)
DELETE FROM sense.localizacion 
WHERE latitud = '' OR longitud = '';

-- Verificar cuántas entradas quedan
SELECT COUNT(*) as total_localizaciones FROM sense.localizacion;

-- Verificar que no hay más entradas con coordenadas inválidas
SELECT 
    ubicacionid, 
    nodoid, 
    entidadid, 
    latitud, 
    longitud, 
    referencia,
    statusid
FROM sense.localizacion 
WHERE latitud IS NULL 
   OR longitud IS NULL 
   OR latitud = 0 
   OR longitud = 0 
   OR latitud = '' 
   OR longitud = '';
