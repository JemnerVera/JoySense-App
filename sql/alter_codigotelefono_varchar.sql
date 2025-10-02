-- Script para alterar la tabla sense.codigotelefono
-- Cambiar el campo codigotelefono de varchar(4) a varchar(8)

-- Alterar la columna codigotelefono para permitir hasta 8 caracteres
ALTER TABLE sense.codigotelefono 
ALTER COLUMN codigotelefono TYPE character varying(8);

-- Verificar el cambio
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'codigotelefono' 
AND column_name = 'codigotelefono';
