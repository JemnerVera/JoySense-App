-- ============================================================================
-- FIX: MEJORAR TRIGGER DE SINCRONIZACIÓN DE USUARIO CON AUTH
-- ============================================================================
-- Este script mejora el trigger para:
-- 1. Agregar manejo de errores
-- 2. Incluir provider_id en auth.identities (obligatorio)
-- 3. Manejar casos donde el usuario ya existe en auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION joysense.fn_sync_usuario_con_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'joysense', 'public', 'auth', 'extensions'
AS $function$
DECLARE
    v_user_id uuid;
    v_now timestamptz := now();
    v_existing_user_id uuid;
BEGIN
    ------------------------------------------------------------------
    -- 1. Validar que NEW.login sea un correo válido mínimamente
    ------------------------------------------------------------------
    IF NEW.login NOT LIKE '%@%' THEN
        RAISE EXCEPTION 'El login debe ser un correo válido (NEW.login = %)', NEW.login;
    END IF;
    
    ------------------------------------------------------------------
    -- 2. Validar que password_hash esté presente y tenga tamaño válido
    ------------------------------------------------------------------
    IF NEW.password_hash IS NULL OR NEW.password_hash = '' THEN
        RAISE EXCEPTION 'password_hash no puede ser NULL o vacío para el usuario %', NEW.login;
    END IF;
    
    -- Validar que el hash no exceda el límite de 255 caracteres de encrypted_password
    IF length(NEW.password_hash) > 255 THEN
        RAISE EXCEPTION 'password_hash excede el límite de 255 caracteres para el usuario % (tiene % caracteres)', 
            NEW.login, length(NEW.password_hash);
    END IF;
    
    ------------------------------------------------------------------
    -- 3. Crear correo principal en joysense.correo (statusid = 1)
    --    Solo si NO existe ya
    ------------------------------------------------------------------
    INSERT INTO joysense.correo(usuarioid, correo, statusid, usercreatedid, datecreated, usermodifiedid, datemodified)
    VALUES (NEW.usuarioid, NEW.login, 1, NEW.usercreatedid, v_now, NEW.usercreatedid, v_now)
    ON CONFLICT DO NOTHING;
    
    ------------------------------------------------------------------
    -- 4. Verificar si el usuario ya existe en auth.users (por email)
    ------------------------------------------------------------------
    SELECT id INTO v_existing_user_id
    FROM auth.users
    WHERE email = NEW.login
    LIMIT 1;
    
    IF v_existing_user_id IS NOT NULL THEN
        -- Usuario ya existe, actualizar en lugar de crear
        v_user_id := v_existing_user_id;
        
        UPDATE auth.users
        SET 
            encrypted_password = NEW.password_hash,
            updated_at = v_now,
            raw_user_meta_data = jsonb_build_object(
                'login', NEW.login,
                'firstname', NEW.firstname,
                'lastname', NEW.lastname,
                'usuarioid', NEW.usuarioid
            )
        WHERE id = v_user_id;
        
        -- Actualizar identidad si existe
        UPDATE auth.identities
        SET 
            identity_data = jsonb_build_object('sub', v_user_id::text, 'email', NEW.login),
            updated_at = v_now
        WHERE user_id = v_user_id AND provider = 'email';
        
    ELSE
        -- Usuario no existe, crear nuevo
        ------------------------------------------------------------------
        -- 5. Crear usuario en Supabase Auth
        ------------------------------------------------------------------
        v_user_id := extensions.gen_random_uuid();
        
        BEGIN
            INSERT INTO auth.users(
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                last_sign_in_at,
                aud,
                role,
                raw_app_meta_data,
                raw_user_meta_data
            )
            VALUES(
                v_user_id,
                '00000000-0000-0000-0000-000000000000',
                NEW.login,
                NEW.password_hash,
                v_now,
                v_now,
                v_now,
                v_now,
                'authenticated',
                'authenticated',
                jsonb_build_object('provider','email','providers', array['email']),
                jsonb_build_object(
                    'login', NEW.login,
                    'firstname', NEW.firstname,
                    'lastname', NEW.lastname,
                    'usuarioid', NEW.usuarioid
                )
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error al insertar en auth.users para %: % (SQLSTATE: %)', 
                NEW.login, SQLERRM, SQLSTATE;
        END;
        
        ------------------------------------------------------------------
        -- 6. Insertar identidad (CON provider_id que es obligatorio)
        ------------------------------------------------------------------
        BEGIN
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,  -- OBLIGATORIO
                last_sign_in_at,
                created_at,
                updated_at
            )
            VALUES (
                extensions.gen_random_uuid(),
                v_user_id,
                jsonb_build_object('sub', v_user_id::text, 'email', NEW.login),
                'email',
                NEW.login,  -- provider_id = email
                v_now,
                v_now,
                v_now
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error al insertar en auth.identities para %: % (SQLSTATE: %)', 
                NEW.login, SQLERRM, SQLSTATE;
        END;
    END IF;
    
    ------------------------------------------------------------------
    -- 7. Actualizar joysense.usuario con el UUID
    ------------------------------------------------------------------
    UPDATE joysense.usuario
    SET useruuid = v_user_id,
        datemodified = v_now
    WHERE usuarioid = NEW.usuarioid;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log del error pero no fallar el INSERT en usuario
    RAISE WARNING 'Error en fn_sync_usuario_con_auth para usuario %: % (SQLSTATE: %)', 
        NEW.login, SQLERRM, SQLSTATE;
    -- Retornar NEW para que el INSERT en usuario no falle
    RETURN NEW;
END;
$function$
;

-- ============================================================================
-- VERIFICAR QUE EL TRIGGER EXISTA Y ESTÉ ACTIVO
-- ============================================================================
DROP TRIGGER IF EXISTS trg_sync_usuario_con_auth ON joysense.usuario;

CREATE TRIGGER trg_sync_usuario_con_auth 
AFTER INSERT ON joysense.usuario 
FOR EACH ROW 
EXECUTE FUNCTION joysense.fn_sync_usuario_con_auth();

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Esta versión incluye manejo de errores con EXCEPTION
-- 2. Verifica si el usuario ya existe en auth.users antes de crear
-- 3. Incluye provider_id en auth.identities (obligatorio)
-- 4. Si hay un error, lo registra como WARNING pero no falla el INSERT
-- 5. Valida que password_hash no sea NULL o vacío
-- ============================================================================
