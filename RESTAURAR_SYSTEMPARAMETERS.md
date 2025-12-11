# 🔧 Plan de Restauración: SystemParameters

## 📋 Objetivo
Restaurar las funcionalidades de la tabla de **Estado**, **Crear** y **Actualizar** que se perdieron en la refactorización.

## 🔍 Funcionalidades Perdidas Identificadas

### 1. Tabla de Estado (`activeSubTab === 'status'`)

#### Funcionalidades que faltan:
- ✅ **TableStatsDisplay** - Estadísticas de la tabla (total registros, etc.)
- ✅ **SearchBarWithCounter** - Búsqueda con contador de resultados filtrados
- ✅ **Columnas visibles dinámicas** - `statusVisibleColumns` con lógica especial
- ✅ **Formateo especial de campos**:
  - `statusid` → Mostrar como "ACTIVO/INACTIVO" con colores (verde/rojo)
  - `usercreatedid` / `usermodifiedid` → Mostrar nombre de usuario con `getUserName()`
  - `datecreated` / `datemodified` → Formatear fechas con `formatDate()`
  - `password_hash` → Mostrar/ocultar contraseña con botón toggle
- ✅ **Paginación** - `PaginationControls` con `statusCurrentPage` y `statusTotalPages`
- ✅ **Funciones helper**:
  - `getDisplayValueLocal()` - Formateo de valores según tipo de columna
  - `getColumnDisplayNameTranslated()` - Nombres de columnas traducidos
  - `getStatusPaginatedData()` - Datos paginados para la tabla de Estado
- ✅ **Manejo de filas agrupadas** - Para tablas como `sensor` y `metricasensor`
- ✅ **Estilos especiales** - Font mono, tracking-wider, colores específicos

### 2. Formulario de Crear (`activeSubTab === 'insert'`)

#### Funcionalidades que faltan:
- ✅ **Formularios especiales por tabla**:
  - `MultipleSensorForm` - Para crear múltiples sensores
  - `MultipleMetricaSensorForm` - Para crear múltiples métricas-sensor
  - `MultipleUsuarioPerfilForm` - Para crear múltiples usuario-perfil
  - `NormalInsertForm` - Para tablas normales
- ✅ **InsertionMessage** - Mensaje de registros insertados
- ✅ **Funcionalidades especiales**:
  - Replicación de datos
  - Pegar desde clipboard
  - Filtros globales contextuales (país, empresa, fundo)
  - Selector de tipo de contacto (teléfono/email)

### 3. Formulario de Actualizar (`activeSubTab === 'update'`)

#### Funcionalidades que faltan:
- ✅ **Búsqueda en tabla de actualización** - Similar a Estado
- ✅ **Selección múltiple** - Para `sensor`, `metricasensor`, `usuarioperfil`
- ✅ **Formularios avanzados**:
  - `AdvancedSensorUpdateForm`
  - `AdvancedMetricaSensorUpdateForm`
  - `AdvancedUsuarioPerfilUpdateForm`
- ✅ **Formulario normal** - Para otras tablas
- ✅ **Modal overlay** - Para formulario de actualización
- ✅ **Filtros globales contextuales** - Para formularios de actualización
- ✅ **Layout especial para usuario** - Login, contraseña, nombre, apellido, status
- ✅ **Campos clave como solo lectura** - Con indicador 🔒
- ✅ **Statusid como checkbox** - En lugar de input numérico
- ✅ **Tabla de entradas seleccionadas** - Para actualización múltiple

## 📝 Plan de Implementación

### Fase 1: Restaurar Tabla de Estado
1. ✅ Agregar `TableStatsDisplay` component
2. ✅ Mejorar `SearchBarWithCounter` con contador
3. ✅ Implementar `statusVisibleColumns` con lógica de columnas visibles
4. ✅ Agregar funciones helper:
   - `getDisplayValueLocal()`
   - `getUserName()`
   - `formatDate()`
   - `getColumnDisplayNameTranslated()`
5. ✅ Implementar formateo especial de campos en la tabla
6. ✅ Agregar paginación para tabla de Estado
7. ✅ Manejar filas agrupadas para tablas especiales

### Fase 2: Restaurar Formulario de Crear
1. ✅ Identificar qué formulario usar según la tabla
2. ✅ Restaurar formularios especiales (MultipleSensorForm, etc.)
3. ✅ Agregar InsertionMessage
4. ✅ Implementar funcionalidades de replicación y clipboard

### Fase 3: Restaurar Formulario de Actualizar
1. ✅ Agregar búsqueda en tabla de actualización
2. ✅ Implementar selección múltiple
3. ✅ Restaurar formularios avanzados
4. ✅ Agregar modal overlay
5. ✅ Implementar layout especial para usuario
6. ✅ Agregar tabla de entradas seleccionadas

## 🚀 Comenzar con Fase 1

¿Quieres que comience restaurando la tabla de Estado primero? Es la más visible y la que más funcionalidades tiene.

