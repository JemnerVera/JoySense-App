/**
 * Crear wrapper en public para fn_get_table_metadata
 * PostgREST solo puede llamar funciones RPC del esquema public
 * Este wrapper llama a la función real en joysense
 */

-- Crear función wrapper en public que llame a la función en joysense
CREATE OR REPLACE FUNCTION public.fn_get_table_metadata(tbl_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'joysense', 'public', 'auth'
AS $$
BEGIN
  -- Llamar a la función real en joysense
  RETURN joysense.fn_get_table_metadata(tbl_name);
END;
$$;

-- Otorgar permisos de ejecución al rol authenticated
-- (anon no es necesario porque el backend siempre está autenticado)
GRANT EXECUTE ON FUNCTION public.fn_get_table_metadata(text) TO authenticated;

-- Comentario
COMMENT ON FUNCTION public.fn_get_table_metadata(text) IS 
'Wrapper para joysense.fn_get_table_metadata. PostgREST solo puede llamar funciones del esquema public.';

