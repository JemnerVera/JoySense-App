# Cambios Realizados para Filtro de Ubicación

## Resumen
Se corrigió el flujo de filtrado por ubicación en el dashboard "MAPEO DE NODOS". El problema era que el selector de ubicación pasaba un **string (ID)** que no se estaba convirtiendo a un **objeto ubicación** antes de guardarse en el contexto global.

## Archivos Modificados

### 1. `frontend/src/hooks/useCascadingFilters.ts`
**Cambio Principal**: Convertir ID string a objeto ubicación antes de actualizar contexto

**Antes**:
```javascript
const handleUbicacionChange = useCallback((ubicacionId: string) => {
  setUbicacionSeleccionada(ubicacionId);  // ← Guarda string directamente
}, [setUbicacionSeleccionada]);
```

**Después**:
```javascript
const handleUbicacionChange = useCallback((ubicacionId: string) => {
  // 1. Convierte string a número
  // 2. Busca el objeto ubicación en el array
  // 3. Guarda el objeto en el contexto (no el string)
  const ubicacionObj = ubicaciones.find(u => u.ubicacionid === id);
  setUbicacionSeleccionada(ubicacionObj);
}, [setUbicacionSeleccionada, ubicaciones]);
```

**Detalles**:
- Agregó `useFilterData` para obtener el array de ubicaciones
- Convertir string ID a número usando `parseInt()`
- Buscar el objeto completo en el array de ubicaciones
- Logs detallados del proceso

### 2. `frontend/src/components/Dashboard/NodeStatusDashboard.tsx`
**Cambio Principal**: Sincronizar contexto global con estado local + pasar filtros al mapa

**Cambios**:
1. Obtener `ubicacionSeleccionada` y `setUbicacionSeleccionada` del contexto:
   ```javascript
   const { ..., ubicacionSeleccionada, setUbicacionSeleccionada } = useFilters();
   ```

2. Agregar effect para sincronizar contexto global → estado local:
   ```javascript
   useEffect(() => {
     if (ubicacionSeleccionada) {
       setSelectedUbicacion(ubicacionSeleccionada);
     } else if (selectedUbicacion) {
       setSelectedUbicacion(null);
     }
   }, [ubicacionSeleccionada]);
   ```

3. Cambiar `nodes={nodes}` a `nodes={filteredNodes}` en InteractiveMap

4. Agregar `setUbicacionSeleccionada(null)` al botón X para limpiar contexto global

5. Logs detallados del filtrado de nodos

### 3. `frontend/src/App.tsx`
**Cambio Principal**: Sincronizar cambios locales del dashboard con contexto global

**Cambios**:
1. Obtener `setUbicacionSeleccionada` del contexto:
   ```javascript
   const { setUbicacionSeleccionada } = useFilters();
   ```

2. Agregar effect para sincronizar estado local del dashboard → contexto global:
   ```javascript
   useEffect(() => {
     if (dashboardSelectedUbicacion) {
       setUbicacionSeleccionada(dashboardSelectedUbicacion);
     } else {
       setUbicacionSeleccionada(null);
     }
   }, [dashboardSelectedUbicacion?.ubicacionid, setUbicacionSeleccionada]);
   ```

3. Mejorar `handleDashboardUbicacionChange` para convertir ID a objeto (redundante pero seguro):
   ```javascript
   const handleDashboardUbicacionChange = (ubicacionIdOrObject: any) => {
     if (typeof ubicacionIdOrObject === 'string') {
       // Convertir de string a objeto
       const id = parseInt(ubicacionIdOrObject, 10);
       ubicacion = ubicaciones.find(u => u.ubicacionid === id);
     }
     setDashboardSelectedUbicacion(ubicacion);
   };
   ```

4. Logs detallados del proceso

### 4. `frontend/src/components/Dashboard/InteractiveMap.tsx`
**Cambio Principal**: Agregar logs para debugging

**Cambios**:
- Agregar logs para ver cantidad de nodos recibidos y sus ubicacionIds únicas

### 5. `frontend/src/components/shared/filters/CollapsibleGlobalFilters.tsx`
**Cambio Principal**: Agregar logs para debugging

**Cambios**:
- Log cuando se selecciona una ubicación

## Flujo Después de los Cambios

1. **Usuario selecciona ubicación** en filtro global
2. **CollapsibleGlobalFilters** llama `onUbicacionChange('102')`
3. **useCascadingFilters.handleUbicacionChange** recibe '102' y:
   - Convierte a número: 102
   - Busca en array: ubicaciones.find(u => u.ubicacionid === 102)
   - Obtiene objeto: `{ ubicacionid: 102, ubicacion: "XXX", ... }`
   - Guarda en contexto: `setUbicacionSeleccionada(objeto)`
4. **NodeStatusDashboard** detecta cambio en `ubicacionSeleccionada`:
   - Sincroniza con estado local: `setSelectedUbicacion(objeto)`
5. **filteredNodes** se recalcula:
   - Filtra por país/empresa/fundo
   - Filtra por ubicacionid === 102
   - Retorna solo 5 nodos con ubicacion 102
6. **InteractiveMap** recibe los 5 nodos filtrados
   - Renderiza solo 5 puntos en el mapa

## Testing

### Pasos para verificar:

1. Abre DevTools (F12)
2. Ve a Console tab
3. Filtra logs por "ubicacion" o "UBICACION"
4. Selecciona una ubicación desde el filtro global
5. Verifica que aparezcan los logs en este orden:
   ```
   [CollapsibleGlobalFilters] Seleccionando ubicación: {ubicacionId: '102', ...}
   [useCascadingFilters] handleUbicacionChange recibido: '102'
   [useCascadingFilters] Búsqueda de ubicación: {...}
   [useCascadingFilters] ✓ Estableciendo ubicación: {ubicacionid: 102, ...}
   [NodeStatusDashboard SYNC EFFECT] ubicacionSeleccionada: {ubicacionid: 102, ...}
   [NodeStatusDashboard] ✓ SINCRONIZANDO ubicación global: {id: 102, ...}
   [NodeStatusDashboard FILTEREDNODES] Nodos después de filtros globales: {...}
   [NodeStatusDashboard FILTEREDNODES] ✓ Con filtro de ubicación 102 → X nodos
   [InteractiveMap] Nodos con GPS: {total: X, nodesRecibidos: X, ubicacionesUnicas: [102]}
   ```

6. Verifica que el mapa solo muestre los puntos de esa ubicación

## Notas Importantes

- El ID se pasa como **string** desde el selector (`'102'`)
- Se convierte a **número** para buscar: `parseInt(ubicacionId, 10)`
- Se obtiene el **objeto completo** del array de ubicaciones
- Se guarda el **objeto completo** en el contexto (no el string)
- Los logs detallados ayudan a identificar en qué paso falla el proceso si vuelve a ocurrir un error
