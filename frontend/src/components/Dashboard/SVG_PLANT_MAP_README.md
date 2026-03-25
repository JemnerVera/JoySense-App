# SVG Plant Map - Guía de Integración

## 📋 Resumen

El componente `SVGPlantMap` proporciona una visualización interactiva de sensores PLC ubicados dentro de plantas procesadoras. Funciona de manera similar a Leaflet, pero usando archivos SVG como fondo de las plantas en lugar de mapas geográficos.

## 🎯 Casos de Uso

### Cuándo se muestra SVGPlantMap
- Cuando se filtran ubicaciones que tienen sensores **PLC** (tipoid 3, 4)
- Cuando se busca una localización perteneciente a una planta con sensores PLC
- Ubicaciones con mapas SVG disponibles:
  - **230** - Planta 01 (Valerie) → `mapa_valerie.svg`
  - **231** - Planta 02 (Valerie) → `mapa_valerie.svg`
  - **234** - Planta 02 (Zoe) → `mapa_zoe_uvas.svg`

### Cuándo se muestra InteractiveMap (Leaflet)
- Cuando se muestran nodos **LoRaWAN** (tipoid 1, 2)
- Cuando los nodos tienen coordenadas GPS reales (latitud/longitud fuera del rango 0-100)

## 📊 Estructura de Datos

### Mapeo Fundoid → SVG
```typescript
const FUNDO_SVG_MAP: Record<number, string> = {
  3: '/mapa_valerie.svg',    // Valerie
  8: '/mapa_zoe_uvas.svg'    // Zoe
}
```

### Identificación de Nodos PLC
```typescript
// Un nodo es PLC si:
1. Pertenece a una ubicación en [230, 231, 234]
2. Tiene latitud y longitud en rango [0-100] (porcentajes)
```

## 🔄 Flujo de Selección

```
Usuario selecciona ubicación/busca localización
        ↓
NodeSelector detecta si hay nodos PLC
        ↓
¿Hay nodos PLC? 
    ├─ SÍ → Mostrar SVGPlantMap
    └─ NO → Mostrar InteractiveMap (Leaflet)
        ↓
Usuario hace click en marcador
        ↓
Se actualiza selectedNode y se sincronizan filtros globales
```

## 🗺️ Coordenadas SVG vs GPS

### Para LoRaWAN (Leaflet):
```typescript
nodo.latitud:  -13.745915  (coordenada GPS real)
nodo.longitud: -76.122351  (coordenada GPS real)
```

### Para PLC (SVGPlantMap):
```typescript
nodo.latitud:  35.5   (porcentaje horizontal en SVG: 0-100%)
nodo.longitud: 72.3   (porcentaje vertical en SVG: 0-100%)
```

La conversión en SVGPlantMap:
```typescript
const x = (node.latitud / 100) * svgDimensions.width
const y = (node.longitud / 100) * svgDimensions.height
```

## 🎨 Características Visuales

### Marcadores
- **Color azul** - Nodo sin seleccionar (por defecto)
- **Color ámbar** - Nodo seleccionado
- **Color rojo** - Nodo con alerta activa
- **Pulso de animación** - En nodos con alerta

### Interactividad
- **Hover** - Muestra tooltip con nombre del nodo
- **Click** - Selecciona el nodo y sincroniza filtros
- **Sombra dinámica** - Indica profundidad visual

### Info Bar
Barra inferior que muestra:
- Nombre del nodo seleccionado
- Localización (si existe)
- Posición en porcentaje (X%, Y%)

## 🔧 Props del Componente

```typescript
interface SVGPlantMapProps {
  nodes: NodeData[]              // Nodos a mostrar
  selectedNode: NodeData | null  // Nodo seleccionado actualmente
  onNodeSelect: (node: NodeData) => void  // Callback al seleccionar
  loading?: boolean              // Estado de carga
  fundoid: number               // ID del fundo (determina SVG a cargar)
  nodesWithAlerts?: number[]    // IDs de nodos con alertas
  defaultNodeColor?: string      // Color por defecto (#3b82f6)
}
```

## 🚀 Uso en NodeSelector

```typescript
import { SVGPlantMap } from './SVGPlantMap'

// Detectar si hay nodos PLC
const { hasPlcNodes, currentFundoid } = useMemo(() => {
  // Lógica de detección...
}, [filteredNodes])

// Renderizar componente apropiado
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

## 📝 Requisitos en Base de Datos

Para que funcione correctamente:

### Tabla `nodo`:
```sql
- nodoid          (INT PK)
- ubicacionid     (INT FK)
- latitud         (DECIMAL) -- 0-100 para PLC, GPS reales para LoRaWAN
- longitud        (DECIMAL) -- 0-100 para PLC, GPS reales para LoRaWAN
- referencia      (VARCHAR)
```

### Tabla `localizacion`:
```sql
- localizacionid  (INT PK)
- nodoid          (INT FK)
- sensorid        (INT FK)
- metricaid       (INT FK)
```

### Tabla `sensor`:
```sql
- sensorid        (INT PK)
- tipoid          (INT FK) -- [3, 4] para PLC; [1, 2] para LoRaWAN
```

## 🎯 Ubicaciones Soportadas

| ubicacionid | ubicacion     | fundoid | SVG File          |
|------------|---------------|---------|-------------------|
| 230        | Planta 01     | 3       | mapa_valerie.svg  |
| 231        | Planta 02     | 3       | mapa_valerie.svg  |
| 234        | Planta 02     | 8       | mapa_zoe_uvas.svg |

Para agregar nuevas plantas:

1. Guardar SVG en `/public/mapa_[nombre].svg`
2. Actualizar `FUNDO_SVG_MAP` en `SVGPlantMap.tsx`
3. Agregar `ubicacionid` a `SVG_UBICACIONES` en `NodeSelector.tsx`

## 🐛 Debugging

### SVG no carga
- Verificar que el archivo existe en `/public/`
- Revisar console para errores CORS
- Asegurarse que el `fundoid` está en `FUNDO_SVG_MAP`

### Marcadores no aparecen
- Verificar que `latitud` y `longitud` están en rango [0-100]
- Asegurarse que `ubicacionid` está en `SVG_UBICACIONES`
- Revisar que el SVG tiene dimensiones válidas (viewBox o width/height)

### Posiciones incorrectas
- Verificar cálculo de conversión: `x = (latitud/100) * svgWidth`
- Comprobar que las dimensiones del SVG se detectaron correctamente
- Usar Chrome DevTools para inspeccionar el overlay SVG

## 📦 Archivos Incluidos

- `SVGPlantMap.tsx` - Componente principal
- `NodeSelector.tsx` - Actualizado con lógica de detección
- Este archivo - Documentación

## 🔗 Referencias

- [Leaflet vs SVG Overlay Pattern](https://gis.stackexchange.com/questions/tagged/leaflet+svg)
- [SVG viewBox explicada](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)
- [React SVG Rendering](https://react.dev/reference/react-dom/components#svg-components)
