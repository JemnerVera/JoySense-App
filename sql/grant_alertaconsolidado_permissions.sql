-- Script para otorgar permisos GRANT SOLO SELECT a la tabla alertaconsolidado
-- Ejecutar en Supabase SQL Editor como administrador
-- IMPORTANTE: Solo permisos de lectura, no se debe modificar esta tabla

-- Otorgar permisos SELECT a la tabla alertaconsolidado
GRANT SELECT ON sense.alertaconsolidado TO authenticated;
