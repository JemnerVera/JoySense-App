-- Verificar estructura de la tabla sense.usuario
-- Este script verifica qué columnas existen en la tabla usuario

-- Verificar estructura de la tabla usuario
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'usuario'
ORDER BY ordinal_position;

-- Verificar si existe la columna 'nombre'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'sense' 
            AND table_name = 'usuario' 
            AND column_name = 'nombre'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as columna_nombre_status;

-- Verificar todas las columnas que contienen 'nom' en el nombre
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'usuario' 
AND column_name LIKE '%nom%'
ORDER BY column_name;
