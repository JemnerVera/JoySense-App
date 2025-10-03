-- Script para otorgar permisos GRANT SOLO SELECT a la tabla medicion
-- Ejecutar en Supabase SQL Editor como administrador
-- IMPORTANTE: Solo permisos de lectura, no se debe modificar esta tabla

-- Otorgar permisos SELECT a la tabla medicion
GRANT SELECT ON sense.medicion TO authenticated;

-- Otorgar permisos SELECT en la secuencia (solo para lectura)
GRANT SELECT ON SEQUENCE sense.medicion_medicionid_seq TO authenticated;