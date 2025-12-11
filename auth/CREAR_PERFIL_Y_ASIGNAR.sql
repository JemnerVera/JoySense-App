-- ============================================================================
-- CREAR PERFIL Y ASIGNARLO A UN USUARIO
-- ============================================================================
-- Este script crea un nuevo perfil con menos privilegios y lo asigna a un usuario
-- ============================================================================

-- 1. Verificar perfiles existentes
SELECT 
    perfilid,
    perfil,
    nivel,
    jefeid,
    statusid
FROM joysense.perfil
WHERE statusid = 1
ORDER BY nivel ASC, perfil;

-- 2. Crear un nuevo perfil (ej: "Operador")
DO $$
DECLARE
    v_perfil_id integer;
    v_usuarioid integer := 26;  -- Cambia esto por el usuarioid del usuario
    v_now timestamptz := now();
    v_perfil_nombre text := 'Operador';  -- Cambia esto por el nombre del perfil que quieres crear
    v_perfil_nivel integer := 1;  -- Nivel del perfil (0 = admin, mayor = menos privilegios)
BEGIN
    -- Crear el perfil
    INSERT INTO joysense.perfil(
        perfil,
        nivel,
        jefeid,
        statusid,
        usercreatedid,
        datecreated,
        usermodifiedid,
        datemodified
    )
    VALUES(
        v_perfil_nombre,
        v_perfil_nivel,
        NULL,  -- jefeid (puede ser NULL o el perfilid de un jefe)
        1,     -- statusid activo
        1,     -- usercreatedid
        v_now,
        1,     -- usermodifiedid
        v_now
    )
    RETURNING perfilid INTO v_perfil_id;
    
    RAISE NOTICE '✅ Perfil "%" creado con ID: %', v_perfil_nombre, v_perfil_id;
    
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
        v_perfil_id,
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
    
    RAISE NOTICE '✅ Perfil "%" asignado al usuario %', v_perfil_nombre, v_usuarioid;
    
    -- Mostrar resultado
    RAISE NOTICE '';
    RAISE NOTICE 'Resumen:';
    RAISE NOTICE '  - Perfil creado: % (ID: %)', v_perfil_nombre, v_perfil_id;
    RAISE NOTICE '  - Usuario: %', v_usuarioid;
    RAISE NOTICE '  - Nivel: %', v_perfil_nivel;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear perfil o asignarlo: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- 3. Verificar que se creó y asignó correctamente
SELECT 
    up.usuarioid,
    u.login,
    u.firstname || ' ' || u.lastname AS nombre_completo,
    p.perfilid,
    p.perfil,
    p.nivel,
    up.statusid AS perfil_activo
FROM joysense.usuarioperfil up
JOIN joysense.usuario u ON up.usuarioid = u.usuarioid
JOIN joysense.perfil p ON up.perfilid = p.perfilid
WHERE up.usuarioid = 26  -- Cambia esto por el usuarioid del usuario
  AND up.statusid = 1
ORDER BY p.nivel ASC;

-- ============================================================================
-- NOTAS SOBRE NIVELES DE PERFIL:
-- ============================================================================
-- nivel = 0: Administrador (máximos privilegios)
-- nivel = 1: Operador/Jefe (privilegios intermedios)
-- nivel = 2+: Usuarios con menos privilegios
-- 
-- El nivel determina la jerarquía de permisos en el sistema.
-- ============================================================================
