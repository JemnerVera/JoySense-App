-- ============================================================================
-- DIAGNÓSTICO: Error "Database error querying schema" durante Login
-- ============================================================================
-- Este script ayuda a diagnosticar por qué un usuario no puede hacer login
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR USUARIO EN joysense.usuario
-- ============================================================================
SELECT 
    usuarioid,
    login,
    firstname,
    lastname,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✅ Tiene password_hash'
        ELSE '❌ NO tiene password_hash'
    END AS tiene_password,
    CASE 
        WHEN useruuid IS NOT NULL THEN '✅ Tiene useruuid: ' || useruuid::text
        ELSE '❌ NO tiene useruuid (NULL)'
    END AS tiene_useruuid,
    statusid,
    datecreated
FROM joysense.usuario
WHERE login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
ORDER BY usuarioid DESC;

-- ============================================================================
-- 2. VERIFICAR USUARIO EN auth.users
-- ============================================================================
SELECT 
    id,
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN '✅ Tiene password'
        ELSE '❌ NO tiene password'
    END AS tiene_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
ORDER BY created_at DESC;

-- ============================================================================
-- 3. VERIFICAR IDENTIDAD EN auth.identities
-- ============================================================================
SELECT 
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at
FROM auth.identities
WHERE provider_id = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
ORDER BY created_at DESC;

-- ============================================================================
-- 4. VERIFICAR QUE useruuid COINCIDE
-- ============================================================================
SELECT 
    u.usuarioid,
    u.login,
    u.useruuid AS useruuid_joysense,
    au.id AS useruuid_auth_users,
    CASE 
        WHEN u.useruuid = au.id THEN '✅ Coinciden'
        ELSE '❌ NO coinciden'
    END AS coincidencia,
    CASE 
        WHEN u.useruuid IS NULL THEN '❌ useruuid es NULL en joysense.usuario'
        WHEN au.id IS NULL THEN '❌ Usuario no existe en auth.users'
        ELSE '✅ OK'
    END AS estado
FROM joysense.usuario u
LEFT JOIN auth.users au ON u.useruuid = au.id
WHERE u.login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
ORDER BY u.usuarioid DESC;

-- ============================================================================
-- 5. VERIFICAR PERFIL ASIGNADO
-- ============================================================================
SELECT 
    up.usuarioid,
    u.login,
    u.firstname || ' ' || u.lastname AS nombre_completo,
    p.perfilid,
    p.perfil,
    p.nivel,
    up.statusid AS perfil_activo,
    CASE 
        WHEN up.statusid = 1 THEN '✅ Perfil activo'
        ELSE '❌ Perfil inactivo'
    END AS estado_perfil
FROM joysense.usuarioperfil up
JOIN joysense.usuario u ON up.usuarioid = u.usuarioid
JOIN joysense.perfil p ON up.perfilid = p.perfilid
WHERE u.login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
  AND up.statusid = 1
ORDER BY p.nivel ASC;

-- ============================================================================
-- 6. VERIFICAR PERMISOS GEOGRÁFICOS DEL PERFIL
-- ============================================================================
SELECT 
    pgp.permisoid,
    p.perfil,
    pgp.paisid,
    pgp.empresaid,
    pgp.fundoid,
    pgp.ubicacionid,
    pgp.puede_ver,
    pgp.puede_insertar,
    pgp.puede_actualizar,
    pgp.statusid,
    CASE 
        WHEN pgp.paisid IS NOT NULL THEN 'País'
        WHEN pgp.empresaid IS NOT NULL THEN 'Empresa'
        WHEN pgp.fundoid IS NOT NULL THEN 'Fundo'
        WHEN pgp.ubicacionid IS NOT NULL THEN 'Ubicación'
        ELSE '❌ Sin geografía'
    END AS tipo_geografia
FROM joysense.perfil_geografia_permiso pgp
JOIN joysense.perfil p ON pgp.perfilid = p.perfilid
WHERE pgp.perfilid IN (
    SELECT perfilid 
    FROM joysense.usuarioperfil up
    JOIN joysense.usuario u ON up.usuarioid = u.usuarioid
    WHERE u.login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
      AND up.statusid = 1
)
AND pgp.statusid = 1
ORDER BY pgp.permisoid DESC;

