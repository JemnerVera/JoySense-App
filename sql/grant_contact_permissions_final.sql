-- Otorgar permisos para las tablas de contacto
-- Este script otorga permisos SOLO para service_role (backend) y authenticated (usuarios autenticados)

-- Otorgar permisos de uso en el schema
GRANT USAGE ON SCHEMA sense TO authenticated, service_role;

-- Permisos para codigotelefono (datos públicos - RLS deshabilitado)
GRANT SELECT ON TABLE sense.codigotelefono TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE sense.codigotelefono TO service_role;
GRANT USAGE, SELECT ON SEQUENCE sense.codigotelefono_codigotelefonoid_seq TO authenticated, service_role;

-- Permisos para correo (datos privados - RLS habilitado)
GRANT SELECT ON TABLE sense.correo TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE sense.correo TO service_role;

-- Permisos para contacto (datos privados - RLS habilitado)
GRANT SELECT ON TABLE sense.contacto TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE sense.contacto TO service_role;

-- Verificar permisos otorgados
SELECT 
    'codigotelefono' as tabla,
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'sense' 
AND tablename = 'codigotelefono'

UNION ALL

SELECT 
    'correo' as tabla,
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'sense' 
AND tablename = 'correo'

UNION ALL

SELECT 
    'contacto' as tabla,
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'sense' 
AND tablename = 'contacto';

-- Verificar secuencias existentes
SELECT 
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences 
WHERE schemaname = 'sense' 
AND sequencename IN ('codigotelefono_codigotelefonoid_seq', 'correo_correoid_seq', 'contacto_contactoid_seq')
ORDER BY sequencename;
