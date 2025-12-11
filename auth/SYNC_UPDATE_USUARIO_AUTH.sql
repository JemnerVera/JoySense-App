-- ============================================================================
-- FUNCIÓN Y TRIGGER PARA SINCRONIZAR ACTUALIZACIONES DE USUARIO CON AUTH
-- ============================================================================
-- Esta función sincroniza cambios en joysense.usuario con auth.users
-- cuando se actualiza un usuario existente (especialmente password_hash)
-- ============================================================================

CREATE OR REPLACE FUNCTION joysense.fn_sync_usuario_update_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'joysense', 'public', 'auth', 'extensions'
AS $function$
DECLARE
    v_user_id uuid;
    v_now timestamptz := now();
BEGIN
    ------------------------------------------------------------------
    -- 1. Obtener el UUID del usuario si existe
    ------------------------------------------------------------------
    SELECT useruuid INTO v_user_id
    FROM joysense.usuario
    WHERE usuarioid = NEW.usuarioid;
    
    -- Si no tiene useruuid, no hay nada que sincronizar (usuario no existe en auth)
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    ------------------------------------------------------------------
    -- 2. Validar que NEW.login sea un correo válido (si cambió)
    ------------------------------------------------------------------
    IF NEW.login NOT LIKE '%@%' THEN
        RAISE EXCEPTION 'El login debe ser un correo válido (NEW.login = %)', NEW.login;
    END IF;
    
    ------------------------------------------------------------------
    -- 3. Actualizar auth.users con los nuevos valores
    --    Solo actualizamos si realmente cambió algo relevante
    ------------------------------------------------------------------
    UPDATE auth.users
    SET 
        email = NEW.login,
        encrypted_password = CASE 
            WHEN NEW.password_hash IS DISTINCT FROM OLD.password_hash 
            THEN NEW.password_hash 
            ELSE encrypted_password 
        END,
        updated_at = v_now,
        raw_user_meta_data = jsonb_build_object(
            'login', NEW.login,
            'firstname', NEW.firstname,
            'lastname', NEW.lastname,
            'usuarioid', NEW.usuarioid
        )
    WHERE id = v_user_id;
    
    ------------------------------------------------------------------
    -- 4. Actualizar auth.identities si cambió el email
    ------------------------------------------------------------------
    IF NEW.login IS DISTINCT FROM OLD.login THEN
        UPDATE auth.identities
        SET 
            identity_data = jsonb_build_object(
                'sub', v_user_id::text,
                'email', NEW.login
            ),
            updated_at = v_now
        WHERE user_id = v_user_id AND provider = 'email';
    END IF;
    
    ------------------------------------------------------------------
    -- 5. Actualizar correo principal en joysense.correo si cambió el login
    ------------------------------------------------------------------
    IF NEW.login IS DISTINCT FROM OLD.login THEN
        -- Actualizar el correo principal (statusid = 1)
        UPDATE joysense.correo
        SET correo = NEW.login,
            datemodified = v_now,
            usermodifiedid = NEW.usermodifiedid
        WHERE usuarioid = NEW.usuarioid AND statusid = 1;
        
        -- Si no existe correo principal, crearlo
        INSERT INTO joysense.correo(usuarioid, correo, statusid, usercreatedid)
        VALUES (NEW.usuarioid, NEW.login, 1, NEW.usercreatedid)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$
;

-- ============================================================================
-- CREAR TRIGGER PARA ACTUALIZACIONES
-- ============================================================================
-- Este trigger se ejecuta DESPUÉS de actualizar un registro en usuario
-- y sincroniza los cambios con auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS trg_sync_usuario_update_auth ON joysense.usuario;

CREATE TRIGGER trg_sync_usuario_update_auth 
AFTER UPDATE ON joysense.usuario 
FOR EACH ROW 
EXECUTE FUNCTION joysense.fn_sync_usuario_update_auth();

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Esta función solo sincroniza si el usuario ya tiene un useruuid
--    (ya existe en auth.users)
-- 2. Si password_hash cambió, se actualiza encrypted_password en auth.users
-- 3. Si login cambió, se actualiza email en auth.users y auth.identities
-- 4. Si firstname o lastname cambiaron, se actualiza raw_user_meta_data
-- ============================================================================
