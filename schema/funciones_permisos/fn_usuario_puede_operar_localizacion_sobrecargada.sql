-- Función: fn_usuario_puede_operar_localizacion (sobrecargada)
-- Descripción: Verifica si el usuario puede operar en una localización específica (versión simplificada)
-- Parámetros:
--   p_localizacionid: ID de la localización
--   p_operacionid: ID de la operación (1=ver, 2=insertar, 3=actualizar, 4=eliminar)
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_usuario_puede_operar_localizacion(p_localizacionid integer, p_operacionid smallint)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
declare
  v_useruuid uuid := auth.uid();
  v_usuarioid integer;
  v_empresaid integer;
  v_fundoid integer;
  v_ubicacionid integer;
  v_nodoid bigint;
begin
  if v_useruuid is null then
    return false;
  end if;
  -- usuario actual (sin depender de RLS por row_security=off)
  select u.usuarioid
    into v_usuarioid
  from joysense.usuario u
  where u.useruuid = v_useruuid
    and u.statusid = 1
  limit 1;
  if v_usuarioid is null then
    return false;
  end if;
  -- resolver cadena geográfica desde la localización
  select e.empresaid, f.fundoid, ub.ubicacionid, n.nodoid
    into v_empresaid, v_fundoid, v_ubicacionid, v_nodoid
  from joysense.localizacion l
  join joysense.nodo n on n.nodoid = l.nodoid
  join joysense.ubicacion ub on ub.ubicacionid = n.ubicacionid
  join joysense.fundo f on f.fundoid = ub.fundoid
  join joysense.empresa e on e.empresaid = f.empresaid
  where l.localizacionid = p_localizacionid
  limit 1;
  if v_empresaid is null then
    return false;
  end if;
  -- debe tener la empresa asignada
  if not exists (
    select 1
    from joysense.usuario_empresa ue
    where ue.usuarioid = v_usuarioid
      and ue.empresaid = v_empresaid
      and ue.statusid = 1
  ) then
    return false;
  end if;
  -- si NO tiene permisos finos en esa empresa => ve todo (modo "empresa = todo")
  if not joysense.fn_usuario_tiene_permisos_finos_en_empresa(v_useruuid, v_empresaid) then
    return true;
  end if;
  -- modo fino: permiso puede venir de cualquier nivel
  return
       joysense.fn_tiene_permiso_geo_objeto(6, p_localizacionid::bigint, p_operacionid)  -- localizacion
    or joysense.fn_tiene_permiso_geo_objeto(5, v_nodoid::bigint,        p_operacionid)  -- nodo
    or joysense.fn_tiene_permiso_geo_objeto(4, v_ubicacionid::bigint,   p_operacionid)  -- ubicacion
    or joysense.fn_tiene_permiso_geo_objeto(3, v_fundoid::bigint,       p_operacionid); -- fundo
end;
$function$
;