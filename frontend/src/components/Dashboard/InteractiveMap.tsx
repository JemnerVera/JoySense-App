import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NodeData } from '../../types/NodeData'
import { useLanguage } from '../../contexts/LanguageContext'

// Importar iconos de Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix para iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface InteractiveMapProps {
  nodes: NodeData[]
  selectedNode: NodeData | null
  onNodeSelect: (node: NodeData) => void
  loading?: boolean
  nodeMediciones?: { [nodeId: number]: number } // Mapa de nodoId -> cantidad de mediciones
}

// Componente para centrar el mapa en el nodo seleccionado con animación en dos pasos
function MapController({ selectedNode, onAnimationComplete }: { selectedNode: NodeData | null, onAnimationComplete?: () => void }) {
  const map = useMap()
  const previousNodeId = useRef<number | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Limpiar cualquier animación en curso
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    // Si no hay nodo seleccionado, resetear el ref para que la próxima selección sea tratada como primera carga
    if (!selectedNode) {
      previousNodeId.current = null
      return
    }

    if (selectedNode.latitud != null && selectedNode.longitud != null) {
      const lat = selectedNode.latitud
      const lng = selectedNode.longitud
      
      // Validar coordenadas
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const currentNodeId = selectedNode.nodoid
        
        // Si cambió el nodo (no es la primera carga)
        if (previousNodeId.current !== null && previousNodeId.current !== currentNodeId) {
          // Obtener posición actual del mapa
          const currentCenter = map.getCenter()
          const currentZoom = map.getZoom()
          
          // Solo hacer animación de 3 pasos si el zoom actual es alto (más cercano)
          // Si el zoom ya está alejado, solo centrar y acercar
          if (currentZoom > 12) {
            // Paso 1: Alejar el zoom en la posición actual (zoom 10)
            map.flyTo([currentCenter.lat, currentCenter.lng], 10, {
              duration: 1.0,
              easeLinearity: 0.3
            })
            
            // Paso 2: Volar al nuevo nodo manteniendo el zoom alejado (después del paso 1)
            const timeout1 = setTimeout(() => {
              map.flyTo([lat, lng], 10, {
                duration: 1.2,
                easeLinearity: 0.3
              })
              
              // Paso 3: Acercar el zoom al nuevo nodo (después del paso 2)
              const timeout2 = setTimeout(() => {
                map.flyTo([lat, lng], 14, {
                  duration: 1.0,
                  easeLinearity: 0.3
                })
                
                // Esperar a que termine completamente la animación y luego abrir el popup
                animationTimeoutRef.current = setTimeout(() => {
                  if (onAnimationComplete) {
                    onAnimationComplete()
                  }
                  animationTimeoutRef.current = null
                }, 1100) // 1000ms de duración + 100ms de margen
              }, 1300) // 1200ms de duración + 100ms de margen
              
              animationTimeoutRef.current = timeout2 as any
            }, 1100) // 1000ms de duración + 100ms de margen
            
            animationTimeoutRef.current = timeout1 as any
          } else {
            // Zoom ya está alejado: solo centrar y acercar (2 pasos)
            map.flyTo([lat, lng], 10, {
              duration: 0.8,
              easeLinearity: 0.3
            })
            
            const timeout1 = setTimeout(() => {
              map.flyTo([lat, lng], 14, {
                duration: 1.0,
                easeLinearity: 0.3
              })
              
              animationTimeoutRef.current = setTimeout(() => {
                if (onAnimationComplete) {
                  onAnimationComplete()
                }
                animationTimeoutRef.current = null
              }, 1100)
            }, 900)
            
            animationTimeoutRef.current = timeout1 as any
          }
        } else {
          // Primera carga o mismo nodo: ir directamente
          map.flyTo([lat, lng], 14, {
            duration: 1.2,
            easeLinearity: 0.3
          })
          
          animationTimeoutRef.current = setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete()
            }
            animationTimeoutRef.current = null
          }, 1300)
        }
        
        // Actualizar el ref del nodo anterior
        previousNodeId.current = currentNodeId
      }
    }

    // Cleanup: limpiar timeout al desmontar o cambiar de nodo
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
  }, [selectedNode?.nodoid, selectedNode?.latitud, selectedNode?.longitud, map, onAnimationComplete]) // Usar nodoid específicamente para detectar cambios

  return null
}

