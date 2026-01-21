-- Funciones de operaciones (constantes)
-- Estas funciones devuelven los IDs de las operaciones permitidas

-- Función: op_ver
-- Retorna: 1 (ver)
CREATE OR REPLACE FUNCTION joysense.op_ver()
 RETURNS smallint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'joysense', 'public'
AS $function$ SELECT 1::smallint $function$;

-- Función: op_insertar
-- Retorna: 2 (insertar)
CREATE OR REPLACE FUNCTION joysense.op_insertar()
 RETURNS smallint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'joysense', 'public'
AS $function$ SELECT 2::smallint $function$;

-- Función: op_actualizar
-- Retorna: 3 (actualizar)
CREATE OR REPLACE FUNCTION joysense.op_actualizar()
 RETURNS smallint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'joysense', 'public'
AS $function$ SELECT 3::smallint $function$;

-- Función: op_eliminar
-- Retorna: 4 (eliminar)
CREATE OR REPLACE FUNCTION joysense.op_eliminar()
 RETURNS smallint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'joysense', 'public'
AS $function$ SELECT 4::smallint $function$;