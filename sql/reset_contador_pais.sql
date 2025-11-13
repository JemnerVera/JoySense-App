-- ============================================================================
-- RESET ID DE TABLA PAIS
-- ============================================================================
-- Script básico para resetear el ID de la tabla pais a 1
-- ============================================================================

-- OPCIÓN 1: Si la tabla está vacía, solo resetear el contador
ALTER SEQUENCE sense.pais_paisid_seq RESTART WITH 1;

-- OPCIÓN 2: Si hay registros y quieres eliminar todo y resetear
-- DELETE FROM sense.pais;
-- ALTER SEQUENCE sense.pais_paisid_seq RESTART WITH 1;

-- OPCIÓN 3: Resetear contador al máximo ID actual + 1 (más seguro)
-- SELECT setval('sense.pais_paisid_seq', COALESCE((SELECT MAX(paisid) FROM sense.pais), 0) + 1, false);

TRUNCATE TABLE sense.METRICA RESTART IDENTITY CASCADE