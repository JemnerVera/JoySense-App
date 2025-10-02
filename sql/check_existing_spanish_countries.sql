-- Verificar qué países ya están en español
SELECT codigotelefonoid, codigotelefono, paistelefono 
FROM sense.codigotelefono 
WHERE paistelefono IN (
    'Perú', 'México', 'Colombia', 'Venezuela', 'Argentina', 'Chile', 
    'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Brasil', 'Guatemala', 
    'Cuba', 'Haití', 'República Dominicana', 'Honduras', 'Nicaragua', 
    'El Salvador', 'Costa Rica', 'Panamá', 'España', 'Francia', 
    'Alemania', 'Italia', 'Reino Unido', 'Portugal', 'Países Bajos', 
    'Bélgica', 'Suiza', 'Austria', 'Estados Unidos', 'Canadá', 'China', 
    'Japón', 'Corea del Sur', 'India', 'Tailandia', 'Singapur', 'Malasia', 
    'Filipinas', 'Indonesia', 'Vietnam', 'Sudáfrica', 'Egipto', 'Nigeria', 
    'Kenia', 'Marruecos', 'Argelia', 'Túnez', 'Libia', 'Etiopía', 'Ghana', 
    'Australia', 'Nueva Zelanda', 'Fiyi', 'Papúa Nueva Guinea', 'Samoa', 
    'Tonga', 'Vanuatu', 'Islas Salomón', 'Kiribati', 'Tuvalu'
)
ORDER BY codigotelefonoid;
