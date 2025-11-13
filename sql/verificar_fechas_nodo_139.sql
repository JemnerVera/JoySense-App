-- ============================================================================
-- SCRIPT PARA VERIFICAR FECHAS DISPONIBLES DEL NODO 139
-- ============================================================================
-- Este script muestra las últimas fechas de mediciones y estadísticas
-- para entender por qué no se encuentran datos en rangos recientes
-- ============================================================================

-- 1. ÚLTIMAS 10 FECHAS DE MEDICIONES DEL NODO 139
-- ============================================================================
SELECT 
  fecha,
  COUNT(*) as cantidad_mediciones,
  MIN(medicion) as valor_minimo,
  MAX(medicion) as valor_maximo,
  AVG(medicion) as valor_promedio
FROM sense.medicion
WHERE nodoid = 139
GROUP BY fecha
ORDER BY fecha DESC
LIMIT 10;

-- 2. ESTADÍSTICAS GENERALES DEL NODO 139
-- ============================================================================
SELECT 
  COUNT(*) as total_mediciones,
  MIN(fecha) as fecha_mas_antigua,
  MAX(fecha) as fecha_mas_reciente,
  MAX(fecha) - MIN(fecha) as rango_fechas,
  COUNT(DISTINCT fecha) as dias_con_datos,
  COUNT(DISTINCT tipoid) as tipos_sensor,
  COUNT(DISTINCT metricaid) as metricas
FROM sense.medicion
WHERE nodoid = 139;

-- 3. DISTRIBUCIÓN DE MEDICIONES POR MES
-- ============================================================================
SELECT 
  DATE_TRUNC('month', fecha) as mes,
  COUNT(*) as total_mediciones,
  MIN(fecha) as primera_fecha_mes,
  MAX(fecha) as ultima_fecha_mes
FROM sense.medicion
WHERE nodoid = 139
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

-- 4. MEDICIONES EN LOS ÚLTIMOS 30 DÍAS (RANGO QUE ESTAMOS BUSCANDO)
-- ============================================================================
SELECT 
  COUNT(*) as mediciones_ultimos_30_dias,
  MIN(fecha) as fecha_minima,
  MAX(fecha) as fecha_maxima
FROM sense.medicion
WHERE nodoid = 139
  AND fecha >= CURRENT_DATE - INTERVAL '30 days'
  AND fecha <= CURRENT_DATE + INTERVAL '1 day';

-- 5. MEDICIONES EN LOS ÚLTIMOS 7 DÍAS
-- ============================================================================
SELECT 
  COUNT(*) as mediciones_ultimos_7_dias,
  MIN(fecha) as fecha_minima,
  MAX(fecha) as fecha_maxima
FROM sense.medicion
WHERE nodoid = 139
  AND fecha >= CURRENT_DATE - INTERVAL '7 days'
  AND fecha <= CURRENT_DATE + INTERVAL '1 day';

-- 6. MEDICIONES EN LOS ÚLTIMOS 14 DÍAS
-- ============================================================================
SELECT 
  COUNT(*) as mediciones_ultimos_14_dias,
  MIN(fecha) as fecha_minima,
  MAX(fecha) as fecha_maxima
FROM sense.medicion
WHERE nodoid = 139
  AND fecha >= CURRENT_DATE - INTERVAL '14 days'
  AND fecha <= CURRENT_DATE + INTERVAL '1 day';

-- 7. ÚLTIMAS 20 MEDICIONES INDIVIDUALES (MUESTRA DETALLADA)
-- ============================================================================
SELECT 
  medicionid,
  fecha,
  medicion,
  tipoid,
  metricaid,
  ubicacionid
FROM sense.medicion
WHERE nodoid = 139
ORDER BY fecha DESC, medicionid DESC
LIMIT 20;

-- 8. VERIFICAR SI HAY DATOS DESPUÉS DE UNA FECHA ESPECÍFICA
-- ============================================================================
-- Ajusta la fecha según necesites
SELECT 
  COUNT(*) as mediciones_despues_fecha,
  MIN(fecha) as primera_fecha,
  MAX(fecha) as ultima_fecha
FROM sense.medicion
WHERE nodoid = 139
  AND fecha >= '2025-10-01 00:00:00';

-- 9. GAPS EN LAS MEDICIONES (DÍAS SIN DATOS)
-- ============================================================================
-- Muestra los días más recientes que NO tienen datos
WITH dias_con_datos AS (
  SELECT DISTINCT DATE(fecha) as dia
  FROM sense.medicion
  WHERE nodoid = 139
),
todos_los_dias AS (
  SELECT generate_series(
    (SELECT MIN(DATE(fecha)) FROM sense.medicion WHERE nodoid = 139),
    CURRENT_DATE,
    '1 day'::interval
  )::date as dia
)
SELECT 
  t.dia,
  CASE WHEN d.dia IS NULL THEN 'SIN DATOS' ELSE 'CON DATOS' END as estado
FROM todos_los_dias t
LEFT JOIN dias_con_datos d ON t.dia = d.dia
WHERE t.dia >= CURRENT_DATE - INTERVAL '60 days'
ORDER BY t.dia DESC
LIMIT 30;

-- 10. RESUMEN EJECUTIVO
-- ============================================================================
SELECT 
  'NODO 139' as nodo,
  (SELECT COUNT(*) FROM sense.medicion WHERE nodoid = 139) as total_mediciones,
  (SELECT MIN(fecha) FROM sense.medicion WHERE nodoid = 139) as fecha_primera_medicion,
  (SELECT MAX(fecha) FROM sense.medicion WHERE nodoid = 139) as fecha_ultima_medicion,
  (SELECT COUNT(*) FROM sense.medicion WHERE nodoid = 139 AND fecha >= CURRENT_DATE - INTERVAL '7 days') as mediciones_ultimos_7_dias,
  (SELECT COUNT(*) FROM sense.medicion WHERE nodoid = 139 AND fecha >= CURRENT_DATE - INTERVAL '30 days') as mediciones_ultimos_30_dias,
  CASE 
    WHEN (SELECT MAX(fecha) FROM sense.medicion WHERE nodoid = 139) >= CURRENT_DATE - INTERVAL '7 days' THEN 'DATOS RECIENTES'
    WHEN (SELECT MAX(fecha) FROM sense.medicion WHERE nodoid = 139) >= CURRENT_DATE - INTERVAL '30 days' THEN 'DATOS ANTIGUOS (7-30 días)'
    ELSE 'DATOS MUY ANTIGUOS (>30 días)'
  END as estado_datos;

