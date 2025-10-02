-- Verificar esquema actual de la tabla sense.criticidad
-- Este script verifica las columnas y constraints de la tabla criticidad

-- Verificar todas las columnas de la tabla criticidad
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'criticidad'
ORDER BY ordinal_position;

-- Verificar constraints de la tabla criticidad
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'sense' 
AND tc.table_name = 'criticidad'
ORDER BY tc.constraint_name;

-- Verificar datos actuales en la tabla
SELECT * FROM sense.criticidad ORDER BY criticidadid;
