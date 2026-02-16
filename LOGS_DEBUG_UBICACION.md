# Logs de Debug para Filtro de Ubicación

## Flujo esperado cuando se selecciona una ubicación:

### 1. En CollapsibleGlobalFilters (componente de filtro):
```
[CollapsibleGlobalFilters] Seleccionando ubicación: {
  ubicacionId: "123",
  ubicacionesOptions: { id: 123, name: "Ubicación XXX" }
}
```

### 2. En App.tsx (manejo del filtro):
```
[App handleDashboardUbicacionChange] Recibido: '123' tipo: string
[App handleDashboardUbicacionChange] Convertido de ID string: {
  id: 123,
  ubicacionEncontrada: { ubicacionid: 123, ubicacion: "Ubicación XXX", ... }
}
[App handleDashboardUbicacionChange] Estableciendo ubicación: { ubicacionid: 123, ... }
[App SYNC EFFECT] dashboardSelectedUbicacion cambió: { ubicacionid: 123, ... }
[App] ✓ Sincronizando ubicación al contexto global: {
  id: 123,
  nombre: "Ubicación XXX"
}
```

### 3. En NodeStatusDashboard (sincronización con contexto):
```
[NodeStatusDashboard SYNC EFFECT] ubicacionSeleccionada: { ubicacionid: 123, ... }
[NodeStatusDashboard SYNC EFFECT] selectedUbicacion: null (o objeto anterior)
[NodeStatusDashboard] ✓ SINCRONIZANDO ubicación global: {
  id: 123,
  nombre: "Ubicación XXX"
}
```

### 4. En NodeStatusDashboard (filtrado de nodos):
```
[NodeStatusDashboard FILTEREDNODES] Nodos después de filtros globales: {
  total: 50,  (ejemplo)
  pais: "1",
  empresa: "5",
  fundo: "10",
  ubicacionSeleccionada: 123
}
[NodeStatusDashboard FILTEREDNODES] ✓ Con filtro de ubicación 123 → 5 nodos
```

### 5. En InteractiveMap (renderizado del mapa):
```
[InteractiveMap] Nodos con GPS: {
  total: 5,
  nodesRecibidos: 5,
  ubicacionesUnicas: [123]
}
```

## ¿Qué buscar si no funciona?

1. **Si los logs de CollapsibleGlobalFilters no aparecen**: El click en el selector de ubicación no se está registrando
2. **Si App handleDashboardUbicacionChange no aparece**: El callback no se está llamando desde el filtro
3. **Si SYNC EFFECT de App no aparece**: El estado `dashboardSelectedUbicacion` no está cambiando
4. **Si SYNC EFFECT de NodeStatusDashboard no aparece**: El contexto global `ubicacionSeleccionada` no se está actualizando
5. **Si FILTEREDNODES muestra más nodos de lo esperado**: El filtro de ubicación no se está aplicando correctamente
6. **Si InteractiveMap recibe todos los nodos**: Los filteredNodes no se está pasando al mapa

## Pasos para verificar:

1. Abre la consola del navegador (F12)
2. Filtra por "ubicacion" para ver solo los logs relevantes
3. Selecciona una ubicación desde el filtro global
4. Verifica que todos los logs aparezcan en orden
5. Compara los IDs de ubicación en cada log para asegurar que son consistentes
