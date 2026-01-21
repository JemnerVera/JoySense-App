-- Función: fn_es_admin_global
-- Descripción: Verifica si el usuario actual es administrador global
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_es_admin_global()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM joysense.usuarioperfil up
    JOIN joysense.perfil p ON p.perfilid = up.perfilid
    WHERE up.usuarioid = joysense.fn_usuarioid_actual()
      AND up.statusid = 1
      AND p.statusid = 1
      AND p.is_admin_global = true
  );
$function$
;