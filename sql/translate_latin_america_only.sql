-- Script para traducir solo países de América Latina al español
-- Más seguro, evita conflictos con códigos duplicados

-- Países de América Latina más importantes
UPDATE sense.codigotelefono SET paistelefono = 'Perú' WHERE codigotelefono = '+51';
UPDATE sense.codigotelefono SET paistelefono = 'México' WHERE codigotelefono = '+52';
UPDATE sense.codigotelefono SET paistelefono = 'Colombia' WHERE codigotelefono = '+57';
UPDATE sense.codigotelefono SET paistelefono = 'Venezuela' WHERE codigotelefono = '+58';
UPDATE sense.codigotelefono SET paistelefono = 'Argentina' WHERE codigotelefono = '+54';
UPDATE sense.codigotelefono SET paistelefono = 'Chile' WHERE codigotelefono = '+56';
UPDATE sense.codigotelefono SET paistelefono = 'Ecuador' WHERE codigotelefono = '+593';
UPDATE sense.codigotelefono SET paistelefono = 'Bolivia' WHERE codigotelefono = '+591';
UPDATE sense.codigotelefono SET paistelefono = 'Paraguay' WHERE codigotelefono = '+595';
UPDATE sense.codigotelefono SET paistelefono = 'Uruguay' WHERE codigotelefono = '+598';
UPDATE sense.codigotelefono SET paistelefono = 'Brasil' WHERE codigotelefono = '+55';
UPDATE sense.codigotelefono SET paistelefono = 'Guatemala' WHERE codigotelefono = '+502';
UPDATE sense.codigotelefono SET paistelefono = 'Cuba' WHERE codigotelefono = '+53';
UPDATE sense.codigotelefono SET paistelefono = 'Haití' WHERE codigotelefono = '+509';
UPDATE sense.codigotelefono SET paistelefono = 'República Dominicana' WHERE codigotelefono = '+1 809';
UPDATE sense.codigotelefono SET paistelefono = 'Honduras' WHERE codigotelefono = '+504';
UPDATE sense.codigotelefono SET paistelefono = 'Nicaragua' WHERE codigotelefono = '+505';
UPDATE sense.codigotelefono SET paistelefono = 'El Salvador' WHERE codigotelefono = '+503';
UPDATE sense.codigotelefono SET paistelefono = 'Costa Rica' WHERE codigotelefono = '+506';
UPDATE sense.codigotelefono SET paistelefono = 'Panamá' WHERE codigotelefono = '+507';

-- Verificar los cambios
SELECT codigotelefonoid, codigotelefono, paistelefono 
FROM sense.codigotelefono 
WHERE codigotelefono IN ('+51', '+52', '+57', '+58', '+54', '+56', '+593', '+591', '+595', '+598', '+55', '+502', '+53', '+509', '+1 809', '+504', '+505', '+503', '+506', '+507')
ORDER BY codigotelefonoid;
