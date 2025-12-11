-- ============================================================================
-- FIX: AGREGAR provider_id A LA FUNCIÓN DEL TRIGGER
-- ============================================================================
-- El problema: La función fn_sync_usuario_con_auth() no incluye provider_id
-- en el INSERT de auth.identities, que es obligatorio.
-- Esto causa que el trigger falle silenciosamente.
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
BEGIN
    ------------------------------------------------------------------
    -- 1. Validar que NEW.login sea un correo válido mínimamente
    ------------------------------------------------------------------
    IF NEW.login NOT LIKE '%@%' THEN
        RAISE EXCEPTION 'El login debe ser un correo válido (NEW.login = %)', NEW.login;
    END IF;
    ------------------------------------------------------------------
    -- 2. Crear correo principal en joysense.correo (statusid = 1)
    --    Solo si NO existe ya
    ------------------------------------------------------------------
    INSERT INTO joysense.correo(usuarioid, correo, statusid, usercreatedid)
    VALUES (NEW.usuarioid, NEW.login, 1, NEW.usercreatedid)
    ON CONFLICT DO NOTHING;
    ------------------------------------------------------------------
    -- 3. Crear usuario en Supabase Auth
    ------------------------------------------------------------------
    v_user_id := extensions.gen_random_uuid();
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
        NEW.password_hash,   -- ya viene hasheado en tu BD
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
            'lastname',  NEW.lastname
        )
    );
    ------------------------------------------------------------------
    -- 4. Insertar identidad (CON provider_id que es obligatorio)
    ------------------------------------------------------------------
    INSERT INTO auth.identities(
        id,
        user_id,
        identity_data,
        provider,
        provider_id,  -- OBLIGATORIO - ESTO ES LO QUE FALTABA
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES(
        extensions.gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', NEW.login),
        'email',
        NEW.login,  -- provider_id = email
        v_now,
        v_now,
        v_now
    );
    ------------------------------------------------------------------
    -- 5. Actualizar joysense.usuario con el UUID
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
-- VERIFICAR QUE EL TRIGGER SIGA ACTIVO
-- ============================================================================
-- El trigger ya existe, solo actualizamos la función
-- No necesitamos recrear el trigger

-- ============================================================================
-- PROBAR CON LOS USUARIOS EXISTENTES
-- ============================================================================
-- Después de ejecutar este script, puedes sincronizar los usuarios existentes:
-- SELECT joysense.fn_sync_usuario_auth(24);  -- usuario.1@prueba.com
-- SELECT joysense.fn_sync_usuario_auth(25);  -- usuario.2@prueba.com
