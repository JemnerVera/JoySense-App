-- ============================================================================
-- VERIFICAR SI HAY MÚLTIPLES USUARIOS CON EL MISMO EMAIL
-- ============================================================================
-- Esto puede explicar por qué el UUID cambió
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar TODOS los usuarios en auth.users con ese email
-- ============================================================================
SELECT 
    id AS uuid,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at,
    deleted_at
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: Verificar si hay usuarios eliminados (soft delete)
-- ============================================================================
SELECT 
    id AS uuid,
    email,
    created_at,
    deleted_at,
    CASE 
        WHEN deleted_at IS NOT NULL THEN '❌ ELIMINADO'
        ELSE '✅ ACTIVO'
    END AS estado
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 3: Verificar cuántos usuarios hay en total con ese email
-- ============================================================================
SELECT 
    email,
    COUNT(*) AS total_usuarios,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) AS usuarios_activos,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) AS usuarios_eliminados,
    STRING_AGG(id::text, ', ' ORDER BY created_at DESC) AS todos_los_uuids
FROM auth.users
WHERE email = 'usuario.prueba.1@prueba.com'
GROUP BY email;

-- ============================================================================
-- PASO 4: Verificar qué UUID está usando el usuario actualmente
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.useruuid,
    au.id AS auth_user_id,
    au.created_at AS auth_created_at,
    au.deleted_at AS auth_deleted_at,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ Coincide'
        WHEN au.deleted_at IS NOT NULL THEN '⚠️ Usuario en auth.users está ELIMINADO'
        ELSE '❌ NO coincide'
    END AS estado
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.prueba.1@prueba.com';

-- ============================================================================
-- POSIBLES CAUSAS DEL CAMBIO DE UUID
-- ============================================================================
-- 1. Se creó el usuario múltiples veces en Supabase Dashboard
--    → Cada vez que creas un usuario, Supabase genera un nuevo UUID
--    → Si creaste el usuario 2 veces, hay 2 UUIDs diferentes
--
-- 2. Se eliminó y recreó el usuario en Supabase Dashboard
--    → Cuando eliminas un usuario, Supabase hace soft delete (deleted_at)
--    → Si luego creas otro con el mismo email, genera un nuevo UUID
--
-- 3. Se copió el UUID incorrecto
--    → Puede haber múltiples usuarios con el mismo email
--    → Se copió el UUID del usuario eliminado en lugar del activo
--
-- 4. El usuario se creó desde la WebApp primero (con trigger)
--    → El trigger creó un UUID
--    → Luego se creó manualmente en Dashboard (otro UUID)
--    → Se actualizó con el UUID del Dashboard, pero el token usa el del trigger
--
-- ============================================================================
-- SOLUCIÓN PREVENTIVA
-- ============================================================================
-- Para evitar esto en el futuro:
-- 1. SIEMPRE crear primero en Supabase Dashboard
-- 2. Copiar el UUID INMEDIATAMENTE después de crear
-- 3. NO crear el usuario múltiples veces
-- 4. Si necesitas recrear, eliminar primero el usuario anterior completamente
-- 5. Verificar que no haya usuarios duplicados antes de copiar el UUID
--
-- ============================================================================
