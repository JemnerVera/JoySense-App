-- Resetear las secuencias de auto-incremento para que usen el siguiente ID disponible

-- Medio: último ID es 4, siguiente será 5
ALTER TABLE sense.medio
ALTER COLUMN medioid RESTART WITH 5;

-- Contacto: último ID es 6, siguiente será 7
ALTER TABLE sense.contacto
ALTER COLUMN contactoid RESTART WITH 7;

-- Usuario: último ID es 5, siguiente será 6 (nota: falta el ID 4)
ALTER TABLE sense.usuario
ALTER COLUMN usuarioid RESTART WITH 6;

-- Perfil: último ID es 4, siguiente será 5
ALTER TABLE sense.perfil
ALTER COLUMN perfilid RESTART WITH 5;
