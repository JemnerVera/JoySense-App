# 🚨 MAPEO COMPLETO DE TABLAS PARA SISTEMA DE ALERTAS Y WHATSAPP

## 📋 RESUMEN EJECUTIVO

Este documento mapea todas las tablas del sistema que están involucradas en el flujo de alertas y envío de mensajes por WhatsApp. Estas tablas son críticas para el funcionamiento del sistema de notificaciones automáticas.

## 🏗️ ARQUITECTURA DEL FLUJO DE ALERTAS

```
MEDICIÓN → UMBRAL → ALERTA → MENSAJE → CONTACTO → WHATSAPP
```

## 📊 TABLAS PRINCIPALES DEL SISTEMA DE ALERTAS

### 1. **TABLA: `medicion`** (Origen de Datos)
**Propósito**: Almacena las lecturas de sensores LoRaWAN que activan las alertas

**Schema**:
```sql
- medicionid (BIGINT, PK, SERIAL)
- medicion (DOUBLE PRECISION) -- Valor numérico de la medición
- fecha (TIMESTAMP WITH TIME ZONE) -- Cuándo se tomó la medición
- ubicacionid (INTEGER, FK) → ubicacion.ubicacionid
- metricaid (INTEGER, FK) → metrica.metricaid
- nodoid (INTEGER, FK) → nodo.nodoid
- tipoid (INTEGER, FK) → tipo.tipoid
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `medicion_pkey` (PRIMARY KEY)
- `medicion_ubicacionid_fkey` (FOREIGN KEY)
- `medicion_metricaid_fkey` (FOREIGN KEY)
- `medicion_nodoid_fkey` (FOREIGN KEY)
- `medicion_tipoid_fkey` (FOREIGN KEY)
- `unq_medicion` (UNIQUE: ubicacionid + nodoid + tipoid + fecha + metricaid)

**Relaciones**:
- Referenciada por: `alerta.medicionid`

---

### 2. **TABLA: `umbral`** (Configuración de Límites)
**Propósito**: Define los límites máximos y mínimos para cada métrica en cada ubicación

**Schema**:
```sql
- umbralid (BIGINT, PK, SERIAL)
- umbral (VARCHAR) -- Nombre del umbral (ej: "Temperatura", "Humedad")
- minimo (DOUBLE PRECISION) -- Valor mínimo permitido
- maximo (DOUBLE PRECISION) -- Valor máximo permitido
- ubicacionid (INTEGER, FK) → ubicacion.ubicacionid
- criticidadid (INTEGER, FK) → criticidad.criticidadid
- nodoid (INTEGER, FK) → nodo.nodoid
- metricaid (INTEGER, FK) → metrica.metricaid
- tipoid (INTEGER, FK) → tipo.tipoid
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `umbral_pkey` (PRIMARY KEY)
- `umbral_ubicacionid_fkey` (FOREIGN KEY)
- `umbral_criticidadid_fkey` (FOREIGN KEY)
- `umbral_nodoid_fkey` (FOREIGN KEY)
- `umbral_metricaid_fkey` (FOREIGN KEY)
- `umbral_tipoid_fkey` (FOREIGN KEY)
- `chk_umbral_minimo_maximo` (CHECK: minimo < maximo)

**Relaciones**:
- Referenciada por: `perfilumbral.umbralid`, `alerta.umbralid`

---

### 3. **TABLA: `criticidad`** (Niveles de Prioridad)
**Propósito**: Define los niveles de criticidad para las alertas

