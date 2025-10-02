-- Script para traducir nombres de países al español
-- Actualiza los nombres de países más comunes en la tabla sense.codigotelefono

-- Países de América Latina
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

-- Países de Europa
UPDATE sense.codigotelefono SET paistelefono = 'España' WHERE codigotelefono = '+34';
UPDATE sense.codigotelefono SET paistelefono = 'Francia' WHERE codigotelefono = '+33';
UPDATE sense.codigotelefono SET paistelefono = 'Alemania' WHERE codigotelefono = '+49';
UPDATE sense.codigotelefono SET paistelefono = 'Italia' WHERE codigotelefono = '+39';
UPDATE sense.codigotelefono SET paistelefono = 'Reino Unido' WHERE codigotelefono = '+44';
UPDATE sense.codigotelefono SET paistelefono = 'Portugal' WHERE codigotelefono = '+351';
UPDATE sense.codigotelefono SET paistelefono = 'Países Bajos' WHERE codigotelefono = '+31';
UPDATE sense.codigotelefono SET paistelefono = 'Bélgica' WHERE codigotelefono = '+32';
UPDATE sense.codigotelefono SET paistelefono = 'Suiza' WHERE codigotelefono = '+41';
UPDATE sense.codigotelefono SET paistelefono = 'Austria' WHERE codigotelefono = '+43';

-- Países de América del Norte
UPDATE sense.codigotelefono SET paistelefono = 'Estados Unidos' WHERE codigotelefono = '+1';
UPDATE sense.codigotelefono SET paistelefono = 'Canadá' WHERE codigotelefono = '+1';

-- Países de Asia
UPDATE sense.codigotelefono SET paistelefono = 'China' WHERE codigotelefono = '+86';
UPDATE sense.codigotelefono SET paistelefono = 'Japón' WHERE codigotelefono = '+81';
UPDATE sense.codigotelefono SET paistelefono = 'Corea del Sur' WHERE codigotelefono = '+82';
UPDATE sense.codigotelefono SET paistelefono = 'India' WHERE codigotelefono = '+91';
UPDATE sense.codigotelefono SET paistelefono = 'Tailandia' WHERE codigotelefono = '+66';
UPDATE sense.codigotelefono SET paistelefono = 'Singapur' WHERE codigotelefono = '+65';
UPDATE sense.codigotelefono SET paistelefono = 'Malasia' WHERE codigotelefono = '+60';
UPDATE sense.codigotelefono SET paistelefono = 'Filipinas' WHERE codigotelefono = '+63';
UPDATE sense.codigotelefono SET paistelefono = 'Indonesia' WHERE codigotelefono = '+62';
UPDATE sense.codigotelefono SET paistelefono = 'Vietnam' WHERE codigotelefono = '+84';

-- Países de África
UPDATE sense.codigotelefono SET paistelefono = 'Sudáfrica' WHERE codigotelefono = '+27';
UPDATE sense.codigotelefono SET paistelefono = 'Egipto' WHERE codigotelefono = '+20';
UPDATE sense.codigotelefono SET paistelefono = 'Nigeria' WHERE codigotelefono = '+234';
UPDATE sense.codigotelefono SET paistelefono = 'Kenia' WHERE codigotelefono = '+254';
UPDATE sense.codigotelefono SET paistelefono = 'Marruecos' WHERE codigotelefono = '+212';
UPDATE sense.codigotelefono SET paistelefono = 'Argelia' WHERE codigotelefono = '+213';
UPDATE sense.codigotelefono SET paistelefono = 'Túnez' WHERE codigotelefono = '+216';
UPDATE sense.codigotelefono SET paistelefono = 'Libia' WHERE codigotelefono = '+218';
UPDATE sense.codigotelefono SET paistelefono = 'Etiopía' WHERE codigotelefono = '+251';
UPDATE sense.codigotelefono SET paistelefono = 'Ghana' WHERE codigotelefono = '+233';

-- Países de Oceanía
UPDATE sense.codigotelefono SET paistelefono = 'Australia' WHERE codigotelefono = '+61';
UPDATE sense.codigotelefono SET paistelefono = 'Nueva Zelanda' WHERE codigotelefono = '+64';
UPDATE sense.codigotelefono SET paistelefono = 'Fiyi' WHERE codigotelefono = '+679';
UPDATE sense.codigotelefono SET paistelefono = 'Papúa Nueva Guinea' WHERE codigotelefono = '+675';
UPDATE sense.codigotelefono SET paistelefono = 'Samoa' WHERE codigotelefono = '+685';
UPDATE sense.codigotelefono SET paistelefono = 'Tonga' WHERE codigotelefono = '+676';
UPDATE sense.codigotelefono SET paistelefono = 'Vanuatu' WHERE codigotelefono = '+678';
UPDATE sense.codigotelefono SET paistelefono = 'Islas Salomón' WHERE codigotelefono = '+677';
UPDATE sense.codigotelefono SET paistelefono = 'Kiribati' WHERE codigotelefono = '+686';
UPDATE sense.codigotelefono SET paistelefono = 'Tuvalu' WHERE codigotelefono = '+688';

-- Verificar los cambios
SELECT codigotelefonoid, codigotelefono, paistelefono 
FROM sense.codigotelefono 
WHERE codigotelefono IN ('+51', '+52', '+57', '+58', '+54', '+56', '+593', '+591', '+595', '+598', '+55', '+502', '+53', '+509', '+1 809', '+504', '+505', '+503', '+506', '+507', '+34', '+33', '+49', '+39', '+44', '+351', '+31', '+32', '+41', '+43', '+1', '+86', '+81', '+82', '+91', '+66', '+65', '+60', '+63', '+62', '+84', '+27', '+20', '+234', '+254', '+212', '+213', '+216', '+218', '+251', '+233', '+61', '+64', '+679', '+675', '+685', '+676', '+678', '+677', '+686', '+688')
ORDER BY codigotelefonoid;
