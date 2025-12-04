-- ============================================================================
-- CREAR USUARIO backend_user PARA EL BACKEND
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Crear el rol/usuario
CREATE ROLE backend_user LOGIN PASSWORD 'JoySense_Backend_2024!';

-- 2. Permisos en la base de datos
GRANT CONNECT ON DATABASE postgres TO backend_user;

-- 3. Acceso al schema joysense
GRANT USAGE ON SCHEMA joysense TO backend_user;

-- 4. Permisos en TODAS las tablas (SELECT, INSERT, UPDATE - sin DELETE)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA joysense TO backend_user;

-- 5. Permisos en secuencias (para auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA joysense TO backend_user;

-- 6. Permiso SOLO en la función que usa el backend
GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO backend_user;

-- ============================================================================
-- NOTA: Cambia la contraseña 'JoySense_Backend_2024!' por una más segura
-- y guárdala en el archivo .env del backend
-- ============================================================================

-- Verificar permisos (opcional):
-- SELECT grantee, privilege_type, table_name 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'joysense' AND grantee = 'backend_user';

