# 📚 DOCUMENTACIÓN Y SCRIPTS PARA DEMO DE ALERTAS

Este directorio contiene scripts y documentación para el sistema de alertas de JoySense.

## 🚀 INICIO RÁPIDO - DEMO ORGANIZADA

**👉 Para ejecutar la demo completa, ve a:** [`demo_run/README.md`](./demo_run/README.md)

Los scripts de demo están organizados en fases dentro de la carpeta `demo_run/`:
- **Fase 1:** Insert de medidas
- **Fase 2:** Consolidar alertas
- **Fase 3:** Escalamiento de alertas

## 📋 ÍNDICE

### 🎯 Scripts de Demo (Organizados en `demo_run/`)
Los scripts de demo han sido organizados en fases. Ver [`demo_run/README.md`](./demo_run/README.md) para la guía completa.

### 📖 Documentación
- **`explicacion_alertaconsolidado.md`** - Explicación gráfica completa del sistema de consolidación
- **`explicacion_umbrales.md`** - Explicación de cómo funcionan los umbrales y alertas
- **`explicacion_multiple_umbrales.md`** - Explicación de múltiples umbrales por métrica-tipo

### 🛠️ Scripts de Mantenimiento
- **`fix_empresa_sequence.sql`** - Corrige secuencias de auto-incremento
- **`create_index_medicion_nodo_fecha.sql`** - Crea índices para optimizar consultas
- **`verificar_porque_no_se_crean_mensajes.sql`** - Script de diagnóstico para problemas con mensajes
- **`verificar_y_crear_localizaciones.sql`** - Verifica y crea localizaciones necesarias

## 🚀 GUÍA RÁPIDA PARA DEMO

**Nota:** Para una guía detallada paso a paso, consulta [`demo_run/README.md`](./demo_run/README.md)

### Paso 1: Configurar Umbrales
1. Crear umbrales para los nodos 258 y 259 con rango 500-1000
2. Asociar perfiles a los umbrales usando `demo_run/fase_3_escalamiento/configurar_escalamiento_alertas.sql`

### Paso 2: Insertar Mediciones de Prueba
1. Ejecutar `demo_run/fase_1_insert_medidas/insert_mediciones_demo_alertas.sql` (tipo 1)
2. Ejecutar `demo_run/fase_1_insert_medidas/insert_mediciones_demo_alertas_tipos_2_3.sql` (tipos 2 y 3)

### Paso 3: Consolidar Alertas
Ejecutar `demo_run/fase_2_consolidar/ejecutar_consolidar_alertas.sql`

### Paso 4: Probar Escalamiento (Opcional)
1. Usar `demo_run/fase_3_escalamiento/ajustar_tiempo_consolidado.sql` para forzar escalamiento
2. Ejecutar `demo_run/fase_3_escalamiento/probar_escalamiento_alertas.sql` para verificar configuración
3. Ejecutar nuevamente `demo_run/fase_2_consolidar/ejecutar_consolidar_alertas.sql`

## 📝 NOTAS IMPORTANTES

- Los umbrales deben tener `minimo=500, maximo=1000` para las demos
- Los números de teléfono deben estar en formato internacional (+51...)
- El escalamiento requiere múltiples perfiles asociados al mismo umbral
- La función `fn_consolidar_alertas()` se ejecuta automáticamente cada hora (o manualmente)

## 🔗 ARCHIVOS RELACIONADOS

- `sistema_alerta.txt` (raíz del proyecto) - Definición completa del sistema de alertas

