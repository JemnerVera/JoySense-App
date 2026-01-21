-- Función: fn_tiene_permiso_geo_objeto
-- Descripción: Verifica si el usuario tiene un permiso específico sobre un objeto geográfico
-- Parámetros:
--   p_fuenteid: ID de la fuente (tipo de objeto: 1=pais, 2=empresa, 3=fundo, etc.)
--   p_objetoid: ID del objeto específico (NULL para permisos globales)
--   p_operacionid: ID de la operación (1=ver, 2=insertar, 3=actualizar, 4=eliminar)
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_tiene_permiso_geo_objeto(p_fuenteid bigint, p_objetoid bigint, p_operacionid smallint)
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
      AND v.origenid = 1
      AND v.fuenteid = p_fuenteid
      AND (
            (p_objetoid IS NULL AND v.objetoid IS NULL)
         OR (p_objetoid IS NOT NULL AND (v.objetoid IS NULL OR v.objetoid = p_objetoid))
      )
      AND joysense.fn_permiso_aplica(
            p_operacionid, v.puede_ver, v.puede_insertar, v.puede_actualizar, v.puede_eliminar
          )
  );
END;
$function$
;