**Schema**:
```sql
- criticidadid (INTEGER, PK, SERIAL)
- criticidad (VARCHAR) -- Nombre del nivel (ej: "Baja", "Media", "Alta", "Crítica")
- grado (INTEGER) -- Nivel numérico de criticidad (1-4)
- frecuencia (INTEGER) -- Frecuencia de notificación en minutos
- escalamiento (BOOLEAN) -- Si requiere escalamiento
- escalon (INTEGER) -- Nivel de escalamiento
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `criticidad_pkey` (PRIMARY KEY)

**Relaciones**:
- Referenciada por: `umbral.criticidadid`

---

### 4. **TABLA: `alerta`** (Alertas Generadas)
**Propósito**: Registra las alertas generadas cuando las mediciones superan los umbrales

**Schema**:
```sql
- alertaid (BIGINT, PK, SERIAL)
- umbralid (INTEGER, FK) → umbral.umbralid
- medicionid (INTEGER, FK) → medicion.medicionid
- fecha (TIMESTAMP WITH TIME ZONE) -- Cuándo se generó la alerta
- statusid (INTEGER, DEFAULT: 1) -- -1=Activa, 1=Resuelta
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `alerta_pkey` (PRIMARY KEY)
- `alerta_umbralid_fkey` (FOREIGN KEY)
- `alerta_medicionid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referenciada por: `alertaconsolidado.alertaid`, `mensaje.alertaid`

---

### 5. **TABLA: `alertaconsolidado`** (Alertas Consolidadas) ⚠️ **CRÍTICA**
**Propósito**: Consolida múltiples alertas del mismo tipo para evitar spam de notificaciones

**Schema** (ESTRUCTURA REAL VERIFICADA):
```sql
- alertaconsolidadoid (INTEGER, PK, SERIAL, default: nextval('sense.alertaconsolidado_alertaconsolidadoid_seq'::regclass))
- alertaid (INTEGER, FK, NOT NULL) → alerta.alertaid -- Alerta principal
- alertas_agrupadas (INTEGER[], nullable) -- Array de alertaid que se consolidaron
- ubicacionid (INTEGER, FK, NOT NULL) → ubicacion.ubicacionid
- metricaid (INTEGER, FK, NOT NULL) → metrica.metricaid
- nodoid (INTEGER, FK, NOT NULL) → nodo.nodoid
- tipoid (INTEGER, FK, NOT NULL) → tipo.tipoid
- criticidadid (INTEGER, FK, NOT NULL) → criticidad.criticidadid
- fecha_inicio (TIMESTAMP WITH TIME ZONE, NOT NULL) -- Primera alerta del grupo
- fecha_fin (TIMESTAMP WITH TIME ZONE, NOT NULL) -- Última alerta del grupo
- cantidad_alertas (INTEGER, NOT NULL, DEFAULT: 1) -- Número de alertas consolidadas
- valor_minimo (DOUBLE PRECISION, nullable) -- Valor mínimo en el período
- valor_maximo (DOUBLE PRECISION, nullable) -- Valor máximo en el período
- valor_promedio (DOUBLE PRECISION, nullable) -- Valor promedio en el período
- statusid (INTEGER, NOT NULL, DEFAULT: 1) -- -1=Activa, 1=Resuelta
- usercreatedid (INTEGER, nullable)
- datecreated (TIMESTAMP WITH TIME ZONE, nullable)
- usermodifiedid (INTEGER, nullable)
- datemodified (TIMESTAMP WITH TIME ZONE, nullable)
```

**Constraints**:
- `alertaconsolidado_pkey` (PRIMARY KEY)
- `alertaconsolidado_alertaid_fkey` (FOREIGN KEY)
- `alertaconsolidado_ubicacionid_fkey` (FOREIGN KEY)
- `alertaconsolidado_metricaid_fkey` (FOREIGN KEY)
- `alertaconsolidado_nodoid_fkey` (FOREIGN KEY)
- `alertaconsolidado_tipoid_fkey` (FOREIGN KEY)
- `alertaconsolidado_criticidadid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referencia: `alerta.alertaid`, `ubicacion.ubicacionid`, `metrica.metricaid`, `nodo.nodoid`, `tipo.tipoid`, `criticidad.criticidadid`
- Referenciada por: `mensaje.alertaconsolidadoid` (opcional)

---

### 6. **TABLA: `mensaje`** (Mensajes para WhatsApp)
**Propósito**: Almacena los mensajes generados para cada alerta y contacto

