-- Función: fn_usuario_tiene_permisos_finos_en_empresa
-- Descripción: Verifica si el usuario tiene permisos finos (específicos) en una empresa
--              Busca permisos específicos en fundo(3), ubicacion(4), nodo(5), localizacion(6)
--              que pertenezcan a la empresa indicada
-- Parámetros:
--   p_useruuid: UUID del usuario
--   p_empresaid: ID de la empresa
-- Retorna: boolean

CREATE OR REPLACE FUNCTION joysense.fn_usuario_tiene_permisos_finos_en_empresa(p_useruuid uuid, p_empresaid integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'joysense', 'public', 'auth'
 SET row_security TO 'off'
AS $function$
  SELECT COALESCE(p_useruuid, '00000000-0000-0000-0000-000000000000'::uuid) <> '00000000-0000-0000-0000-000000000000'::uuid
  AND EXISTS (
    SELECT 1
    FROM joysense.v_permiso_usuario v
    WHERE v.useruuid = p_useruuid
      AND v.origenid = 1
      AND v.objetoid IS NOT NULL
      AND v.fuenteid IN (3,4,5,6)
      AND (v.puede_ver OR v.puede_insertar OR v.puede_actualizar)
      AND (
            (v.fuenteid = 3 AND EXISTS (
              SELECT 1 FROM joysense.fundo f2
              WHERE f2.fundoid = v.objetoid::integer
                AND f2.empresaid = p_empresaid
            ))
         OR (v.fuenteid = 4 AND EXISTS (
              SELECT 1
              FROM joysense.ubicacion ub2
              JOIN joysense.fundo f2 ON f2.fundoid = ub2.fundoid
              WHERE ub2.ubicacionid = v.objetoid::integer
                AND f2.empresaid = p_empresaid
            ))
         OR (v.fuenteid = 5 AND EXISTS (
              SELECT 1
              FROM joysense.nodo n2
              JOIN joysense.ubicacion ub2 ON ub2.ubicacionid = n2.ubicacionid
              JOIN joysense.fundo f2 ON f2.fundoid = ub2.fundoid
              WHERE n2.nodoid = v.objetoid::bigint
                AND f2.empresaid = p_empresaid
            ))
         OR (v.fuenteid = 6 AND EXISTS (
              SELECT 1
              FROM joysense.localizacion l2
              JOIN joysense.nodo n2 ON n2.nodoid = l2.nodoid
              JOIN joysense.ubicacion ub2 ON ub2.ubicacionid = n2.ubicacionid
              JOIN joysense.fundo f2 ON f2.fundoid = ub2.fundoid
              WHERE l2.localizacionid = v.objetoid::integer
                AND f2.empresaid = p_empresaid
            ))
      )
  );
$function$
;