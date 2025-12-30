-- ============================================================================
-- SOLUCIÓN: Permisos para Edge Function en Schema joysense
-- ============================================================================
-- Esta función permite a la Edge Function obtener contacto y usuario
-- sin necesidad de permisos directos en el schema joysense
-- ============================================================================

-- Función para obtener contacto y usuario por contactoid
CREATE OR REPLACE FUNCTION joysense.fn_obtener_contacto_usuario(p_contactoid bigint)
RETURNS TABLE (
  celular text,
  firstname text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = joysense
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.celular::text,
    u.firstname::text
  FROM joysense.contacto c
  JOIN joysense.usuario u ON u.usuarioid = c.usuarioid
  WHERE c.contactoid = p_contactoid
    AND c.statusid = 1
    AND u.statusid = 1
  LIMIT 1;
END;
$$;

-- Otorgar permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION joysense.fn_obtener_contacto_usuario(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION joysense.fn_obtener_contacto_usuario(bigint) TO anon;

-- Verificar que la función existe
SELECT 
    routine_name,
    routine_schema,
    security_type
FROM information_schema.routines
WHERE routine_name = 'fn_obtener_contacto_usuario'
  AND routine_schema = 'joysense';

