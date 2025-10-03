# 🚀 PLAN PILOTO - SISTEMA DE ALERTAS Y WHATSAPP

**Fecha**: 2025-10-02  
**Objetivo**: Implementar y probar el sistema completo de alertas consolidadas con notificaciones WhatsApp

---

## 📋 RESUMEN EJECUTIVO

### **Sistema Completo Implementado:**
- ✅ **6 Funciones** de base de datos para consolidación y validación
- ✅ **6 Triggers** automáticos para procesamiento en tiempo real
- ✅ **1 Webhook** configurado para WhatsApp
- ✅ **19 Tablas** mapeadas y documentadas
- ✅ **Estructura real** de `alertaconsolidado` verificada

### **Flujo Automático:**
1. **Datos de sensores** → `sensor_valor` → `medicion` (trigger automático)
2. **Mediciones** → `alerta` (trigger automático si supera umbrales)
3. **Alertas** → `alertaconsolidado` (función periódica de consolidación)
4. **Alertas consolidadas** → `mensaje` (función de frecuencia/escalamiento)
5. **Mensajes** → **WhatsApp** (webhook automático)

---

## 🎯 OBJETIVOS DEL PILOTO

### **Objetivo Principal:**
Probar el sistema completo de alertas consolidadas con notificaciones WhatsApp en un entorno controlado.

### **Objetivos Específicos:**
1. **Validar** que los triggers funcionen correctamente
2. **Probar** la consolidación de alertas similares
3. **Verificar** el envío de mensajes WhatsApp
4. **Confirmar** el escalamiento de alertas
5. **Medir** el rendimiento del sistema

---

## 🔧 COMPONENTES DEL SISTEMA

### **1. FUNCIONES DE BASE DE DATOS:**
- `fn_auditar_umbral()` - Auditoría de cambios en umbrales
- `fn_consolidar_alertas()` - Consolidación de alertas similares
- `fn_insertar_medicion()` - Inserción de mediciones desde sensores
- `fn_medicion_dispara_alerta()` - Disparo de alertas por umbrales
- `fn_validar_umbral_minimo_maximo()` - Validación de umbrales
- `fn_guard_one_active_entity_set_per_nodo()` - Validación de sensores por nodo

### **2. TRIGGERS AUTOMÁTICOS:**
- `trg_auditar_umbral` - Auditoría en `umbral`
- `trg_enviar_whatspp` - Webhook WhatsApp en `mensaje`
- `trg_guard_one_active_entity_set_per_nodo` - Validación en `sensor`
- `trg_insertar_medicion` - Inserción en `sensor_valor`
- `trg_medicion_dispara_alerta` - Disparo en `medicion`
- `trg_validar_umbral` - Validación en `umbral`

### **3. WEBHOOK WHATSAPP:**
- **Tabla**: `sense.mensaje`
- **Eventos**: INSERT, UPDATE
- **Función**: Supabase Edge Function "enviar-mensaje"
- **Método**: POST
- **Timeout**: 5000ms

---

## 📊 DATOS DE PRUEBA REQUERIDOS

### **1. CONFIGURACIÓN BÁSICA:**
```sql
-- Ubicaciones de prueba
INSERT INTO sense.ubicacion (ubicacion, fundoid, statusid) VALUES
('Ubicación Piloto 1', 1, 1),
('Ubicación Piloto 2', 1, 1);

-- Nodos de prueba
INSERT INTO sense.nodo (nodo, statusid) VALUES
('NODO-PILOTO-01', 1),
('NODO-PILOTO-02', 1);

-- Localizaciones de prueba
INSERT INTO sense.localizacion (ubicacionid, nodoid, referencia, latitud, longitud, statusid) VALUES
(1, 1, 'Ref-Piloto-1', -12.0464, -77.0428, 1),
(2, 2, 'Ref-Piloto-2', -12.0464, -77.0428, 1);

-- Métricas de prueba
INSERT INTO sense.metrica (metrica, unidad, statusid) VALUES
('Temperatura', '°C', 1),
('Humedad', '%', 1);

-- Tipos de prueba
INSERT INTO sense.tipo (tipo, entidadid, statusid) VALUES
('Sensor Temperatura', 1, 1),
('Sensor Humedad', 1, 1);

-- Criticidades de prueba
INSERT INTO sense.criticidad (criticidad, frecuencia, escalamiento, escalon, statusid) VALUES
('Baja', 2, 4, 1, 1),    -- Cada 2 horas, escalamiento cada 4 horas
('Media', 1, 2, 1, 1),   -- Cada 1 hora, escalamiento cada 2 horas
('Alta', 0.5, 1, 1, 1);  -- Cada 30 min, escalamiento cada 1 hora
```

