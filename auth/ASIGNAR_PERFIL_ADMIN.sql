-- ============================================================================
-- ASIGNAR PERFIL ADMINISTRADOR A UN USUARIO
-- ============================================================================
-- Este script asigna el perfil "Administrador" a un usuario específico
-- ============================================================================

-- 1. Verificar qué perfiles existen
SELECT 
    perfilid,
    perfil,
    nivel
FROM joysense.perfil
WHERE statusid = 1
ORDER BY nivel DESC, perfil;

-- 2. Buscar el perfil "Administrador" (puede estar en mayúsculas o minúsculas)
SELECT 
    perfilid,
    perfil,
    nivel
FROM joysense.perfil
WHERE LOWER(perfil) LIKE '%administrador%'
  AND statusid = 1;

-- 3. Asignar perfil administrador al usuario (reemplaza XX con el usuarioid)
-- Primero obtenemos el perfilid del administrador
DO $$
DECLARE
    v_perfil_admin_id integer;
    v_usuarioid integer := 26;  -- Cambia esto por el usuarioid del usuario
    v_now timestamptz := now();
BEGIN
    -- Buscar el perfil administrador (busca por nivel más alto o nombre)
    SELECT perfilid INTO v_perfil_admin_id
    FROM joysense.perfil
    WHERE (LOWER(perfil) LIKE '%administrador%' OR nivel = 0)
      AND statusid = 1
    ORDER BY nivel ASC, perfil
    LIMIT 1;
    
    IF v_perfil_admin_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un perfil administrador';
    END IF;
    
    RAISE NOTICE 'Perfil administrador encontrado: ID %', v_perfil_admin_id;
    
    -- Asignar el perfil al usuario
    INSERT INTO joysense.usuarioperfil(
        usuarioid,
        perfilid,
        statusid,
        usercreatedid,
        datecreated,
        usermodifiedid,
        datemodified
    )
    VALUES(
        v_usuarioid,
        v_perfil_admin_id,
        1,
        1,
        v_now,
        1,
        v_now
    )
    ON CONFLICT (usuarioid, perfilid) 
    DO UPDATE SET
        statusid = 1,
        datemodified = v_now,
        usermodifiedid = 1;
    
    RAISE NOTICE '✅ Perfil administrador asignado al usuario %', v_usuarioid;
END $$;

-- 4. Verificar que se asignó correctamente
SELECT 
    up.usuarioid,
    u.login,
    u.firstname,
    u.lastname,
    p.perfilid,
    p.perfil,
    p.nivel,
    up.statusid
FROM joysense.usuarioperfil up
JOIN joysense.usuario u ON up.usuarioid = u.usuarioid
JOIN joysense.perfil p ON up.perfilid = p.perfilid
WHERE up.usuarioid = 26  -- Cambia esto por el usuarioid del usuario
  AND up.statusid = 1;
