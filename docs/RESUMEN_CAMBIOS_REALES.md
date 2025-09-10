# 📊 Resumen de Cambios para Datos Reales del Sistema

## 🎯 **Contexto del Sistema**

Basándome en la última entrada de `sense.medicion`:
```json
{
  "idx": 13,
  "medicionid": 673459,
  "metricaid": 1,
  "nodoid": 7,
  "fecha": "2025-08-06 17:41:48.107082+00",
  "medicion": 18.66,
  "usercreatedid": 1,
  "datecreated": "2025-08-06 22:41:50.617138+00",
  "tipoid": 1,
  "ubicacionid": 4
}
```

## 🔄 **Cambios Realizados en los Scripts**

### **1. Datos de Prueba Actualizados**

#### **Antes (Datos Ficticios):**
- `nodoid = 1`
- `ubicacionid = 1`
- Campos básicos de medición

#### **Después (Datos Reales):**
- `nodoid = 7` (nodo real del sistema)
- `ubicacionid = 4` (ubicación real del sistema)
- Campos completos: `usercreatedid`, `datecreated`

### **2. Estructura de Inserción Actualizada**

#### **Antes:**
```sql
INSERT INTO sense.medicion (medicion, fecha, ubicacionid, metricaid, nodoid, tipoid)
VALUES (25.0, NOW(), 1, 1, 1, 1);
```

#### **Después:**
```sql
INSERT INTO sense.medicion (medicion, fecha, ubicacionid, metricaid, nodoid, tipoid, usercreatedid, datecreated)
VALUES (25.0, NOW(), 4, 1, 7, 1, 1, NOW());
```

### **3. Umbrales de Prueba Realistas**

#### **Configuración:**
- **Nodo**: 7 (nodo real del sistema)
- **Ubicación**: 4 (ubicación real del sistema)
- **Métrica**: 1 (temperatura)
- **Tipo**: 1 (sensor de temperatura)
- **Umbrales**: 20°C - 30°C (rango realista)

### **4. Funciones de Limpieza Actualizadas**

#### **Filtros de Limpieza:**
- Todas las consultas ahora usan `nodoid = 7` y `ubicacionid = 4`
- Limpieza específica para datos de prueba del nodo real
- Preserva datos reales del sistema

## 📁 **Archivos Modificados**

### **1. `test_trigger_simple.sql`**
- ✅ Datos de prueba actualizados a nodo real (7)
- ✅ Estructura de inserción completa
- ✅ Filtros de consulta actualizados

### **2. `test_trigger_alerta.sql`**
- ✅ Datos de prueba actualizados a nodo real (7)
- ✅ Estructura de inserción completa
- ✅ Filtros de consulta actualizados

### **3. `cleanup_test_functions.sql`**
- ✅ Funciones de limpieza actualizadas
- ✅ Filtros específicos para nodo 7
- ✅ Preserva datos reales del sistema

## 🎯 **Beneficios de los Cambios**

### **✅ Realismo:**
1. **Datos reales**: Usa nodo y ubicación existentes en el sistema
2. **Estructura completa**: Incluye todos los campos requeridos
3. **Valores realistas**: Umbrales basados en datos reales

### **✅ Seguridad:**
1. **Limpieza específica**: Solo elimina datos de prueba del nodo 7
2. **Preserva datos reales**: No afecta mediciones existentes
3. **Filtros precisos**: Evita eliminación accidental

### **✅ Compatibilidad:**
1. **Estructura real**: Coincide con la estructura actual de la base de datos
2. **Campos completos**: Incluye `usercreatedid` y `datecreated`
3. **Relaciones correctas**: Mantiene integridad referencial

## 🚀 **Orden de Ejecución Actualizado**

### **Paso 1: Configurar Permisos**
```sql
\i grant_medicion_permissions.sql
```

### **Paso 2: Crear Funciones de Limpieza**
```sql
\i cleanup_test_functions.sql
```

### **Paso 3: Ejecutar Prueba del Trigger**
```sql
\i test_trigger_simple.sql
```

### **Paso 4: Limpiar Después de la Prueba**
```sql
SELECT sense.full_cleanup_test();
```

## 📊 **Datos de Prueba Configurados**

### **Umbrales:**
- **Temperatura Normal**: 20°C - 30°C
- **Temperatura Crítica**: 15°C - 35°C

### **Mediciones de Prueba:**
1. **25°C** - Dentro de umbral (NO genera alerta)
2. **32°C** - Sobre umbral máximo (SÍ genera alerta)
3. **18°C** - Bajo umbral mínimo (SÍ genera alerta)
4. **22°C** - Resolución (marca alertas como resueltas)

### **Usuarios de Prueba:**
- **Usuario**: test@example.com
- **Perfil**: Técnico
- **Contacto**: Email
- **Medio**: Email

## ⚠️ **Consideraciones Importantes**

### **1. Secuencias de Identity:**
- Las secuencias se reinician automáticamente
- No afecta el `medicionid` actual (673459)
- Nuevas mediciones continuarán desde el siguiente número

### **2. Datos Reales Preservados:**
- Solo se modifican datos del nodo 7 para pruebas
- Datos existentes del sistema permanecen intactos
- Limpieza específica y segura

### **3. Permisos Temporales:**
- Solo para pruebas
- Deben revocarse después de las pruebas
- No afecta la seguridad del sistema

## 🎯 **Resultados Esperados**

### **Pruebas del Trigger:**
1. **Medición 25°C**: ✅ No genera alerta
2. **Medición 32°C**: ✅ Genera alerta (sobre umbral)
3. **Medición 18°C**: ✅ Genera alerta (bajo umbral)
4. **Medición 22°C**: ✅ Resuelve alertas

### **Limpieza:**
1. **Datos eliminados**: Solo mediciones de prueba del nodo 7
2. **Secuencias reiniciadas**: Al valor correcto
3. **Sistema limpio**: Listo para nuevas pruebas

---

**Fecha de actualización**: $(date)  
**Versión**: 2.0  
**Estado**: Listo para pruebas con datos reales
