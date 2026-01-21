-- Función: fn_usuarioid_actual
-- Descripción: Obtiene el ID del usuario actual basado en auth.uid()
-- Retorna: integer (usuarioid)

CREATE OR REPLACE FUNCTION joysense.fn_usuarioid_actual()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
  SELECT u.usuarioid
  FROM joysense.usuario u
  WHERE u.useruuid = auth.uid()
    AND u.statusid = 1
  LIMIT 1;
$function$
;