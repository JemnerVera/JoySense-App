-- Script seguro para traducir solo países que están en inglés
-- Solo actualiza países que están en inglés, evita conflictos

-- Países de América Latina (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'Perú' WHERE codigotelefono = '+51' AND paistelefono = 'Peru';
UPDATE sense.codigotelefono SET paistelefono = 'México' WHERE codigotelefono = '+52' AND paistelefono = 'Mexico';
UPDATE sense.codigotelefono SET paistelefono = 'Colombia' WHERE codigotelefono = '+57' AND paistelefono = 'Colombia';
UPDATE sense.codigotelefono SET paistelefono = 'Venezuela' WHERE codigotelefono = '+58' AND paistelefono = 'Venezuela';
UPDATE sense.codigotelefono SET paistelefono = 'Argentina' WHERE codigotelefono = '+54' AND paistelefono = 'Argentina';
UPDATE sense.codigotelefono SET paistelefono = 'Chile' WHERE codigotelefono = '+56' AND paistelefono = 'Chile';
UPDATE sense.codigotelefono SET paistelefono = 'Ecuador' WHERE codigotelefono = '+593' AND paistelefono = 'Ecuador';
UPDATE sense.codigotelefono SET paistelefono = 'Bolivia' WHERE codigotelefono = '+591' AND paistelefono = 'Bolivia';
UPDATE sense.codigotelefono SET paistelefono = 'Paraguay' WHERE codigotelefono = '+595' AND paistelefono = 'Paraguay';
UPDATE sense.codigotelefono SET paistelefono = 'Uruguay' WHERE codigotelefono = '+598' AND paistelefono = 'Uruguay';
UPDATE sense.codigotelefono SET paistelefono = 'Brasil' WHERE codigotelefono = '+55' AND paistelefono = 'Brazil';
UPDATE sense.codigotelefono SET paistelefono = 'Guatemala' WHERE codigotelefono = '+502' AND paistelefono = 'Guatemala';
UPDATE sense.codigotelefono SET paistelefono = 'Cuba' WHERE codigotelefono = '+53' AND paistelefono = 'Cuba';
UPDATE sense.codigotelefono SET paistelefono = 'Haití' WHERE codigotelefono = '+509' AND paistelefono = 'Haiti';
UPDATE sense.codigotelefono SET paistelefono = 'República Dominicana' WHERE codigotelefono = '+1 809' AND paistelefono = 'Dominican Republic';
UPDATE sense.codigotelefono SET paistelefono = 'Honduras' WHERE codigotelefono = '+504' AND paistelefono = 'Honduras';
UPDATE sense.codigotelefono SET paistelefono = 'Nicaragua' WHERE codigotelefono = '+505' AND paistelefono = 'Nicaragua';
UPDATE sense.codigotelefono SET paistelefono = 'El Salvador' WHERE codigotelefono = '+503' AND paistelefono = 'El Salvador';
UPDATE sense.codigotelefono SET paistelefono = 'Costa Rica' WHERE codigotelefono = '+506' AND paistelefono = 'Costa Rica';
UPDATE sense.codigotelefono SET paistelefono = 'Panamá' WHERE codigotelefono = '+507' AND paistelefono = 'Panama';

-- Países de Europa (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'España' WHERE codigotelefono = '+34' AND paistelefono = 'Spain';
UPDATE sense.codigotelefono SET paistelefono = 'Francia' WHERE codigotelefono = '+33' AND paistelefono = 'France';
UPDATE sense.codigotelefono SET paistelefono = 'Alemania' WHERE codigotelefono = '+49' AND paistelefono = 'Germany';
UPDATE sense.codigotelefono SET paistelefono = 'Italia' WHERE codigotelefono = '+39' AND paistelefono = 'Italy';
UPDATE sense.codigotelefono SET paistelefono = 'Reino Unido' WHERE codigotelefono = '+44' AND paistelefono = 'United Kingdom';
UPDATE sense.codigotelefono SET paistelefono = 'Portugal' WHERE codigotelefono = '+351' AND paistelefono = 'Portugal';
UPDATE sense.codigotelefono SET paistelefono = 'Países Bajos' WHERE codigotelefono = '+31' AND paistelefono = 'Netherlands';
UPDATE sense.codigotelefono SET paistelefono = 'Bélgica' WHERE codigotelefono = '+32' AND paistelefono = 'Belgium';
UPDATE sense.codigotelefono SET paistelefono = 'Suiza' WHERE codigotelefono = '+41' AND paistelefono = 'Switzerland';
UPDATE sense.codigotelefono SET paistelefono = 'Austria' WHERE codigotelefono = '+43' AND paistelefono = 'Austria';

-- Países de América del Norte (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'Estados Unidos' WHERE codigotelefono = '+1' AND paistelefono = 'United States';
UPDATE sense.codigotelefono SET paistelefono = 'Canadá' WHERE codigotelefono = '+1' AND paistelefono = 'Canada';

-- Países de Asia (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'China' WHERE codigotelefono = '+86' AND paistelefono = 'China';
UPDATE sense.codigotelefono SET paistelefono = 'Japón' WHERE codigotelefono = '+81' AND paistelefono = 'Japan';
UPDATE sense.codigotelefono SET paistelefono = 'Corea del Sur' WHERE codigotelefono = '+82' AND paistelefono = 'South Korea';
UPDATE sense.codigotelefono SET paistelefono = 'India' WHERE codigotelefono = '+91' AND paistelefono = 'India';
UPDATE sense.codigotelefono SET paistelefono = 'Tailandia' WHERE codigotelefono = '+66' AND paistelefono = 'Thailand';
UPDATE sense.codigotelefono SET paistelefono = 'Singapur' WHERE codigotelefono = '+65' AND paistelefono = 'Singapore';
UPDATE sense.codigotelefono SET paistelefono = 'Malasia' WHERE codigotelefono = '+60' AND paistelefono = 'Malaysia';
UPDATE sense.codigotelefono SET paistelefono = 'Filipinas' WHERE codigotelefono = '+63' AND paistelefono = 'Philippines';
UPDATE sense.codigotelefono SET paistelefono = 'Indonesia' WHERE codigotelefono = '+62' AND paistelefono = 'Indonesia';
UPDATE sense.codigotelefono SET paistelefono = 'Vietnam' WHERE codigotelefono = '+84' AND paistelefono = 'Vietnam';

-- Países de África (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'Sudáfrica' WHERE codigotelefono = '+27' AND paistelefono = 'South Africa';
UPDATE sense.codigotelefono SET paistelefono = 'Egipto' WHERE codigotelefono = '+20' AND paistelefono = 'Egypt';
UPDATE sense.codigotelefono SET paistelefono = 'Nigeria' WHERE codigotelefono = '+234' AND paistelefono = 'Nigeria';
UPDATE sense.codigotelefono SET paistelefono = 'Kenia' WHERE codigotelefono = '+254' AND paistelefono = 'Kenya';
UPDATE sense.codigotelefono SET paistelefono = 'Marruecos' WHERE codigotelefono = '+212' AND paistelefono = 'Morocco';
UPDATE sense.codigotelefono SET paistelefono = 'Argelia' WHERE codigotelefono = '+213' AND paistelefono = 'Algeria';
UPDATE sense.codigotelefono SET paistelefono = 'Túnez' WHERE codigotelefono = '+216' AND paistelefono = 'Tunisia';
UPDATE sense.codigotelefono SET paistelefono = 'Libia' WHERE codigotelefono = '+218' AND paistelefono = 'Libya';
UPDATE sense.codigotelefono SET paistelefono = 'Etiopía' WHERE codigotelefono = '+251' AND paistelefono = 'Ethiopia';
UPDATE sense.codigotelefono SET paistelefono = 'Ghana' WHERE codigotelefono = '+233' AND paistelefono = 'Ghana';

-- Países de Oceanía (solo si están en inglés)
UPDATE sense.codigotelefono SET paistelefono = 'Australia' WHERE codigotelefono = '+61' AND paistelefono = 'Australia';
UPDATE sense.codigotelefono SET paistelefono = 'Nueva Zelanda' WHERE codigotelefono = '+64' AND paistelefono = 'New Zealand';
UPDATE sense.codigotelefono SET paistelefono = 'Fiyi' WHERE codigotelefono = '+679' AND paistelefono = 'Fiji';
UPDATE sense.codigotelefono SET paistelefono = 'Papúa Nueva Guinea' WHERE codigotelefono = '+675' AND paistelefono = 'Papua New Guinea';
UPDATE sense.codigotelefono SET paistelefono = 'Samoa' WHERE codigotelefono = '+685' AND paistelefono = 'Samoa';
UPDATE sense.codigotelefono SET paistelefono = 'Tonga' WHERE codigotelefono = '+676' AND paistelefono = 'Tonga';
UPDATE sense.codigotelefono SET paistelefono = 'Vanuatu' WHERE codigotelefono = '+678' AND paistelefono = 'Vanuatu';
UPDATE sense.codigotelefono SET paistelefono = 'Islas Salomón' WHERE codigotelefono = '+677' AND paistelefono = 'Solomon Islands';
UPDATE sense.codigotelefono SET paistelefono = 'Kiribati' WHERE codigotelefono = '+686' AND paistelefono = 'Kiribati';
UPDATE sense.codigotelefono SET paistelefono = 'Tuvalu' WHERE codigotelefono = '+688' AND paistelefono = 'Tuvalu';

-- Verificar los cambios
SELECT codigotelefonoid, codigotelefono, paistelefono 
FROM sense.codigotelefono 
WHERE codigotelefono IN ('+51', '+52', '+57', '+58', '+54', '+56', '+593', '+591', '+595', '+598', '+55', '+502', '+53', '+509', '+1 809', '+504', '+505', '+503', '+506', '+507', '+34', '+33', '+49', '+39', '+44', '+351', '+31', '+32', '+41', '+43', '+1', '+86', '+81', '+82', '+91', '+66', '+65', '+60', '+63', '+62', '+84', '+27', '+20', '+234', '+254', '+212', '+213', '+216', '+218', '+251', '+233', '+61', '+64', '+679', '+675', '+685', '+676', '+678', '+677', '+686', '+688')
ORDER BY codigotelefonoid;
