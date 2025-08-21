-- 🔐 OTORGAR PERMISOS A TODAS LAS TABLAS DEL SCHEMA SENSE
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Otorgar permisos SELECT a todas las tablas del schema sense
GRANT SELECT ON TABLE sense.pais TO service_role;
GRANT SELECT ON TABLE sense.empresa TO service_role;
GRANT SELECT ON TABLE sense.fundo TO service_role;
GRANT SELECT ON TABLE sense.medicion TO service_role;
GRANT SELECT ON TABLE sense.ubicacion TO service_role;
GRANT SELECT ON TABLE sense.localizacion TO service_role;
GRANT SELECT ON TABLE sense.entidad TO service_role;
GRANT SELECT ON TABLE sense.metrica TO service_role;
GRANT SELECT ON TABLE sense.nodo TO service_role;
GRANT SELECT ON TABLE sense.tipo TO service_role;

-- 2. Verificar que todos los permisos se otorgaron correctamente
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'sense' 
AND grantee = 'service_role'
ORDER BY table_name;

-- 3. Probar acceso a todas las tablas
SELECT 'pais' as tabla, COUNT(*) as total FROM sense.pais
UNION ALL
SELECT 'empresa' as tabla, COUNT(*) as total FROM sense.empresa
UNION ALL
SELECT 'fundo' as tabla, COUNT(*) as total FROM sense.fundo
UNION ALL
SELECT 'medicion' as tabla, COUNT(*) as total FROM sense.medicion
UNION ALL
SELECT 'ubicacion' as tabla, COUNT(*) as total FROM sense.ubicacion
UNION ALL
SELECT 'localizacion' as tabla, COUNT(*) as total FROM sense.localizacion
UNION ALL
SELECT 'entidad' as tabla, COUNT(*) as total FROM sense.entidad
UNION ALL
SELECT 'metrica' as tabla, COUNT(*) as total FROM sense.metrica
UNION ALL
SELECT 'nodo' as tabla, COUNT(*) as total FROM sense.nodo
UNION ALL
SELECT 'tipo' as tabla, COUNT(*) as total FROM sense.tipo;
