-- Función: fn_tiene_permiso_tabla_id
-- Descripción: Verifica si el usuario tiene un permiso específico sobre una tabla
-- Parámetros:
--   p_fuenteid: ID de la fuente (tipo de tabla)
--   p_operacionid: ID de la operación (1=ver, 2=insertar, 3=actualizar, 4=eliminar)
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_tiene_permiso_tabla_id(p_fuenteid bigint, p_operacionid smallint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM joysense.v_permiso_usuario v
    WHERE v.useruuid = v_uid
      AND v.origenid = 2
      AND v.fuenteid = p_fuenteid
      AND joysense.fn_permiso_aplica(
            p_operacionid, v.puede_ver, v.puede_insertar, v.puede_actualizar, v.puede_eliminar
          )
  );
END;
$function$
;