### **2. UMBRALES DE PRUEBA:**
```sql
-- Umbrales que se activarán con datos de prueba
INSERT INTO sense.umbral (ubicacionid, nodoid, tipoid, metricaid, minimo, maximo, criticidadid, statusid) VALUES
(1, 1, 1, 1, 15, 25, 1, 1),  -- Temperatura: 15-25°C (Baja)
(1, 1, 2, 2, 30, 70, 2, 1),  -- Humedad: 30-70% (Media)
(2, 2, 1, 1, 10, 30, 3, 1);  -- Temperatura: 10-30°C (Alta)
```

### **3. USUARIOS Y CONTACTOS:**
```sql
-- Usuarios de prueba
INSERT INTO sense.usuario (login, firstname, lastname, nivel, statusid) VALUES
('admin.piloto', 'Admin', 'Piloto', 3, 1),
('supervisor.piloto', 'Supervisor', 'Piloto', 2, 1),
('operador.piloto', 'Operador', 'Piloto', 1, 1);

-- Contactos de WhatsApp (números reales para prueba)
INSERT INTO sense.contacto (usuarioid, celular, codigotelefonoid, statusid) VALUES
(1, '987654321', 1, 1),  -- +51 987654321
(2, '987654322', 1, 1),  -- +51 987654322
(3, '987654323', 1, 1);  -- +51 987654323

-- Perfiles de prueba
INSERT INTO sense.perfil (perfil, nivel, statusid) VALUES
('Administrador', 3, 1),
('Supervisor', 2, 1),
('Operador', 1, 1);

-- Asignaciones usuario-perfil
INSERT INTO sense.usuarioperfil (usuarioid, perfilid, statusid) VALUES
(1, 1, 1),  -- Admin -> Administrador
(2, 2, 1),  -- Supervisor -> Supervisor
(3, 3, 1);  -- Operador -> Operador

-- Asignaciones perfil-umbral
INSERT INTO sense.perfilumbral (perfilid, umbralid, statusid) VALUES
(1, 1, 1),  -- Administrador -> Umbral 1
(1, 2, 1),  -- Administrador -> Umbral 2
(1, 3, 1),  -- Administrador -> Umbral 3
(2, 1, 1),  -- Supervisor -> Umbral 1
(2, 2, 1),  -- Supervisor -> Umbral 2
(3, 1, 1);  -- Operador -> Umbral 1
```

---

## 🧪 ESCENARIOS DE PRUEBA

### **Escenario 1: Alerta Simple**
1. **Insertar medición** que supere umbral
2. **Verificar** que se genere alerta automáticamente
3. **Ejecutar** función de consolidación
4. **Verificar** que se genere mensaje
5. **Confirmar** envío WhatsApp

### **Escenario 2: Consolidación de Alertas**
1. **Insertar múltiples mediciones** similares en 1 hora
2. **Ejecutar** función de consolidación
3. **Verificar** que se consolide en `alertaconsolidado`
4. **Confirmar** que solo se envíe 1 mensaje WhatsApp

### **Escenario 3: Escalamiento**
1. **Insertar medición** que supere umbral
2. **Esperar** período de escalamiento
3. **Ejecutar** función de consolidación
4. **Verificar** que se envíe mensaje a nivel superior

