-- ============================================================================
-- TRIGGERS PARA CREAR PERMISOS AUTOMÁTICAMENTE
-- ============================================================================
-- Estos triggers crean permisos automáticamente cuando se inserta
-- una nueva pais, empresa o fundo en la base de datos
-- ============================================================================

-- ============================================================================
-- FUNCIÓN Y TRIGGER PARA PAIS
-- ============================================================================

-- Eliminar trigger y función si existen (para recrear)
DROP TRIGGER IF EXISTS trg_auto_permiso_pais ON joysense.pais;
DROP FUNCTION IF EXISTS joysense.fn_auto_permiso_pais();

-- Crear función que inserta permiso automáticamente
CREATE OR REPLACE FUNCTION joysense.fn_auto_permiso_pais()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar permiso para el perfil 1 (Administrador) automáticamente
    INSERT INTO joysense.perfil_geografia_permiso (
        perfilid,
        paisid,
        puede_ver,
        puede_insertar,
        puede_actualizar,
        statusid,
        usercreatedid
    )
    VALUES (
        1,                  -- Perfil Administrador (ajusta según necesites)
        NEW.paisid,         -- Nuevo país insertado
        true,               -- puede_ver
        true,               -- puede_insertar
        true,               -- puede_actualizar
        1,                  -- statusid activo
        NEW.usercreatedid   -- Usuario que creó el país
    )
    ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar un país
CREATE TRIGGER trg_auto_permiso_pais
    AFTER INSERT ON joysense.pais
    FOR EACH ROW
    WHEN (NEW.statusid = 1)  -- Solo si el país está activo
    EXECUTE FUNCTION joysense.fn_auto_permiso_pais();

-- ============================================================================
-- FUNCIÓN Y TRIGGER PARA EMPRESA
-- ============================================================================

-- Eliminar trigger y función si existen (para recrear)
DROP TRIGGER IF EXISTS trg_auto_permiso_empresa ON joysense.empresa;
DROP FUNCTION IF EXISTS joysense.fn_auto_permiso_empresa();

-- Crear función que inserta permiso automáticamente
CREATE OR REPLACE FUNCTION joysense.fn_auto_permiso_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar permiso para el perfil 1 (Administrador) automáticamente
    -- Puedes modificar esto para dar permisos a otros perfiles o al perfil del usuario que inserta
    INSERT INTO joysense.perfil_geografia_permiso (
        perfilid,
        empresaid,
        puede_ver,
        puede_insertar,
        puede_actualizar,
        statusid,
        usercreatedid
    )
    VALUES (
        1,                  -- Perfil Administrador (ajusta según necesites)
        NEW.empresaid,      -- Nueva empresa insertada
        true,               -- puede_ver
        true,               -- puede_insertar
        true,               -- puede_actualizar
        1,                  -- statusid activo
        NEW.usercreatedid   -- Usuario que creó la empresa
    )
    ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar una empresa
CREATE TRIGGER trg_auto_permiso_empresa
    AFTER INSERT ON joysense.empresa
    FOR EACH ROW
    WHEN (NEW.statusid = 1)  -- Solo si la empresa está activa
    EXECUTE FUNCTION joysense.fn_auto_permiso_empresa();

-- ============================================================================
-- FUNCIÓN Y TRIGGER PARA FUNDO
-- ============================================================================

-- Eliminar trigger y función si existen (para recrear)
DROP TRIGGER IF EXISTS trg_auto_permiso_fundo ON joysense.fundo;
DROP FUNCTION IF EXISTS joysense.fn_auto_permiso_fundo();

-- Crear función que inserta permiso automáticamente
CREATE OR REPLACE FUNCTION joysense.fn_auto_permiso_fundo()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar permiso para el perfil 1 (Administrador) automáticamente
    INSERT INTO joysense.perfil_geografia_permiso (
        perfilid,
        fundoid,
        puede_ver,
        puede_insertar,
        puede_actualizar,
        statusid,
        usercreatedid
    )
    VALUES (
        1,                  -- Perfil Administrador (ajusta según necesites)
        NEW.fundoid,        -- Nuevo fundo insertado
        true,               -- puede_ver
        true,               -- puede_insertar
        true,               -- puede_actualizar
        1,                  -- statusid activo
        NEW.usercreatedid   -- Usuario que creó el fundo
    )
    ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar un fundo
CREATE TRIGGER trg_auto_permiso_fundo
    AFTER INSERT ON joysense.fundo
    FOR EACH ROW
    WHEN (NEW.statusid = 1)  -- Solo si el fundo está activo
    EXECUTE FUNCTION joysense.fn_auto_permiso_fundo();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'joysense'
  AND trigger_name IN ('trg_auto_permiso_pais', 'trg_auto_permiso_empresa', 'trg_auto_permiso_fundo')
ORDER BY trigger_name;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- 1. Estos triggers dan permisos automáticamente al perfil 1 (Administrador)
--    Si necesitas dar permisos a otros perfiles, modifica el valor de perfilid
--
-- 2. Si quieres dar permisos al perfil del usuario que inserta, necesitarías:
--    - Obtener el usuarioid de NEW.usercreatedid
--    - Buscar el perfilid en usuarioperfil
--    - Usar ese perfilid en lugar de 1
--
-- 3. El ON CONFLICT DO NOTHING evita errores si el permiso ya existe
--    (aunque no debería pasar si el trigger funciona correctamente)
--
-- 4. Los triggers solo se ejecutan cuando statusid = 1 (activo)
--    Si insertas un pais/empresa/fundo inactivo, no se creará el permiso
--
-- 5. IMPORTANTE: El trigger de pais resuelve el problema de RLS al insertar
--    porque crea el permiso DESPUÉS de la inserción, permitiendo que
--    el usuario pueda ver/editar el país que acaba de crear
--    PERO necesitas ejecutar también SOLUCION_RLS_INSERT_PAIS.sql para
--    modificar la política RLS y permitir la inserción inicial
--
-- ============================================================================
