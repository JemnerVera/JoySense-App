-- Script para corregir la secuencia de sense.codigotelefono
-- Ajustar la secuencia para que comience desde el siguiente ID disponible

-- Verificar el ID máximo actual
SELECT MAX(codigotelefonoid) as max_id FROM sense.codigotelefono;

-- Ajustar la secuencia para que comience desde el siguiente ID
SELECT setval('sense.codigotelefono_codigotelefonoid_seq', 
              (SELECT MAX(codigotelefonoid) FROM sense.codigotelefono), 
              true);

-- Verificar que la secuencia está correcta
SELECT last_value FROM sense.codigotelefono_codigotelefonoid_seq;

-- Verificar el siguiente valor que se generará
SELECT nextval('sense.codigotelefono_codigotelefonoid_seq') as next_id;
