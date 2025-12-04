-- ============================================================================
-- REVOCAR PERMISOS DE service_role
-- Ejecutar ANTES de configurar backend_user
-- ============================================================================

-- Revocar permisos de tablas específicas
REVOKE SELECT, INSERT, UPDATE ON joysense.usuario FROM service_role;
REVOKE SELECT, INSERT, UPDATE ON joysense.pais FROM service_role;

-- Revocar permisos de secuencias
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA joysense FROM service_role;

-- Revocar acceso al schema (ejecutar al final)
REVOKE USAGE ON SCHEMA joysense FROM service_role;

-- ============================================================================
-- Verificar que se revocaron los permisos
-- ============================================================================
-- SELECT grantee, privilege_type, table_name 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'joysense' AND grantee = 'service_role';

