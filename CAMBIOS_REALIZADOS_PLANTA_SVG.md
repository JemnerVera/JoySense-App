# 📋 Cambios Realizados para Soporte de Mapas SVG de Plantas (PLC)

## 🎯 Objetivo
Implementar visualización de sensores PLC ubicados en plantas procesadoras usando mapas SVG, similar a cómo funciona Leaflet para nodos LoRaWAN.

## 📁 Archivos Creados

### 1. **SVGPlantMap.tsx**
Ubicación: `frontend/src/components/Dashboard/SVGPlantMap.tsx`

**Funcionalidades:**
- Renderiza plantas desde archivos SVG (`mapa_valerie.svg`, `mapa_zoe_uvas.svg`)
- Superpone marcadores interactivos en posiciones relativas (porcentaje 0-100%)
- Detección automática de dimensiones SVG (viewBox o width/height)
- Marcadores con:
  - Colores dinámicos (azul = sin seleccionar, ámbar = seleccionado, rojo = alerta)
  - Animación de pulso para alertas
  - Tooltips al hover
  - Info bar inferior con datos del nodo seleccionado

**Props:**
```typescript
interface SVGPlantMapProps {
  nodes: NodeData[]              // Nodos a mostrar
  selectedNode: NodeData | null  // Nodo seleccionado
  onNodeSelect: (node: NodeData) => void
  loading?: boolean
  fundoid: number               // ID del fundo (determina SVG)
  nodesWithAlerts?: number[]
  defaultNodeColor?: string
}
```

### 2. **SVG_PLANT_MAP_README.md**
Documentación completa sobre integración, estructura de datos, casos de uso y debugging.

## 📝 Archivos Modificados

### 1. **NodeData.ts**
- **Cambio:** Agregado campo `tipoid?: number`
- **Razón:** Necesario para identificar tipo de sensor (LoRaWAN 1,2 vs PLC 3,4)

```typescript
export interface NodeData {
  // ... campos existentes ...
  tipoid?: number  // Tipo de sensor
}
```

### 2. **NodeSelector.tsx**
**Cambios realizados:**

#### A) Importaciones
```typescript
import { SVGPlantMap } from './SVGPlantMap'
import useMemo  // Agregado
```

#### B) Estados
```typescript
const [tipos, setTipos] = useState<any[]>([])  // Agregado
```

#### C) Función loadNodes() enriquecida
- Ahora carga en paralelo: nodos, tipos, sensores
- Enriquece nodos con `tipoid` desde el backend

#### D) Lógica de Detección (CRÍTICA)
```typescript
const { hasPlcNodes, plcUbicacionIds, currentFundoid } = useMemo(() => {
  // Ubicaciones con SVG disponibles
  const SVG_UBICACIONES = [230, 231, 234]
  
  // Filtrar PURO PLC (sin LoRaWAN)
  const plcNodes = filteredNodes.filter(node => {
    const hasPlcUbicacion = SVG_UBICACIONES.includes(node.ubicacionid)
    const couldBePlc = (node.latitud >= 0 && node.latitud <= 100 && 
                       node.longitud >= 0 && node.longitud <= 100)
    return hasPlcUbicacion && couldBePlc
  })
  
  // Filtrar LoRaWAN (GPS válido fuera de 0-100)
  const loraNodes = filteredNodes.filter(node => {
    const isValidGps = (node.latitud > 100 || node.latitud < 0 || 
                       node.longitud > 100 || node.longitud < 0)
    return isValidGps
  })
  
  // CRÍTICO: SVGPlantMap solo si hay PURO PLC
  const isPurePlc = plcNodes.length > 0 && loraNodes.length === 0
  
  return {
    hasPlcNodes: isPurePlc,  // ← CAMBIO CLAVE
    plcUbicacionIds,
    currentFundoid
  }
}, [filteredNodes])
```

#### E) Renderizado condicional del mapa
```typescript
{hasPlcNodes && currentFundoid ? (
  <SVGPlantMap
    nodes={filteredNodes}
    selectedNode={selectedNode}
    onNodeSelect={handleMapNodeClick}
    loading={loading}
    fundoid={currentFundoid}
  />
) : (
  <InteractiveMap
    nodes={filteredNodes}
    selectedNode={selectedNode}
    onNodeSelect={handleMapNodeClick}
    loading={loading}
  />
)}
```

### 3. **ModernDashboard.tsx**
**Cambios realizados para soportar PLC como en MedicionesDashboard:**

#### A) Memoización de sensores y tipos
```typescript
const memoizedSensores = useMemo(() => sensores, [sensores])
const memoizedTipos = useMemo(() => tipos, [tipos])
```

