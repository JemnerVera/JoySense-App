-- ============================================================================
-- CREAR USUARIO MANUALMENTE (Método recomendado por el DBA)
-- ============================================================================
-- ORDEN RECOMENDADO:
-- 1. Crear usuario en joysense.usuario (desde WebApp o SQL) con useruuid = NULL
-- 2. Crear usuario en Supabase Dashboard → Authentication → Users
-- 3. Actualizar useruuid en joysense.usuario con el UUID de Supabase
-- 4. Crear correo principal
-- 5. Asignar perfil y permisos geográficos
--
-- ============================================================================
-- DIFERENCIAS: Dashboard vs Query SQL directa
-- ============================================================================
-- DASHBOARD (Recomendado):
--   ✅ Usa la API interna de Supabase
--   ✅ Maneja correctamente la seguridad y encriptación
--   ✅ Crea automáticamente la entrada en auth.identities
--   ✅ Configura correctamente los metadatos (raw_app_meta_data, raw_user_meta_data)
--   ✅ Respeta los mecanismos de seguridad de Supabase
--
-- INSERT DIRECTA EN auth.users (NO recomendado):
--   ❌ Bypassa los mecanismos de seguridad de Supabase
--   ❌ Puede causar problemas de autenticación ("Database error querying schema")
--   ❌ No crea automáticamente auth.identities correctamente
--   ❌ Puede dejar campos NULL que causan problemas
--
-- CONCLUSIÓN: SIEMPRE usar Dashboard para crear usuarios en auth.users
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR USUARIO EN joysense.usuario (con useruuid = NULL)
-- ============================================================================
-- Opción A: Desde la WebApp (RECOMENDADO)
-- 1. Ve a la WebApp → USUARIOS → CREAR
-- 2. Ingresa los datos:
--    - Login: usuario.prueba.1@prueba.com
--    - Firstname: Usuario
--    - Lastname: Prueba 1
--    - Password: (la contraseña que usarás, ej: Prueba123*)
--    - Status: ACTIVO
-- 3. El backend hasheará automáticamente la contraseña
-- 4. El useruuid quedará como NULL (se actualizará después)

-- Opción B: Desde SQL (solo si es necesario)
-- NOTA: Necesitas hashear la contraseña con bcrypt primero
-- Puedes usar: SELECT crypt('Prueba123*', gen_salt('bf', 10));
/*
INSERT INTO joysense.usuario (
    login,
    firstname,
    lastname,
    password_hash,  -- ⚠️ Debe estar hasheado con bcrypt
    statusid,
    usercreatedid,
    usermodifiedid,
    datecreated,
    datemodified,
    useruuid  -- ⚠️ NULL por ahora, se actualizará después
)
VALUES (
    'usuario.prueba.1@prueba.com',  -- ⚠️ Cambia por el email
    'Usuario',                      -- ⚠️ Cambia por el nombre
    'Prueba 1',                     -- ⚠️ Cambia por el apellido
    '$2b$10$...',                   -- ⚠️ Hash de la contraseña (usa bcrypt o crypt)
    1,                               -- statusid = 1 (activo)
    1,                               -- usercreatedid (ID del admin)
    1,                               -- usermodifiedid (ID del admin)
    now(),                           -- datecreated
    now(),                           -- datemodified
    NULL                             -- useruuid = NULL (se actualizará después)
);
*/

-- Verificar que se creó correctamente
SELECT 
    usuarioid,
    login,
    firstname,
    lastname,
    useruuid,
    statusid
FROM joysense.usuario
WHERE login = 'usuario.prueba.1@prueba.com'  -- ⚠️ Cambia por el email
ORDER BY usuarioid DESC;

-- ============================================================================
-- PASO 2: CREAR USUARIO EN SUPABASE DASHBOARD
-- ============================================================================
-- 1. Ve a Supabase Dashboard → Authentication → Users → Add User
-- 2. Ingresa:
--    - Email: usuario.prueba.1@prueba.com (MISMO email que en joysense.usuario)
--    - Password: Prueba123* (MISMA contraseña que en joysense.usuario)
--    - Marca "Auto Confirm User" para confirmar el email automáticamente
-- 3. Copia el UUID del usuario creado (está en la columna "UUID" o "id")
--    Ejemplo: fbfeac53-de01-46f1-b5e3-d00d62111235

