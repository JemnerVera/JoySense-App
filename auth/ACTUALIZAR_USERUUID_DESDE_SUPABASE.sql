-- ============================================================================
-- ACTUALIZAR useruuid DESPUÉS DE CREAR USUARIO EN SUPABASE UI
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Crea el usuario en Supabase Dashboard → Authentication → Users → Add User
-- 2. Copia el UUID del usuario creado (está en la columna "UUID" de la tabla)
-- 3. Copia la contraseña que usaste (la misma que usarás en joysense.usuario)
-- 4. Ejecuta este script actualizando el UUID y el login
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR USUARIO EN auth.users
-- ============================================================================
-- Busca el usuario que creaste en Supabase UI
SELECT 
    id AS uuid,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'  -- Cambia por el email del usuario
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: ACTUALIZAR useruuid EN joysense.usuario
-- ============================================================================
-- Reemplaza el UUID y el email con los valores reales
UPDATE joysense.usuario
SET 
    useruuid = 'fbfeac53-de01-46f1-b5e3-d00d62111235'::uuid,  -- ⚠️ CAMBIA ESTE UUID
    datemodified = now()
WHERE login = 'usuario.prueba.1@prueba.com'  -- ⚠️ CAMBIA ESTE EMAIL
  AND useruuid IS NULL;  -- Solo actualizar si useruuid es NULL

-- ============================================================================
-- PASO 3: VERIFICAR QUE SE ACTUALIZÓ CORRECTAMENTE
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.useruuid,
    au.id AS auth_user_id,
    au.email AS auth_email,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ Coinciden'
        ELSE '❌ NO coinciden'
    END AS estado
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.prueba.1@prueba.com'  -- Cambia por el email del usuario
ORDER BY u.usuarioid DESC;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Después de ejecutar este script:
-- 1. El usuario debería poder hacer login correctamente
-- 2. El useruuid en joysense.usuario debe coincidir con el id en auth.users
-- 3. La contraseña en joysense.usuario debe ser la misma que usaste en Supabase UI
--
-- ============================================================================
