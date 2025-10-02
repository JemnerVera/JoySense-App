-- Verificar columnas de la tabla sense.usuario
-- Este script verifica qué columnas existen para corregir el JOIN en el backend

-- Verificar todas las columnas de la tabla usuario
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'usuario'
ORDER BY ordinal_position;

-- Verificar si existen columnas relacionadas con nombres
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'usuario' 
AND (column_name LIKE '%nom%' OR column_name LIKE '%name%' OR column_name LIKE '%login%' OR column_name LIKE '%user%')
ORDER BY column_name;
