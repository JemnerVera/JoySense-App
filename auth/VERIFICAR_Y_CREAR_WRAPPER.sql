/**
 * Verificar y crear wrapper en public para fn_get_table_metadata
 * PostgREST solo puede llamar funciones RPC del esquema public
 * Este wrapper llama a la función real en joysense
 */

-- Verificar si el wrapper ya existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'fn_get_table_metadata'
  ) THEN
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
    
    RAISE NOTICE '✅ Wrapper creado exitosamente en public.fn_get_table_metadata';
  ELSE
    RAISE NOTICE 'ℹ️ El wrapper public.fn_get_table_metadata ya existe';
    
    -- Asegurar que los permisos estén correctos
    GRANT EXECUTE ON FUNCTION public.fn_get_table_metadata(text) TO authenticated;
    
    RAISE NOTICE '✅ Permisos actualizados';
  END IF;
END $$;

-- Verificar que la función en joysense existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'joysense' 
      AND p.proname = 'fn_get_table_metadata'
  ) THEN
    RAISE EXCEPTION '❌ La función joysense.fn_get_table_metadata no existe. Debe crearse primero.';
  ELSE
    RAISE NOTICE '✅ La función joysense.fn_get_table_metadata existe';
  END IF;
END $$;
