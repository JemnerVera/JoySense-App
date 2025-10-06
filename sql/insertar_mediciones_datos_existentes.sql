-- Insertar mediciones que activarán alertas con datos existentes
-- Usando umbrales y nodos que realmente existen en la base de datos

INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES 
    -- Umbral 42: temp 12 (18-25°C) - Temperatura fuera de rango
    (1, 1, 1, 1, now(), 30.0, 1),  -- 30°C (fuera de 18-25°C)
    
    -- Umbral 43: temp 13 (23-35°C) - Temperatura fuera de rango  
    (1, 1, 2, 1, now(), 40.0, 1),  -- 40°C (fuera de 23-35°C)
    
    -- Umbral 79: Humedad Crítica Baja (0-10%) - Humedad fuera de rango
    (2, 2, 1, 2, now(), 15.0, 1);  -- 15% (fuera de 0-10%)