**Schema**:
```sql
- alertaid (INTEGER, FK) → alerta.alertaid -- Alerta individual (opcional)
- alertaconsolidadoid (INTEGER, FK) → alertaconsolidado.alertaconsolidadoid -- Alerta consolidada (opcional)
- contactoid (INTEGER, FK) → contacto.contactoid
- mensaje (TEXT) -- Contenido del mensaje de WhatsApp
- fecha (TIMESTAMP WITH TIME ZONE) -- Cuándo se envió/creó el mensaje
- statusid (INTEGER, DEFAULT: 1) -- Estado del mensaje
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `mensaje_pkey` (PRIMARY KEY: alertaid + contactoid) -- O alertaconsolidadoid + contactoid
- `mensaje_alertaid_fkey` (FOREIGN KEY) -- Opcional
- `mensaje_alertaconsolidadoid_fkey` (FOREIGN KEY) -- Opcional
- `mensaje_contactoid_fkey` (FOREIGN KEY)
- `chk_mensaje_alerta_or_consolidado` (CHECK: (alertaid IS NOT NULL AND alertaconsolidadoid IS NULL) OR (alertaid IS NULL AND alertaconsolidadoid IS NOT NULL))

**Relaciones**:
- Referencia: `alerta.alertaid` (opcional), `alertaconsolidado.alertaconsolidadoid` (opcional), `contacto.contactoid`

---

## 👥 TABLAS DE USUARIOS Y CONTACTOS

### 7. **TABLA: `usuario`** (Usuarios del Sistema)
**Propósito**: Almacena información de usuarios que pueden recibir alertas

**Schema**:
```sql
- usuarioid (INTEGER, PK, SERIAL)
- login (VARCHAR, UNIQUE) -- Nombre de usuario
- firstname (VARCHAR) -- Nombre
- lastname (VARCHAR) -- Apellido
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `usuario_pkey` (PRIMARY KEY)
- `usuario_login_key` (UNIQUE)

**Relaciones**:
- Referenciada por: `contacto.usuarioid`, `correo.usuarioid`, `perfilumbral.usuarioid`

---

### 8. **TABLA: `contacto`** (Contactos de Teléfono)
**Propósito**: Almacena números de teléfono para WhatsApp

**Schema**:
```sql
- contactoid (INTEGER, PK, SERIAL)
- usuarioid (INTEGER, FK) → usuario.usuarioid
- celular (VARCHAR) -- Número de teléfono
- codigotelefonoid (INTEGER, FK) → codigotelefono.codigotelefonoid
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `contacto_pkey` (PRIMARY KEY)
- `contacto_usuarioid_fkey` (FOREIGN KEY)
- `contacto_codigotelefonoid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referenciada por: `mensaje.contactoid`

---

### 9. **TABLA: `correo`** (Contactos de Email)
**Propósito**: Almacena direcciones de correo electrónico

**Schema**:
```sql
- correoid (INTEGER, PK, SERIAL)
- usuarioid (INTEGER, FK) → usuario.usuarioid
- correo (VARCHAR) -- Dirección de email
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `correo_pkey` (PRIMARY KEY)
- `correo_usuarioid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referencia: `usuario.usuarioid`

---

### 10. **TABLA: `codigotelefono`** (Códigos de País)
**Propósito**: Almacena códigos de país para números de teléfono