-- ============================================================================
-- 7. VERIFICAR VISTAS DE PERMISOS (v_permiso_*)
-- ============================================================================
-- Verificar si el usuario aparece en las vistas de permisos
SELECT 
    'v_permiso_pais' AS vista,
    COUNT(*) AS registros
FROM joysense.v_permiso_pais
WHERE useruuid IN (
    SELECT useruuid 
    FROM joysense.usuario 
    WHERE login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
)
UNION ALL
SELECT 
    'v_permiso_empresa' AS vista,
    COUNT(*) AS registros
FROM joysense.v_permiso_empresa
WHERE useruuid IN (
    SELECT useruuid 
    FROM joysense.usuario 
    WHERE login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
)
UNION ALL
SELECT 
    'v_permiso_fundo' AS vista,
    COUNT(*) AS registros
FROM joysense.v_permiso_fundo
WHERE useruuid IN (
    SELECT useruuid 
    FROM joysense.usuario 
    WHERE login = 'usuario.1@prueba.com'  -- Cambia esto por el email del usuario
);

-- ============================================================================
-- 8. VERIFICAR TRIGGER ACTIVO
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    CASE 
        WHEN tgisinternal = false THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END AS estado
FROM information_schema.triggers
WHERE event_object_schema = 'joysense'
  AND event_object_table = 'usuario'
  AND trigger_name = 'trg_sync_usuario_con_auth';

-- ============================================================================
-- 9. VERIFICAR FUNCIÓN DEL TRIGGER
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    security_type,
    CASE 
        WHEN security_type = 'DEFINER' THEN '✅ SECURITY DEFINER'
        ELSE '⚠️ ' || security_type
    END AS tipo_seguridad
FROM information_schema.routines
WHERE routine_schema = 'joysense'
  AND routine_name = 'fn_sync_usuario_con_auth';

-- ============================================================================
-- 10. INTENTAR SINCRONIZAR MANUALMENTE (si useruuid es NULL)
-- ============================================================================
-- Solo ejecutar si el usuario NO tiene useruuid
-- Descomenta y ejecuta si es necesario:
/*
DO $$
DECLARE
    v_usuarioid integer := 26;  -- Cambia esto por el usuarioid del usuario
    v_useruuid uuid;
BEGIN
    SELECT useruuid INTO v_useruuid
    FROM joysense.usuario
    WHERE usuarioid = v_usuarioid;
    
    IF v_useruuid IS NULL THEN
        RAISE NOTICE 'Sincronizando usuario %...', v_usuarioid;
        v_useruuid := joysense.fn_sync_usuario_auth(v_usuarioid);
        RAISE NOTICE '✅ Usuario sincronizado. useruuid: %', v_useruuid;
    ELSE
        RAISE NOTICE '✅ Usuario ya tiene useruuid: %', v_useruuid;
    END IF;
END $$;
*/

-- ============================================================================
-- RESUMEN Y RECOMENDACIONES
-- ============================================================================
-- Después de ejecutar estas queries, verifica:
-- 
-- ✅ Si el usuario NO tiene useruuid:
--    → Ejecuta el bloque 10 para sincronizar manualmente
--
-- ✅ Si el usuario NO existe en auth.users:
--    → El trigger no se ejecutó correctamente
--    → Ejecuta el bloque 10 para sincronizar manualmente
--    → O verifica que el trigger esté habilitado (bloque 8)
--
-- ✅ Si el usuario NO tiene identidad en auth.identities:
--    → El trigger falló al crear la identidad
--    → Verifica que la función tenga provider_id (bloque 9)
--
-- ✅ Si el usuario NO tiene perfil asignado:
--    → Asigna un perfil en "Perfil de Usuario"
--
-- ✅ Si el perfil NO tiene permisos geográficos:
--    → Crea permisos en "GESTIÓN DE PERMISOS"
--
-- ============================================================================