-- Verificar que se creó en auth.users
SELECT 
    id AS uuid,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'  -- ⚠️ Cambia por el email
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 3: ACTUALIZAR useruuid EN joysense.usuario
-- ============================================================================
-- Reemplaza el UUID con el que copiaste del Dashboard
UPDATE joysense.usuario
SET 
    useruuid = 'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid,  -- ⚠️ CAMBIA ESTE UUID
    datemodified = now(),
    usermodifiedid = 1  -- ID del admin
WHERE login = 'usuario.prueba.1@prueba.com'  -- ⚠️ CAMBIA ESTE EMAIL
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
    au.confirmed_at,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ UUID coincide'
        ELSE '❌ UUID NO coincide'
    END AS estado_uuid,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
        ELSE '❌ Email NO confirmado'
    END AS estado_email,
    CASE 
        WHEN au.confirmed_at IS NOT NULL THEN '✅ Usuario confirmado'
        ELSE '❌ Usuario NO confirmado'
    END AS estado_confirmacion
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.prueba.1@prueba.com'  -- ⚠️ Cambia por el email
ORDER BY u.usuarioid DESC;

-- ============================================================================
-- PASO 5: CREAR CORREO PRINCIPAL (si no existe)
-- ============================================================================
INSERT INTO joysense.correo (
    usuarioid,
    correo,
    statusid,
    usercreatedid,
    datecreated
)
SELECT 
    u.usuarioid,
    u.login,
    1,  -- statusid = 1 (activo)
    1,  -- usercreatedid (ID del admin)
    now()
FROM joysense.usuario u
WHERE u.login = 'usuario.prueba.1@prueba.com'  -- ⚠️ Cambia por el email
  AND NOT EXISTS (
      SELECT 1 
      FROM joysense.correo c 
      WHERE c.usuarioid = u.usuarioid 
        AND c.correo = u.login
  );

-- Verificar que se creó el correo
SELECT 
    c.correoid,
    c.usuarioid,
    c.correo,
    c.statusid
FROM joysense.correo c
INNER JOIN joysense.usuario u ON c.usuarioid = u.usuarioid
WHERE u.login = 'usuario.prueba.1@prueba.com'  -- ⚠️ Cambia por el email
ORDER BY c.correoid DESC;

-- ============================================================================
-- PASO 6: ASIGNAR PERFIL Y PERMISOS (desde la WebApp)
-- ============================================================================
-- 1. Ve a la WebApp → USUARIOS → PERFIL DE USUARIO → CREAR
--    - Usuario: usuario.prueba.1@prueba.com
--    - Perfil: (selecciona un perfil, ej: SUBGERENTE)
-- 2. Ve a GESTIÓN DE PERMISOS → CREAR
--    - Perfil: (el mismo que asignaste)
--    - País/Empresa/Fundo/Ubicación: (selecciona según necesites)
--    - Permisos: (marca los permisos necesarios)

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. ORDEN: Primero joysense.usuario, luego auth.users (Dashboard), luego actualizar useruuid
-- 2. CONTRASEÑA: Usa la MISMA contraseña en ambos lugares (joysense.usuario y Supabase Dashboard)
-- 3. UUID: Copia el UUID exacto de Supabase Dashboard (columna "UUID" o "id")
-- 4. PASSWORD_HASH: Se genera automáticamente si insertas desde la WebApp
-- 5. DASHBOARD vs SQL: SIEMPRE usar Dashboard para crear en auth.users (nunca INSERT directo)
-- 6. ELIMINAR USUARIOS: Para eliminar de auth.users, usa el Dashboard (no se puede desde SQL)
-- 7. DESPUÉS DE CREAR: Asigna perfil y permisos geográficos desde la WebApp
--
-- ============================================================================