### **Escenario 4: Validaciones**
1. **Intentar insertar** umbral con mínimo >= máximo
2. **Verificar** que se rechace con error
3. **Intentar activar** sensor de entidad diferente en mismo nodo
4. **Verificar** que se rechace con error

---

## ⚙️ CONFIGURACIÓN TÉCNICA

### **1. EJECUTAR FUNCIONES Y TRIGGERS:**
```sql
-- Ejecutar el archivo completo
\i sql/functions_and_triggers.sql
```

### **2. CONFIGURAR CRON JOB:**
```sql
-- Ejecutar consolidación cada hora
SELECT cron.schedule('consolidar-alertas', '0 * * * *', 'SELECT sense.fn_consolidar_alertas();');
```

### **3. VERIFICAR WEBHOOK:**
- Confirmar que la Edge Function "enviar-mensaje" esté desplegada
- Verificar que el token de autorización sea válido
- Probar envío manual de mensaje

---

## 📈 MÉTRICAS DE ÉXITO

### **Funcionalidad:**
- ✅ **100%** de mediciones procesadas correctamente
- ✅ **100%** de alertas generadas cuando corresponde
- ✅ **100%** de consolidaciones funcionando
- ✅ **100%** de mensajes WhatsApp enviados

### **Rendimiento:**
- ⏱️ **< 1 segundo** para procesar medición
- ⏱️ **< 5 segundos** para consolidación completa
- ⏱️ **< 10 segundos** para envío WhatsApp

### **Confiabilidad:**
- 🔄 **0%** de pérdida de datos
- 🔄 **0%** de mensajes duplicados
- 🔄 **0%** de errores en triggers

---

## 🚨 PLAN DE CONTINGENCIA

### **Si falla la consolidación:**
1. Verificar logs de la función `fn_consolidar_alertas`
2. Revisar datos en `alertaconsolidado`
3. Ejecutar consolidación manual si es necesario

### **Si falla el webhook WhatsApp:**
1. Verificar logs de la Edge Function
2. Confirmar token de autorización
3. Probar envío manual de mensaje

### **Si fallan los triggers:**
1. Verificar que las funciones existan
2. Confirmar permisos de ejecución
3. Revisar logs de PostgreSQL

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### **Día 1: Preparación**
- [ ] Ejecutar funciones y triggers
- [ ] Configurar datos de prueba
- [ ] Verificar webhook WhatsApp

### **Día 2: Pruebas Básicas**
- [ ] Escenario 1: Alerta Simple
- [ ] Escenario 4: Validaciones
- [ ] Ajustar configuraciones

### **Día 3: Pruebas Avanzadas**
- [ ] Escenario 2: Consolidación
- [ ] Escenario 3: Escalamiento
- [ ] Medir rendimiento

### **Día 4: Optimización**
- [ ] Ajustar frecuencias
- [ ] Optimizar consultas
- [ ] Documentar resultados

### **Día 5: Producción**
- [ ] Desplegar en producción
- [ ] Monitorear sistema
- [ ] Capacitar usuarios

---

## 📝 CHECKLIST FINAL

### **Antes del Piloto:**
- [ ] Todas las funciones creadas
- [ ] Todos los triggers activos
- [ ] Webhook WhatsApp configurado
- [ ] Datos de prueba insertados
- [ ] Cron job configurado

### **Durante el Piloto:**
- [ ] Monitorear logs continuamente
- [ ] Verificar envío de mensajes
- [ ] Medir tiempos de respuesta
- [ ] Documentar incidencias

### **Después del Piloto:**
- [ ] Analizar métricas de éxito
- [ ] Documentar lecciones aprendidas
- [ ] Planificar mejoras
- [ ] Preparar para producción

---

## 🎉 CONCLUSIÓN

Este plan piloto permitirá validar el sistema completo de alertas consolidadas con WhatsApp en un entorno controlado, asegurando que todos los componentes funcionen correctamente antes del despliegue en producción.

**¡El sistema está listo para el piloto!** 🚀