// Icono personalizado para nodos
const createNodeIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-node-icon',
    html: `
      <div class="node-marker ${isSelected ? 'selected' : ''}">
        <div class="node-icon">
          📡
        </div>
        <div class="node-pulse"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  nodes,
  selectedNode,
  onNodeSelect,
  loading = false,
  nodeMediciones = {}
}) => {
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-13.745915, -76.122351]) // Centro por defecto en Perú
  const markerRefs = useRef<Map<number, L.Marker>>(new Map())

  const nodesWithGPS = nodes.filter(n => n.latitud != null && n.longitud != null && !isNaN(n.latitud) && !isNaN(n.longitud))

  // Función para abrir el popup del nodo seleccionado
  const openSelectedNodePopup = () => {
    if (selectedNode) {
      const marker = markerRefs.current.get(selectedNode.nodoid)
      if (marker) {
        marker.openPopup()
      }
    }
  }

  // Calcular centro del mapa basado en el nodo seleccionado o en los nodos disponibles
  useEffect(() => {
    // Si hay un nodo seleccionado con coordenadas válidas, usar ese como centro
    if (selectedNode && selectedNode.latitud != null && selectedNode.longitud != null) {
      const lat = selectedNode.latitud
      const lng = selectedNode.longitud
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setMapCenter([lat, lng])
        return
      }
    }
    
    // Si no hay nodo seleccionado, calcular centro basado en todos los nodos disponibles
    if (nodes.length > 0) {
      const nodesWithValidCoords = nodes.filter(n => 
        n.latitud != null && n.longitud != null && 
        !isNaN(n.latitud) && !isNaN(n.longitud) && 
        n.latitud !== 0 && n.longitud !== 0
      )
      if (nodesWithValidCoords.length > 0) {
        const avgLat = nodesWithValidCoords.reduce((sum, node) => sum + node.latitud, 0) / nodesWithValidCoords.length
        const avgLng = nodesWithValidCoords.reduce((sum, node) => sum + node.longitud, 0) / nodesWithValidCoords.length
        setMapCenter([avgLat, avgLng])
      }
    }
  }, [selectedNode?.nodoid, nodes])

  if (loading) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-96 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-lg font-mono tracking-wider">Cargando mapa...</div>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-96 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg font-medium mb-2">No hay nodos disponibles</div>
          <div className="text-sm">No se encontraron nodos con coordenadas GPS</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 h-96 relative">
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-node-icon {
            background: transparent !important;
            border: none !important;
          }
          
          .node-marker {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            background: #10b981;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .node-marker:hover {
            transform: scale(1.2);
            background: #059669;
          }
          
          .node-marker.selected {
            background: #f59e0b;
            border-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);
          }
          
          .node-icon {
            font-size: 14px;
            color: white;
            z-index: 2;
          }
          
          .node-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: inherit;
            animation: pulse 2s infinite;
          }
          
          .node-marker.selected .node-pulse {
            background: #f59e0b;
          }
          
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
          
          .leaflet-popup-content-wrapper {
            background: #f3f4f6;
            color: #1f2937;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .dark .leaflet-popup-content-wrapper {
            background: #1f2937;
            color: white;
          }
          
          .leaflet-popup-content {
            margin: 12px;
            font-family: 'Courier New', monospace;
          }
          
          .leaflet-popup-tip {
            background: #f3f4f6;
          }
          
          .dark .leaflet-popup-tip {
            background: #1f2937;
          }
        `
      }} />
      
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedNode={selectedNode} onAnimationComplete={openSelectedNodePopup} />
        
        {nodes
          .filter(node => {
            const hasValidCoords = node.latitud != null && node.longitud != null && !isNaN(node.latitud) && !isNaN(node.longitud)
            return hasValidCoords
          })
          .map((node) => (
            <Marker
              key={node.nodoid}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current.set(node.nodoid, ref)
                } else {
                  markerRefs.current.delete(node.nodoid)
                }
              }}
              position={[node.latitud, node.longitud]}
              icon={createNodeIcon(selectedNode?.nodoid === node.nodoid)}
              eventHandlers={{
                click: () => onNodeSelect(node)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-green-400 mb-2">{node.nodo}</div>
                  <div className="space-y-1">
                    <div><strong>{t('dashboard.tooltip.deveui')}</strong> {node.deveui}</div>
                    <div><strong>{t('dashboard.tooltip.location')}</strong> {node.ubicacion.ubicacion}</div>
                    <div><strong>{t('dashboard.tooltip.fund')}</strong> {node.ubicacion.fundo.fundo}</div>
                    <div><strong>{t('dashboard.tooltip.company')}</strong> {node.ubicacion.fundo.empresa.empresa}</div>
                    <div><strong>{t('dashboard.tooltip.country')}</strong> {node.ubicacion.fundo.empresa.pais.pais}</div>
                    <div><strong>{t('dashboard.tooltip.entity')}</strong> {node.entidad.entidad}</div>
                    <div className="mt-2 pt-2 border-t border-neutral-600">
                      <div><strong>{t('dashboard.tooltip.coordinates')}</strong></div>
                      <div className="text-xs text-neutral-400">
                        {node.latitud}, {node.longitud}
                      </div>
                    </div>
                    {/* Indicador de datos */}
                    {nodeMediciones[node.nodoid] === 0 && (
                      <div className="mt-2 pt-2 border-t border-red-600">
                        <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded font-mono">
                          Sin data
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
