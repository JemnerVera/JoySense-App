# Validación - Deshabilitar Filtros en Modal Detallado

Documento de pruebas para validar que los filtros globales están correctamente deshabilitados cuando el Análisis Detallado está abierto.

## Cambios Implementados

### 1. **ModernDashboard.tsx** 
✅ Sincronización mejorada de `showDetailedAnalysis`:
- `setContextShowDetailedAnalysis(true)` se llama ANTES de abrir el modal
- `setContextShowDetailedAnalysis(false)` se llama ANTES de cerrar el modal
- El useEffect sincroniza el estado local con el contexto global

### 2. **NodeSelector.tsx**
✅ Guard para prevenir sincronización de filtros:
- `syncAllFilters()` retorna temprano si `showDetailedAnalysis` es true
- Registra warning en consola si se intenta sincronizar filtros durante análisis

### 3. **useCascadingFilters.ts**
✅ Checks en todos los handlers de cambio:
- `handlePaisChange()` - Bloquea cambios de país
- `handleEmpresaChange()` - Bloquea cambios de empresa
- `handleFundoChange()` - Bloquea cambios de fundo
- `handleUbicacionChange()` - Bloquea cambios de ubicación
- Todos registran warnings si se intenta cambiar durante análisis

### 4. **CollapsibleGlobalFilters.tsx**
✅ Mejoras visuales de UX:
- Banner de advertencia amarillo en la parte superior
- Icono de candado en cada botón cuando está deshabilitado
- Tooltip mejorado con fondo más visible
- Colores de fondo desaturados (gris amarillento)
- Todos los botones tienen visual feedback claro

## Plan de Pruebas

### Test 1: Abrir el Modal Detallado
1. Navegar al Dashboard
2. Seleccionar un nodo en el mapa
3. Hacer clic en una métrica para abrir el análisis detallado
4. **Validar:**
   - ✓ Banner amarillo aparece en los filtros
   - ✓ Todos los botones de filtro están en gris/desaturados
   - ✓ Los iconos de candado aparecen en cada botón
   - ✓ Los filtros tienen cursor `not-allowed`

### Test 2: Intentar Cambiar Filtros Mientras Modal Está Abierto
1. Con el modal abierto, intentar hacer clic en los selectores de filtro
2. **Validar:**
   - ✓ Los filtros NO cambian (no se abren los dropdowns)
   - ✓ La consola muestra warnings como: `[useCascadingFilters] Cambio de país bloqueado: análisis detallado abierto`
   - ✓ El tooltip aparece al pasar el mouse

### Test 3: Cerrar el Modal
1. Con el modal abierto, hacer clic en el botón "Volver al Mapa"
2. **Validar:**
   - ✓ El modal se cierra
   - ✓ El banner amarillo desaparece
   - ✓ Los botones vuelven a su color normal
   - ✓ Los iconos de candado desaparecen
   - ✓ Los filtros vuelven a ser clickeables

### Test 4: Cambiar Filtros Después de Cerrar Modal
1. Con el modal cerrado, intentar cambiar filtros
2. **Validar:**
   - ✓ Los filtros cambian normalmente
   - ✓ Los dropdowns se abren
   - ✓ Los valores se actualizan
   - ✓ Los nodos en el mapa se actualizan según los nuevos filtros

### Test 5: Seleccionar Nuevo Nodo Desde el Mapa (Modal Abierto)
1. Con el modal abierto, intentar hacer clic en otro nodo en el mapa
2. **Validar:**
   - ✓ Los filtros globales NO cambian
   - ✓ La consola muestra warning: `[NodeSelector] Filtros bloqueados: análisis detallado abierto...`
   - ✓ El modal sigue mostrando datos del nodo original

### Test 6: Verificar Datos Consistentes
1. Abrir análisis detallado para un nodo
2. Cambiar los filtros globales (debería estar bloqueado, pero si llegan a cambiar)
3. **Validar:**
   - ✓ Los datos mostrados en el gráfico corresponden al nodo original
   - ✓ No hay refetch de datos
   - ✓ La métrica sigue siendo la misma

## Archivos Modificados

```
frontend/src/components/Dashboard/ModernDashboard.tsx
  - useEffect en línea 135
  - función openDetailedAnalysis en línea 1760
  - función handleDetailedAnalysisClose en línea 1946

frontend/src/components/Dashboard/NodeSelector.tsx
  - Agregado showDetailedAnalysis a useFilters en línea 48
  - Modificada función syncAllFilters en línea 186

frontend/src/hooks/useCascadingFilters.ts
  - Agregado showDetailedAnalysis a useFilters en línea 1
  - Guard en handlePaisChange en línea 21
  - Guard en handleEmpresaChange en línea 30
  - Guard en handleFundoChange en línea 38
  - Guard en handleUbicacionChange en línea 45

frontend/src/components/shared/filters/CollapsibleGlobalFilters.tsx
  - Banner de advertencia en línea 150
  - Mejorado feedback visual en botones de País, Empresa, Fundo, Ubicación
  - Tooltips mejorados para cada nivel
```

## Logs Esperados en la Consola

Cuando intentas cambiar filtros con el modal abierto:
```
[useCascadingFilters] Cambio de país bloqueado: análisis detallado abierto
[useCascadingFilters] Cambio de empresa bloqueado: análisis detallado abierto
[useCascadingFilters] Cambio de fundo bloqueado: análisis detallado abierto
[useCascadingFilters] Cambio de ubicación bloqueado: análisis detallado abierto
[NodeSelector] Filtros bloqueados: análisis detallado abierto. Selección de nodo ignorada.
```

Cuando todo funciona normalmente con el modal cerrado:
```
[useCascadingFilters] handleUbicacionChange recibido: 123
[useCascadingFilters] ✓ Estableciendo ubicación: {...}
```

## Checklist de Validación

- [ ] El banner amarillo aparece cuando se abre el modal
- [ ] Los iconos de candado aparecen en los botones de filtro
- [ ] Los filtros no se pueden cambiar mientras el modal está abierto
- [ ] Los warnings aparecen en la consola al intentar cambiar filtros
- [ ] El tooltip mejorado muestra información clara
- [ ] Al cerrar el modal, los filtros se habilitan nuevamente
- [ ] Los datos en el gráfico permanecen consistentes
- [ ] No hay refetch involuntario de datos
- [ ] El flujo visual es claro para el usuario

## Notas Técnicas

1. **Sincronización bidireccional**: El estado `showDetailedAnalysis` se sincroniza entre el componente local (`ModernDashboard`) y el contexto global (`FilterContext`).

2. **Guards en múltiples niveles**: 
   - Nivel 1: `useCascadingFilters` previene cambios de estado
   - Nivel 2: `NodeSelector` previene sincronización
   - Nivel 3: UI visual hace claro que está deshabilitado

3. **Compatibilidad**: Los cambios son 100% compatibles con el código existente. No hay breaking changes.

4. **Performance**: No hay impacto en performance. Solo se agregaron checks simples con `if` statements.