#### B) Función filterByTipoSensor()
```typescript
const filterByTipoSensor = useCallback(
  (data: any[], selectedNode: any): { data: any[]; isLora: boolean } => {
    // Detecta si datos son LoRaWAN (1,2) o PLC (3,4)
    // Para PLC: filtra por localizacionid
    // Para LoRaWAN: devuelve todos los datos
  }, []
)
```

#### C) Aplicación del filtro en 2 lugares:
1. **Línea ~363:** En carga inicial de mediciones
2. **Línea ~795:** En carga de mediciones detalladas

```typescript
const { data: filteredData } = filterByTipoSensor(data || [], selectedNode)
const medicionesData = filteredData || []
```

#### D) Dependencias actualizadas
- `loadMediciones()`: agregado `filterByTipoSensor` a dependencias
- `loadMedicionesForDetailedAnalysis()`: agregado `filterByTipoSensor` a dependencias

## 🔄 Flujo de Funcionamiento

```
Usuario abre MAPEO DE NODOS
    ↓
NodeSelector carga nodos
    ↓
Detecta: ¿hay nodos PLC sin LoRaWAN?
    ├─ SÍ → Mostrar SVGPlantMap
    │   └─ Renderiza todos los nodos en posiciones relativas
    │
    └─ NO → Mostrar InteractiveMap (Leaflet)
        └─ Renderiza nodos con GPS real

Usuario selecciona nodo
    ↓
ModernDashboard aplica filterByTipoSensor()
    ├─ Si es PLC: filtra solo métricas de esa localización
    └─ Si es LoRaWAN: muestra métricas de todo el nodo
```

## 🗺️ Mapeo Fundoid → SVG

| fundoid | Fundo   | Ubicaciones | SVG File          |
|---------|---------|-------------|-------------------|
| 3       | Valerie | 230, 231    | mapa_valerie.svg  |
| 8       | Zoe     | 234         | mapa_zoe_uvas.svg |

## 📊 Estructura de Coordenadas

### LoRaWAN (Leaflet)
```typescript
nodo.latitud:  -13.745915   // GPS real
nodo.longitud: -76.122351   // GPS real
```

### PLC (SVGPlantMap)
```typescript
nodo.latitud:  35.5   // Porcentaje horizontal (0-100%)
nodo.longitud: 72.3   // Porcentaje vertical (0-100%)
```

## ✅ Soluciones a Problemas

### Problema 1: SVGPlantMap se mostraba con LoRaWAN
**Causa:** Lógica detectaba "si hay PLC mostrar SVG" sin verificar si había LoRaWAN también

**Solución:** 
```typescript
const isPurePlc = plcNodes.length > 0 && loraNodes.length === 0
const hasPlcNodes: isPurePlc  // Solo true si es PURO PLC
```

### Problema 2: ModernDashboard no filtraba correctamente por tipo de sensor
**Causa:** No tenía la lógica `filterByTipoSensor()` de MedicionesDashboard

**Solución:** Copiada y adaptada la función completa

### Problema 3: Múltiples nodos PLC por ubicación no se mostraban
**Causa:** La detección ocultaba el mapa cuando había PLC

**Solución:** SVGPlantMap ahora renderiza TODOS los nodos en `filteredNodes` con sus posiciones relativas

## 🧪 Testing Recomendado

1. **Sin filtros globales → Leaflet**
   - Abrir MAPEO DE NODOS
   - No seleccionar nada en filtros
   - Debería mostrar nodos LoRaWAN en Leaflet

2. **Seleccionar ubicación PLC → SVGPlantMap**
   - Seleccionar Planta 01 (Valerie, ubicacionid 230)
   - Debería mostrar SVGPlantMap con nodos PLC distribuidos

3. **Múltiples nodos PLC**
   - Insertar más nodos PLC en la misma ubicación
   - Todos deberían aparecer en el SVG en diferentes posiciones

4. **Métricas correctas**
   - Seleccionar nodo PLC
   - Verificar que muestre solo métricas de esa localización
   - Seleccionar nodo LoRaWAN
   - Verificar que muestre métricas de todo el nodo

## 🚀 Próximos Pasos (Opcional)

1. **Tab Switcher:** Permitir cambiar entre Leaflet y SVGPlantMap manualmente
2. **Zoom en SVG:** Implementar pan y zoom dentro del mapa SVG
3. **Edición de posiciones:** Permitir drag & drop para reasignar posiciones de sensores
4. **Múltiples plantas:** Selector de qué planta visualizar si hay varias

## 📚 Referencias

- `SVGPlantMap.tsx` - Componente SVG
- `SVG_PLANT_MAP_README.md` - Documentación detallada
- `NodeSelector.tsx` - Lógica de detección
- `ModernDashboard.tsx` - Filtrado por tipo de sensor
- `MedicionesDashboard.tsx` - Referencia de implementación LoRaWAN + PLC
