-- Función: fn_usuario_puede_ver_subtree_fundo
-- Descripción: Verifica si el usuario puede ver un fundo específico y su subárbol completo
--              Jerarquía: Fundo (3) → Ubicación (4) → Nodo (5) → Localización (6)
-- Parámetros:
--   p_useruuid: UUID del usuario
--   p_fundoid: ID del fundo
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_usuario_puede_ver_subtree_fundo(p_useruuid uuid, p_fundoid integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM joysense.v_permiso_usuario v
    WHERE v.useruuid = p_useruuid
      AND v.origenid = 1
      AND v.puede_ver = true
      AND v.objetoid IS NOT NULL
      AND (
           (v.fuenteid = 3 AND v.objetoid = p_fundoid::bigint)
        OR (v.fuenteid = 4 AND EXISTS (
              SELECT 1 FROM joysense.ubicacion ub
              WHERE ub.ubicacionid = v.objetoid::integer
                AND ub.fundoid = p_fundoid
           ))
        OR (v.fuenteid = 5 AND EXISTS (
              SELECT 1
              FROM joysense.nodo n
              JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
              WHERE n.nodoid = v.objetoid::bigint
                AND ub.fundoid = p_fundoid
           ))
        OR (v.fuenteid = 6 AND EXISTS (
              SELECT 1
              FROM joysense.localizacion l
              JOIN joysense.nodo n ON n.nodoid = l.nodoid
              JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
              WHERE l.localizacionid = v.objetoid::integer
                AND ub.fundoid = p_fundoid
           ))
      )
  );
$function$
;