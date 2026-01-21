-- Función: fn_usuario_puede_operar_localizacion
-- Descripción: Verifica si el usuario puede operar en una localización específica
-- Parámetros:
--   p_localizacionid: ID de la localización (opcional si se pasa nodoid)
--   p_nodoid: ID del nodo (opcional si se pasa localizacionid)
--   p_operacionid: ID de la operación (1=ver, 2=insertar, 3=actualizar, 4=eliminar)
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_usuario_puede_operar_localizacion(p_localizacionid integer, p_nodoid bigint, p_operacionid smallint)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_nodoid bigint;
  v_empresaid integer;
BEGIN
  IF auth.role() = 'service_role'::text THEN
    RETURN true;
  END IF;
  IF joysense.fn_es_admin_global() THEN
    RETURN true;
  END IF;
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  -- Resolver nodo
  IF p_nodoid IS NOT NULL THEN
    v_nodoid := p_nodoid;
  ELSIF p_localizacionid IS NOT NULL THEN
    SELECT l.nodoid INTO v_nodoid
    FROM joysense.localizacion l
    WHERE l.localizacionid = p_localizacionid;
  END IF;
  IF v_nodoid IS NULL THEN
    RETURN false;
  END IF;
  -- Resolver empresa por nodo -> ubicacion -> fundo
  SELECT f.empresaid INTO v_empresaid
  FROM joysense.nodo n
  JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
  JOIN joysense.fundo f ON f.fundoid = ub.fundoid
  WHERE n.nodoid = v_nodoid;
  IF v_empresaid IS NULL THEN
    RETURN false;
  END IF;
  -- Debe pertenecer a la empresa
  IF NOT EXISTS (
    SELECT 1
    FROM joysense.usuario_empresa ue
    WHERE ue.usuarioid = joysense.fn_usuarioid_actual()
      AND ue.empresaid = v_empresaid
      AND ue.statusid = 1
  ) THEN
    RETURN false;
  END IF;
  -- Si hay permisos finos, exigir que caiga en su subtree (para VER)
  IF p_operacionid = joysense.op_ver()
     AND joysense.fn_usuario_tiene_permisos_finos_en_empresa(v_uid, v_empresaid) THEN
    RETURN joysense.fn_usuario_puede_ver_subtree_nodo(v_uid, v_nodoid);
  END IF;
  -- Permiso por geografía (op insert/update): típicamente por NODO (fuenteid=5) o por LOCALIZACION (fuenteid=6)
  IF p_operacionid = joysense.op_insertar() THEN
    RETURN joysense.fn_tiene_permiso_geo_objeto((5)::bigint, v_nodoid, p_operacionid)
        OR joysense.fn_tiene_permiso_geo_objeto((6)::bigint, NULL::bigint, p_operacionid);
  END IF;
  IF p_operacionid = joysense.op_actualizar() THEN
    RETURN joysense.fn_tiene_permiso_geo_objeto((6)::bigint, p_localizacionid::bigint, p_operacionid)
        OR joysense.fn_tiene_permiso_geo_objeto((5)::bigint, v_nodoid, p_operacionid);
  END IF;
  RETURN false;
END;
$function$
;