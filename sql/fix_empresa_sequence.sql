-- Script para corregir la secuencia de empresaid en la tabla empresa
-- Este script verifica y actualiza la secuencia para que esté sincronizada con los valores reales

-- 1. Verificar el estado actual de la secuencia
SELECT 
    'Estado actual de la secuencia' as descripcion,
    last_value as ultimo_valor_secuencia,
    is_called as secuencia_llamada
FROM sense.empresa_empresaid_seq;

-- 2. Verificar el máximo ID actual en la tabla
SELECT 
    'Máximo ID en la tabla' as descripcion,
    COALESCE(MAX(empresaid), 0) as max_id_tabla
FROM sense.empresa;

-- 3. Obtener el nombre real de la secuencia (puede variar según la configuración)
-- Primero verificamos el nombre de la secuencia
SELECT pg_get_serial_sequence('sense.empresa', 'empresaid') as nombre_secuencia;

-- 4. Corregir la secuencia para que el próximo valor sea mayor que el máximo actual
-- Esto asegura que no haya conflictos de claves duplicadas
-- NOTA: Si el nombre de la secuencia es diferente, ajustar según el resultado del paso 3
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    -- Obtener el nombre de la secuencia
    SELECT pg_get_serial_sequence('sense.empresa', 'empresaid') INTO seq_name;
    
    -- Obtener el máximo ID actual
    SELECT COALESCE(MAX(empresaid), 0) INTO max_id FROM sense.empresa;
    
    -- Actualizar la secuencia
    IF seq_name IS NOT NULL THEN
        EXECUTE format('SELECT setval(%L, %s, false)', seq_name, max_id + 1);
        RAISE NOTICE 'Secuencia % actualizada. Próximo valor: %', seq_name, max_id + 1;
    ELSE
        RAISE EXCEPTION 'No se pudo encontrar la secuencia para sense.empresa.empresaid';
    END IF;
END $$;

-- 4. Verificar el nuevo estado de la secuencia
SELECT 
    'Estado después de la corrección' as descripcion,
    last_value as ultimo_valor_secuencia,
    is_called as secuencia_llamada
FROM sense.empresa_empresaid_seq;

-- Nota: Si el nombre de la secuencia es diferente, ajustar según corresponda
-- Para verificar el nombre de la secuencia, ejecutar:
-- SELECT pg_get_serial_sequence('sense.empresa', 'empresaid');