**Schema**:
```sql
- codigotelefonoid (INTEGER, PK, SERIAL)
- codigotelefono (VARCHAR) -- Código de país (ej: "+51", "+1")
- paistelefono (VARCHAR) -- Nombre del país
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `codigotelefono_pkey` (PRIMARY KEY)
- `unq_codigotelefono_0` (UNIQUE: codigotelefono + paistelefono)

**Relaciones**:
- Referenciada por: `contacto.codigotelefonoid`

---

## 🎯 TABLAS DE PERFILES Y PERMISOS

### 11. **TABLA: `perfil`** (Perfiles de Usuario)
**Propósito**: Define roles y perfiles de usuario

**Schema**:
```sql
- perfilid (INTEGER, PK, SERIAL)
- perfil (VARCHAR) -- Nombre del perfil (ej: "Administrador", "Técnico")
- nivel (INTEGER, DEFAULT: 0) -- Nivel jerárquico
- jefeid (INTEGER, FK) → perfil.perfilid -- Jefe jerárquico
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `perfil_pkey` (PRIMARY KEY)
- `perfil_jefeid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referenciada por: `perfilumbral.perfilid`, `usuarioperfil.perfilid`

---

### 12. **TABLA: `perfilumbral`** (Relación Perfil-Umbral)
**Propósito**: Define qué perfiles reciben alertas de qué umbrales

**Schema**:
```sql
- perfilid (INTEGER, FK) → perfil.perfilid
- umbralid (INTEGER, FK) → umbral.umbralid
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `perfilumbral_pkey` (PRIMARY KEY: perfilid + umbralid)
- `perfilumbral_perfilid_fkey` (FOREIGN KEY)
- `perfilumbral_umbralid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referencia: `perfil.perfilid`, `umbral.umbralid`

---

### 13. **TABLA: `usuarioperfil`** (Relación Usuario-Perfil)
**Propósito**: Define qué usuarios tienen qué perfiles

**Schema**:
```sql
- usuarioid (INTEGER, FK) → usuario.usuarioid
- perfilid (INTEGER, FK) → perfil.perfilid
- statusid (INTEGER, DEFAULT: 1)
- usercreatedid (INTEGER)
- datecreated (TIMESTAMP WITH TIME ZONE)
- usermodifiedid (INTEGER)
- datemodified (TIMESTAMP WITH TIME ZONE)
```

**Constraints**:
- `usuarioperfil_pkey` (PRIMARY KEY: usuarioid + perfilid)
- `usuarioperfil_usuarioid_fkey` (FOREIGN KEY)
- `usuarioperfil_perfilid_fkey` (FOREIGN KEY)

**Relaciones**:
- Referencia: `usuario.usuarioid`, `perfil.perfilid`

---

## 🔗 FLUJO COMPLETO DE ALERTAS Y WHATSAPP

### **PASO 1: DETECCIÓN DE ALERTA**
1. **Trigger** se activa en `medicion` (INSERT/UPDATE)
2. **Función** compara `medicion.medicion` con `umbral.minimo/maximo`
3. **Si supera umbral** → Crea registro en `alerta`

### **PASO 2: CONSOLIDACIÓN DE ALERTAS** ⚠️ **CRÍTICO**
1. **Función de consolidación** agrupa alertas similares:
   - **Criterios de agrupación**: `ubicacionid`, `metricaid`, `nodoid`, `tipoid`, `criticidadid`
   - **Período de consolidación**: Basado en `criticidad.frecuencia`
   - **Si hay alertas similares activas** → Actualiza `alertaconsolidado` existente
   - **Si es nueva** → Crea nuevo `alertaconsolidado`

2. **Lógica de consolidación**:
   ```sql
   -- Buscar alertas similares activas en el período
   SELECT alertaconsolidadoid, cantidad_alertas, valor_maximo
   FROM alertaconsolidado 
   WHERE ubicacionid = [ubicacion] 
   AND metricaid = [metrica] 
   AND nodoid = [nodo] 
   AND tipoid = [tipo]
   AND criticidadid = [criticidad]
   AND statusid = -1 -- Activa
   AND fecha_fin > NOW() - INTERVAL '[frecuencia] minutes'
   ```

### **PASO 3: DETERMINACIÓN DE RECEPTORES**
1. **Query** busca usuarios con perfiles que reciben este umbral:
   ```sql
   SELECT DISTINCT u.usuarioid, u.login, u.firstname, u.lastname
   FROM usuario u
   JOIN usuarioperfil up ON u.usuarioid = up.usuarioid
   JOIN perfilumbral pu ON up.perfilid = pu.perfilid
   WHERE pu.umbralid = [umbral_alertado]
   AND u.statusid = 1 AND up.statusid = 1 AND pu.statusid = 1
   ```

### **PASO 4: GENERACIÓN DE MENSAJES**
1. **Para cada usuario** con perfil relevante:
   - Busca `contacto` con `usuarioid`
   - Si existe contacto → Crea `mensaje` con contenido personalizado
   - **Mensaje incluye**: Ubicación, métrica, valores consolidados, criticidad

### **PASO 5: ENVÍO POR WHATSAPP**
1. **Webhook** lee `mensaje` con `statusid = 1` (pendiente)
2. **Formato mensaje consolidado**:
   ```
   🚨 ALERTA SENSOR CONSOLIDADA
   
   📍 Ubicación: [ubicacion.ubicacion]
   📊 Métrica: [metrica.metrica]
   📈 Valores: Min: [valor_minimo] | Max: [valor_maximo] | Prom: [valor_promedio]
   ⚠️ Límite: [umbral.minimo/maximo]
   🔥 Criticidad: [criticidad.criticidad]
   📊 Alertas: [cantidad_alertas] en [período]
   
   📅 [fecha_inicio] - [fecha_fin]
   ```
3. **Envío** a `contacto.celular` con `codigotelefono.codigotelefono`
4. **Actualización** `mensaje.statusid = 2` (enviado)

---

## 🚀 TABLAS CRÍTICAS PARA EL PILOTO

### **TABLAS PRINCIPALES** (Deben tener datos):
1. ✅ `medicion` - Datos de sensores
2. ✅ `umbral` - Límites configurados
3. ✅ `criticidad` - Niveles de prioridad
4. ✅ `alerta` - Alertas generadas
5. ⚠️ `alertaconsolidado` - Alertas consolidadas (CRÍTICA)
6. ✅ `mensaje` - Mensajes para WhatsApp

### **TABLAS DE USUARIOS** (Deben tener datos):
7. ✅ `usuario` - Usuarios del sistema
8. ✅ `contacto` - Números de WhatsApp
9. ✅ `codigotelefono` - Códigos de país
10. ✅ `perfil` - Perfiles de usuario
11. ✅ `perfilumbral` - Qué perfiles reciben qué alertas
12. ✅ `usuarioperfil` - Qué usuarios tienen qué perfiles

### **TABLAS DE REFERENCIA** (Ya configuradas):
13. ✅ `ubicacion` - Ubicaciones de sensores
14. ✅ `metrica` - Tipos de métricas
15. ✅ `nodo` - Nodos de sensores
16. ✅ `tipo` - Tipos de sensores

---

## 📋 CHECKLIST PARA EL PILOTO

### **CONFIGURACIÓN INICIAL**:
- [ ] **CRÍTICO**: Crear tabla `alertaconsolidado` en la base de datos
- [ ] Verificar que `criticidad` tenga niveles configurados (incluyendo `frecuencia`)
- [ ] Verificar que `umbral` tenga límites configurados para ubicaciones de prueba
- [ ] Verificar que `perfil` tenga perfiles de usuario
- [ ] Verificar que `usuario` tenga usuarios de prueba
- [ ] Verificar que `contacto` tenga números de WhatsApp válidos
- [ ] Verificar que `perfilumbral` conecte perfiles con umbrales
- [ ] Verificar que `usuarioperfil` conecte usuarios con perfiles

### **DATOS DE PRUEBA**:
- [ ] Insertar mediciones de prueba que superen umbrales
- [ ] Verificar que se generen alertas automáticamente
- [ ] **CRÍTICO**: Verificar que se consoliden alertas en `alertaconsolidado`
- [ ] Verificar que se generen mensajes para usuarios relevantes
- [ ] Probar envío de WhatsApp con números reales

### **MONITOREO**:
- [ ] Verificar logs de triggers
- [ ] **CRÍTICO**: Verificar logs de consolidación de alertas
- [ ] Verificar logs de webhook
- [ ] Verificar logs de WhatsApp API
- [ ] Verificar que mensajes se marquen como enviados

---

## 🔧 NOTAS TÉCNICAS

### **CONSTRAINTS IMPORTANTES**:
- `mensaje` usa clave primaria compuesta (`alertaid` + `contactoid`) O (`alertaconsolidadoid` + `contactoid`)
- `alertaconsolidado` usa clave primaria simple (`alertaconsolidadoid`)
- `perfilumbral` usa clave primaria compuesta (`perfilid` + `umbralid`)
- `usuarioperfil` usa clave primaria compuesta (`usuarioid` + `perfilid`)
- `medicion` tiene constraint único para evitar duplicados
- `alertaconsolidado` tiene array de `alertas_agrupadas` para tracking

### **ÍNDICES RECOMENDADOS**:
- `medicion(fecha, ubicacionid, metricaid)` - Para consultas de trigger
- `alerta(fecha, statusid)` - Para consultas de alertas activas
- `alertaconsolidado(ubicacionid, metricaid, nodoid, tipoid, criticidadid, statusid, fecha_fin)` - Para consolidación
- `mensaje(statusid, fecha)` - Para webhook de WhatsApp
- `perfilumbral(umbralid, perfilid)` - Para determinación de receptores

### **CONSIDERACIONES DE PERFORMANCE**:
- El trigger debe ser eficiente para alto volumen de mediciones
- **CRÍTICO**: La función de consolidación debe ser optimizada para evitar bloqueos
- Las consultas de determinación de receptores deben estar optimizadas
- El webhook debe procesar mensajes en lotes para eficiencia
- La consolidación debe usar transacciones para mantener consistencia

---

**📅 Fecha de creación**: 2025-10-02  
**👤 Autor**: Sistema JoySense  
**🔄 Última actualización**: 2025-10-02  
**📋 Versión**: 1.0
