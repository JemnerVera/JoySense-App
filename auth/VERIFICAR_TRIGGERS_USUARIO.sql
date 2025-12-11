-- ============================================================================
-- VERIFICAR ESTADO DE TODOS LOS TRIGGERS DE USUARIO
-- ============================================================================

-- Verificar todos los triggers en la tabla usuario
SELECT 
    tgname AS trigger_name,
    tgenabled AS enabled,
    CASE tgenabled
        WHEN 'O' THEN '✅ HABILITADO (origin)'
        WHEN 'D' THEN '❌ DESHABILITADO (disabled)'
        WHEN 'R' THEN '⚠️ REPLICA (replica)'
        WHEN 'A' THEN '✅ HABILITADO (always)'
        ELSE '❓ DESCONOCIDO: ' || tgenabled
    END AS estado,
    pg_get_triggerdef(oid) AS definicion
FROM pg_trigger
WHERE tgrelid = 'joysense.usuario'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
