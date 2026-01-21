-- Función: fn_permiso_aplica
-- Descripción: Verifica si una operación específica está permitida según los flags booleanos
-- Parámetros:
--   p_operacionid: ID de la operación (1=ver, 2=insertar, 3=actualizar, 4=eliminar)
--   p_ver, p_insertar, p_actualizar, p_eliminar: flags booleanos de permisos
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_permiso_aplica(p_operacionid smallint, p_ver boolean, p_insertar boolean, p_actualizar boolean, p_eliminar boolean)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'joysense', 'public'
AS $function$
  SELECT CASE p_operacionid
    WHEN 1 THEN coalesce(p_ver,false)
    WHEN 2 THEN coalesce(p_insertar,false)
    WHEN 3 THEN coalesce(p_actualizar,false)
    WHEN 4 THEN coalesce(p_eliminar,false)
    ELSE false
  END;
$function$
;