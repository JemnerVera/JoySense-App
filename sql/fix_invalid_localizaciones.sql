-- 🔧 CORREGIR LOCALIZACIONES CON DATOS INVÁLIDOS
-- Ejecutar este script en el SQL Editor de Supabase

-- Opción 1: Actualizar coordenadas NULL con valores por defecto (ejemplo: Lima, Perú)
UPDATE sense.localizacion 
SET 
    latitud = -12.0464,
    longitud = -77.0428,
    referencia = 'Coordenadas corregidas automáticamente'
WHERE latitud IS NULL OR longitud IS NULL;

-- Opción 2: Actualizar coordenadas = 0 con valores por defecto
UPDATE sense.localizacion 
SET 
    latitud = -12.0464,
    longitud = -77.0428,
    referencia = 'Coordenadas corregidas automáticamente'
WHERE latitud = 0 OR longitud = 0;

-- Opción 3: Actualizar coordenadas vacías con valores por defecto
UPDATE sense.localizacion 
SET 
    latitud = -12.0464,
    longitud = -77.0428,
    referencia = 'Coordenadas corregidas automáticamente'
WHERE latitud = '' OR longitud = '';

-- Verificar que todas las entradas tienen coordenadas válidas
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
