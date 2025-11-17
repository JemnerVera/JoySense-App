# 🚀 DEMO DE ALERTAS - GUÍA DE EJECUCIÓN

Esta carpeta contiene los scripts organizados por fases para ejecutar la demo completa del sistema de alertas de JoySense.

## 📋 ESTRUCTURA DE FASES

### **FASE 1: Insert de Medidas** 📊
Ejecuta estos scripts para insertar mediciones de prueba que generarán alertas.

**Archivos:**
- `fase_1_insert_medidas/insert_mediciones_demo_alertas.sql` - Inserta mediciones para tipo de sensor 1 (nodos 258 y 259)
- `fase_1_insert_medidas/insert_mediciones_demo_alertas_tipos_2_3.sql` - Inserta mediciones para tipos de sensor 2 y 3

**Orden de ejecución:**
1. Primero ejecuta `insert_mediciones_demo_alertas.sql`
2. Luego ejecuta `insert_mediciones_demo_alertas_tipos_2_3.sql`

**Resultado esperado:**
- Se insertan mediciones normales (dentro del rango 500-1000) que NO generan alertas
- Se insertan mediciones fuera de rango (< 500 o > 1000) que SÍ generan alertas
- Las alertas se crean automáticamente en la tabla `sense.alerta`

---

### **FASE 2: Consolidar Alertas** 🔄
Ejecuta la función de consolidación que procesa las alertas y genera mensajes.

**Archivo:**
- `fase_2_consolidar/ejecutar_consolidar_alertas.sql` - Ejecuta `fn_consolidar_alertas()`

**Qué hace:**
1. Consolida alertas activas en `alertaconsolidado`
2. Genera mensajes según la frecuencia configurada en la criticidad
3. Envía notificaciones a los contactos asociados según los perfiles

**Ejecución:**
```sql
SELECT * FROM sense.fn_consolidar_alertas();
```

**Resultado esperado:**
- Se crean registros en `alertaconsolidado` para cada umbral con alertas activas
- Se generan mensajes en la tabla `sense.mensaje` para los contactos configurados
- Los mensajes se envían al nivel más alto configurado (normalmente Director, nivel 0)

---

### **FASE 3: Escalamiento de Alertas** 📈
Configura y prueba el sistema de escalamiento de alertas.

**Archivos:**
- `fase_3_escalamiento/configurar_escalamiento_alertas.sql` - Configura múltiples perfiles para habilitar escalamiento
- `fase_3_escalamiento/ajustar_tiempo_consolidado.sql` - Ajusta fechas de consolidados para pruebas sin esperar horas
- `fase_3_escalamiento/probar_escalamiento_alertas.sql` - Verifica configuración y ajusta fechas para probar escalamiento

**Orden de ejecución:**
1. **Configurar escalamiento:** Ejecuta `configurar_escalamiento_alertas.sql`
   - Verifica la jerarquía de perfiles
   - Asocia múltiples perfiles con diferentes niveles a los umbrales
   - Descomenta las secciones INSERT según necesites

2. **Ajustar tiempos (opcional):** Ejecuta `ajustar_tiempo_consolidado.sql` o `probar_escalamiento_alertas.sql`
   - Retrocede fechas de consolidados para forzar escalamiento sin esperar horas reales
   - Útil para pruebas rápidas

3. **Ejecutar consolidación nuevamente:** Vuelve a ejecutar `fase_2_consolidar/ejecutar_consolidar_alertas.sql`
   - La función detectará que pasó el tiempo de escalamiento
   - Generará mensajes para el siguiente nivel en la jerarquía

**Resultado esperado:**
- Primera notificación: Nivel más alto (ej: Director, nivel 0)
- Después del tiempo de escalamiento: Siguiente nivel (ej: Gerente, nivel 1)
- Continúa bajando niveles hasta llegar al mínimo
- Reenvíos periódicos en el nivel mínimo

---

## 🔄 FLUJO COMPLETO DE LA DEMO

```
1. FASE 1: Insertar mediciones
   ↓
2. FASE 2: Ejecutar consolidación (primera vez)
   ↓
3. FASE 3: Configurar escalamiento
   ↓
4. FASE 3: Ajustar tiempos (opcional, para pruebas rápidas)
   ↓
5. FASE 2: Ejecutar consolidación nuevamente (para ver escalamiento)
```

---

## ⚙️ REQUISITOS PREVIOS

Antes de ejecutar la demo, asegúrate de tener:

1. **Umbrales configurados:**
   - Umbrales para nodos 258 y 259
   - Rango: mínimo=500, máximo=1000
   - Asociados a métrica 3 (Electroconductividad)
   - Tipos de sensor: 1, 2, 3

2. **Perfiles configurados:**
   - Perfiles con diferentes niveles (0=Director, 1=Gerente, etc.)
   - Contactos asociados a usuarios con perfiles

3. **Criticidad configurada:**
   - Frecuencia de reenvío (ej: 1 hora)
   - Tiempo de escalamiento (ej: 2 horas)
   - Niveles por escalamiento

---

## 📝 NOTAS IMPORTANTES

- Los umbrales deben tener `minimo=500, maximo=1000` para las demos
- Los números de teléfono deben estar en formato internacional (+51...)
- El escalamiento requiere múltiples perfiles asociados al mismo umbral
- La función `fn_consolidar_alertas()` se ejecuta automáticamente cada hora (o manualmente)
- Para pruebas rápidas, usa los scripts de ajuste de tiempo en Fase 3

---

## 🔗 ARCHIVOS RELACIONADOS

- `../README_DEMO_ALERTAS.md` - Documentación completa del sistema de alertas
- `../explicacion_alertaconsolidado.md` - Explicación gráfica del sistema de consolidación
- `../explicacion_umbrales.md` - Explicación de umbrales y alertas
- `../explicacion_multiple_umbrales.md` - Explicación de múltiples umbrales

