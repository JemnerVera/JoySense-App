-- Insertar mediciones que activarán alertas para los umbrales de prueba
-- Nodo: rls 3331 (nodoid: 289)
-- Valores fuera de rango para generar alertas

INSERT INTO sense.medicion (ubicacionid, nodoid, tipoid, metricaid, fecha, medicion, usercreatedid) 
VALUES 
    -- prueba2.0: Temperatura 12-17°C → 20°C (fuera de rango)
    (1, 289, 1, 1, now(), 20.0, 1),
    
    -- prueba2.1: Humedad 25-40% → 50% (fuera de rango)
    (1, 289, 1, 2, now(), 50.0, 1),
    
    -- prueba2.2: Electroconductividad 8-12 → 15 (fuera de rango)
    (1, 289, 1, 3, now(), 15.0, 1),
    
    -- prueba2.3: Temperatura 13-18°C → 22°C (fuera de rango)
    (1, 289, 2, 1, now(), 22.0, 1),
    
    -- prueba2.4: Humedad 30-44.96% → 60% (fuera de rango)
    (1, 289, 2, 2, now(), 60.0, 1),
    
    -- prueba2.5: Electroconductividad 12-19.97 → 25 (fuera de rango)
    (1, 289, 2, 3, now(), 25.0, 1);
