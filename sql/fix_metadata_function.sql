-- Eliminar función existente
DROP FUNCTION IF EXISTS sense.get_table_metadata(text);
DROP FUNCTION IF EXISTS sense.fn_get_table_metadata(text);

-- Crear función corregida con nombre de parámetro diferente
CREATE OR REPLACE FUNCTION sense.fn_get_table_metadata(tbl_name text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'columns', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default
        )
      )
      FROM information_schema.columns
      WHERE table_schema = 'sense' AND table_name = tbl_name),
      '[]'::json
    ),
    'info', COALESCE(
      (SELECT json_build_object(
        'table_name', table_name,
        'table_type', table_type
      )
      FROM information_schema.tables
      WHERE table_schema = 'sense' AND table_name = tbl_name),
      json_build_object(
        'table_name', tbl_name,
        'table_type', 'BASE TABLE'
      )
    ),
    'constraints', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'constraint_name', constraint_name,
          'constraint_type', constraint_type
        )
      )
      FROM information_schema.table_constraints
      WHERE table_schema = 'sense' AND table_name = tbl_name),
      '[]'::json
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función
SELECT sense.fn_get_table_metadata('pais');
