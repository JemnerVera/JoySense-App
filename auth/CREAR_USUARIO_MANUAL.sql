-- ============================================================================
-- CREAR USUARIO MANUALMENTE (Método recomendado por el DBA)
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Crea el usuario en Supabase Dashboard → Authentication → Users → Add User
--    - Email: el email del usuario (ej: usuario.1@prueba.com)
--    - Password: la contraseña que quieres usar
--    - Marca "Auto Confirm User" para confirmar el email automáticamente
-- 2. Copia el UUID del usuario creado (está en la tabla de usuarios)
-- 3. Ejecuta este script actualizando el UUID, email y contraseña
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR USUARIO EN auth.users (después de crearlo en Supabase UI)
-- ============================================================================
SELECT 
    id AS uuid,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'usuario.1@prueba.com'  -- Cambia por el email del usuario
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: CREAR USUARIO EN joysense.usuario CON EL UUID DE SUPABASE
-- ============================================================================
-- IMPORTANTE: Usa la misma contraseña que usaste en Supabase UI
-- El password_hash se generará automáticamente cuando insertes desde la WebApp
-- O puedes hashearlo manualmente usando bcrypt

-- Opción A: Insertar desde la WebApp (recomendado)
-- 1. Ve a la WebApp → USUARIOS → CREAR
-- 2. Ingresa los datos del usuario
-- 3. Usa la misma contraseña que usaste en Supabase UI
-- 4. Después de crear, ejecuta el PASO 3 para actualizar el useruuid

-- Opción B: Insertar manualmente desde SQL (solo si es necesario)
-- NOTA: Necesitas hashear la contraseña primero
/*
INSERT INTO joysense.usuario (
    login,
    firstname,
    lastname,
    password_hash,  -- ⚠️ Debe estar hasheado con bcrypt
    statusid,
    usercreatedid,
    usermodifiedid,
    useruuid  -- ⚠️ UUID copiado de Supabase UI
)
VALUES (
    'usuario.1@prueba.com',  -- ⚠️ Cambia por el email
    'usuario.1',             -- ⚠️ Cambia por el nombre
    'prueba',                -- ⚠️ Cambia por el apellido
    '$2b$10$...',            -- ⚠️ Hash de la contraseña (usa bcrypt)
    1,                        -- statusid = 1 (activo)
    1,                        -- usercreatedid (ID del admin)
    1,                        -- usermodifiedid (ID del admin)
    'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid  -- ⚠️ UUID de Supabase UI
);
*/

-- ============================================================================
-- PASO 3: ACTUALIZAR useruuid EN joysense.usuario (si ya existe el usuario)
-- ============================================================================
-- Si el usuario ya existe en joysense.usuario pero no tiene useruuid,
-- actualiza el useruuid con el UUID de Supabase
UPDATE joysense.usuario
SET 
    useruuid = 'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid,  -- ⚠️ CAMBIA ESTE UUID
    datemodified = now()
WHERE login = 'usuario.1@prueba.com'  -- ⚠️ CAMBIA ESTE EMAIL
  AND (useruuid IS NULL OR useruuid != 'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid);

-- ============================================================================
-- PASO 4: VERIFICAR QUE TODO ESTÉ CORRECTO
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.firstname,
    u.lastname,
    u.useruuid,
    au.id AS auth_user_id,
    au.email AS auth_email,
    au.email_confirmed_at,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ UUID coincide'
        ELSE '❌ UUID NO coincide'
    END AS estado_uuid,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
        ELSE '❌ Email NO confirmado'
    END AS estado_email
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.1@prueba.com'  -- Cambia por el email del usuario
ORDER BY u.usuarioid DESC;

-- ============================================================================
-- PASO 5: CREAR CORREO PRINCIPAL (si no existe)
-- ============================================================================
INSERT INTO joysense.correo (
    usuarioid,
    correo,
    statusid,
    usercreatedid
)
SELECT 
    u.usuarioid,
    u.login,
    1,  -- statusid = 1 (activo)
    1   -- usercreatedid (ID del admin)
FROM joysense.usuario u
WHERE u.login = 'usuario.1@prueba.com'  -- Cambia por el email del usuario
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.correo c 
      WHERE c.usuarioid = u.usuarioid 
        AND c.correo = u.login
  );

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. SIEMPRE crea el usuario primero en Supabase UI antes de insertar en joysense.usuario
-- 2. Usa la MISMA contraseña en ambos lugares (Supabase UI y joysense.usuario)
-- 3. Copia el UUID exacto de Supabase UI (está en la columna "UUID" o "id")
-- 4. El password_hash en joysense.usuario debe ser el hash de la contraseña
--    (se genera automáticamente si insertas desde la WebApp)
-- 5. Después de crear el usuario, asigna un perfil en "Perfil de Usuario"
-- 6. Crea permisos geográficos en "GESTIÓN DE PERMISOS"
--
-- ============================================================================
