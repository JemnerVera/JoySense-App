-- ============================================================================
-- ÍNDICE COMPUESTO PARA OPTIMIZAR CONSULTAS DE MEDICIONES POR NODO Y FECHA
-- ============================================================================
-- Este índice mejora significativamente el rendimiento de consultas que:
-- 1. Filtran por nodoid
-- 2. Ordenan por fecha (descendente o ascendente)
-- 3. Aplican límites (LIMIT)
--
-- SIN este índice: PostgreSQL debe escanear y ordenar millones de registros
-- CON este índice: PostgreSQL puede usar el índice para ordenar eficientemente
-- ============================================================================

-- Verificar si el índice ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'sense' 
        AND tablename = 'medicion' 
        AND indexname = 'idx_medicion_nodo_fecha_desc'
    ) THEN
        -- Crear índice compuesto para ordenamiento descendente (más recientes primero)
        CREATE INDEX idx_medicion_nodo_fecha_desc 
        ON sense.medicion(nodoid, fecha DESC);
        
        RAISE NOTICE '✅ Índice idx_medicion_nodo_fecha_desc creado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ El índice idx_medicion_nodo_fecha_desc ya existe';
    END IF;
END $$;

-- Opcional: Crear también un índice para ordenamiento ascendente (más antiguos primero)
-- Esto puede ser útil para consultas que necesitan datos históricos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'sense' 
        AND tablename = 'medicion' 
        AND indexname = 'idx_medicion_nodo_fecha_asc'
    ) THEN
        CREATE INDEX idx_medicion_nodo_fecha_asc 
        ON sense.medicion(nodoid, fecha ASC);
        
        RAISE NOTICE '✅ Índice idx_medicion_nodo_fecha_asc creado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ El índice idx_medicion_nodo_fecha_asc ya existe';
    END IF;
END $$;

-- Verificar índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'sense' 
AND tablename = 'medicion'
AND indexname LIKE 'idx_medicion_nodo_fecha%'
ORDER BY indexname;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. La creación del índice puede tardar varios minutos si hay millones de registros
-- 2. El índice ocupará espacio adicional en disco (aproximadamente 20-30% del tamaño de la tabla)
-- 3. Las inserciones serán ligeramente más lentas (el índice debe actualizarse)
-- 4. Las consultas con filtros de fecha serán MUCHO más rápidas
-- 5. Para verificar el uso del índice: EXPLAIN ANALYZE SELECT ... FROM sense.medicion WHERE nodoid = X ORDER BY fecha DESC LIMIT 100;
-- ============================================================================

