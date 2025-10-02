-- Verificar el schema actual de la tabla sense.perfil
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'perfil'
ORDER BY ordinal_position;
