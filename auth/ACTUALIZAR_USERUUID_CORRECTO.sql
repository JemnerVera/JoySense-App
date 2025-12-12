-- ============================================================================
-- ACTUALIZAR useruuid CON EL UUID CORRECTO DEL TOKEN
-- ============================================================================
-- El token muestra UUID: 337ba0db-0f7e-4a28-8c37-51cf956a4940
-- Pero joysense.usuario tiene: fbfeac53-de01-46f1-b5e3-d00d62111235
-- Necesitamos actualizar para que coincidan
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar qué UUID tiene el usuario en auth.users
-- ============================================================================
SELECT 
    id AS uuid,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: Verificar el useruuid actual en joysense.usuario
-- ============================================================================
SELECT 
    usuarioid,
    login,
    useruuid AS useruuid_actual,
    '337ba0db-0f7e-4a28-8c37-51cf956a4940'::uuid AS useruuid_del_token,
    CASE 
        WHEN useruuid = '337ba0db-0f7e-4a28-8c37-51cf956a4940'::uuid THEN '✅ Ya coincide'
        WHEN useruuid IS NULL THEN '❌ useruuid es NULL'
        ELSE '❌ NO coincide - necesita actualización'
    END AS estado
FROM joysense.usuario
WHERE login = 'usuario.prueba.1@prueba.com';

-- ============================================================================
-- PASO 3: ACTUALIZAR useruuid CON EL UUID DEL TOKEN
-- ============================================================================
UPDATE joysense.usuario
SET 
    useruuid = '337ba0db-0f7e-4a28-8c37-51cf956a4940'::uuid,
    datemodified = now(),
    usermodifiedid = 1
WHERE login = 'usuario.prueba.1@prueba.com'
  AND (useruuid IS NULL OR useruuid != '337ba0db-0f7e-4a28-8c37-51cf956a4940'::uuid);

-- ============================================================================
-- PASO 4: Verificar que se actualizó correctamente
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.useruuid AS usuario_useruuid,
    au.id AS auth_user_id,
    au.email AS auth_email,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ Coinciden'
        ELSE '❌ NO coinciden'
    END AS estado
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.prueba.1@prueba.com';

-- ============================================================================
-- PASO 5: Verificar permisos con el UUID correcto
-- ============================================================================
SELECT 
    useruuid,
    paisid,
    puede_ver,
    puede_insertar,
    puede_actualizar
FROM joysense.v_permiso_pais
WHERE useruuid = '337ba0db-0f7e-4a28-8c37-51cf956a4940'::uuid;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- Si el PASO 5 no devuelve resultados, significa que los permisos están
-- asociados al UUID antiguo. Necesitarás:
-- 1. Verificar qué perfil tiene el usuario
-- 2. Verificar qué permisos tiene ese perfil en perfil_geografia_permiso
-- 3. Asegurarte de que v_perfiles_geografia_final esté generando los registros
--    correctamente con el nuevo UUID
--
-- ============================================================================
