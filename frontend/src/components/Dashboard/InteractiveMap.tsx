import React, { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NodeData } from '../../types/NodeData'
import { useLanguage } from '../../contexts/LanguageContext'
import { JoySenseService } from '../../services/backend-api'

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
  nodesWithAlerts?: number[] // Array de nodoIds que tienen alertas activas
}

// Componente para centrar el mapa en el nodo seleccionado con animación en dos pasos
function MapController({ selectedNode, onAnimationComplete }: { selectedNode: NodeData | null, onAnimationComplete?: () => void }) {
  const map = useMap()
  const previousNodeId = useRef<number | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('🎮 MapController: useEffect disparado', {
      selectedNodeId: selectedNode?.nodoid,
      selectedNodeName: selectedNode?.nodo,
      previousNodeId: previousNodeId.current
    });
    
    // Limpiar cualquier animación en curso
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    // Si no hay nodo seleccionado, resetear el ref para que la próxima selección sea tratada como primera carga
    if (!selectedNode) {
      console.log('🎮 MapController: No hay selectedNode, reseteando previousNodeId');
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
          console.log('🎮 MapController: Cambio de nodo detectado', {
            anterior: previousNodeId.current,
            actual: currentNodeId,
            tipo: 'cambio_nodo'
          });
          
          // Obtener posición actual del mapa
          const currentCenter = map.getCenter()
          const currentZoom = map.getZoom()
          
          console.log('🎮 MapController: Estado actual del mapa', {
            centro: `${currentCenter.lat}, ${currentCenter.lng}`,
            zoom: currentZoom
          });
          
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
                 }, 1400) // 1200ms de duración + 200ms de margen adicional
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
               }, 1200) // 1000ms + 200ms extra
            }, 900)
            
            animationTimeoutRef.current = timeout1 as any
          }
        } else {
          // Primera carga o mismo nodo: ir directamente
          console.log('🎮 MapController: Primera carga o mismo nodo', {
            currentNodeId,
            tipo: previousNodeId.current === null ? 'primera_carga' : 'mismo_nodo'
          });
          
          map.flyTo([lat, lng], 14, {
            duration: 1.2,
            easeLinearity: 0.3
          })
          
          animationTimeoutRef.current = setTimeout(() => {
            console.log('🎮 MapController: Animación completada, llamando a onAnimationComplete');
            if (onAnimationComplete) {
              onAnimationComplete()
            }
            animationTimeoutRef.current = null
          }, 1500) // Aumentado para dar más tiempo a que los markers se rendericen
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
const createNodeIcon = (isSelected: boolean, hasAlert: boolean = false) => {
  const alertClass = hasAlert ? 'alert' : '';
  const alertColor = hasAlert ? 'background-color: #ef4444;' : '';
  return L.divIcon({
    className: 'custom-node-icon',
    html: `
      <div class="node-marker ${isSelected ? 'selected' : ''} ${alertClass}" style="${alertColor}">
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
  nodeMediciones = {},
  nodesWithAlerts = []
}) => {
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-13.745915, -76.122351]) // Centro por defecto en Perú
  const markerRefs = useRef<Map<number, L.Marker>>(new Map())

  // Usar useMemo para evitar recalcular en cada render
  const nodesWithGPS = useMemo(() => {
    const filtered = nodes.filter(n => {
      const lat = typeof n.latitud === 'string' ? parseFloat(n.latitud) : n.latitud;
      const lng = typeof n.longitud === 'string' ? parseFloat(n.longitud) : n.longitud;
      const isValid = lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      return isValid;
    });
    
    console.log('📍 InteractiveMap: nodesWithGPS actualizado', {
      totalNodesRecibidos: nodes.length,
      nodesConGPS: filtered.length,
      nodos: filtered.map(n => ({ id: n.nodoid, nombre: n.nodo, ubicacion: n.ubicacion?.ubicacion })),
      selectedNodeId: selectedNode?.nodoid
    });
    
    return filtered;
  }, [nodes, selectedNode?.nodoid])
  
  // Función para abrir el popup del nodo seleccionado con retry para asegurar que el marker exista
  const openSelectedNodePopup = (retryCount = 0) => {
    console.log('🔔 InteractiveMap: openSelectedNodePopup llamado', {
      selectedNodeId: selectedNode?.nodoid,
      selectedNodeName: selectedNode?.nodo,
      totalMarkers: markerRefs.current.size,
      retryCount
    });
    
    if (selectedNode) {
      const marker = markerRefs.current.get(selectedNode.nodoid)
      console.log('🎯 InteractiveMap: Buscando marker para popup', {
        nodoid: selectedNode.nodoid,
        markerEncontrado: !!marker,
        availableMarkers: Array.from(markerRefs.current.keys())
      });
      
      if (marker) {
        console.log('✅ InteractiveMap: Abriendo popup para nodo', selectedNode.nodoid);
        marker.openPopup()
      } else if (retryCount < 5) {
        // Reintentar después de un pequeño delay si el marker aún no existe
        console.log('⏰ InteractiveMap: Reintentando abrir popup en 100ms', {
          retryCount: retryCount + 1
        });
        setTimeout(() => openSelectedNodePopup(retryCount + 1), 100)
      } else {
        console.log('❌ InteractiveMap: No se encontró marker después de reintentos', selectedNode.nodoid);
      }
    } else {
      console.log('⚠️ InteractiveMap: No hay selectedNode para abrir popup');
    }
  }

  // Función para cerrar el popup del nodo seleccionado
  const closeSelectedNodePopup = () => {
    if (selectedNode) {
      const marker = markerRefs.current.get(selectedNode.nodoid)
      if (marker) {
        marker.closePopup()
      }
    }
  }

  // Cerrar popup cuando se deselecciona el nodo
  useEffect(() => {
    if (!selectedNode) {
      // Cerrar todos los popups cuando no hay nodo seleccionado
      markerRefs.current.forEach((marker) => {
        marker.closePopup()
      })
    }
  }, [selectedNode])

  // Abrir popup automáticamente cuando filteredNodes se reduce a 1 (nodo seleccionado)
  useEffect(() => {
    console.log('🎯 InteractiveMap: Verificando auto-apertura de popup', {
      totalFilteredNodes: nodesWithGPS.length,
      selectedNodeId: selectedNode?.nodoid,
      totalMarkers: markerRefs.current.size
    });
    
    if (nodesWithGPS.length === 1 && selectedNode) {
      // Esperar un ciclo de render para asegurar que los markers estén listos
      setTimeout(() => {
        openSelectedNodePopup();
      }, 50);
    }
  }, [nodesWithGPS.length, selectedNode?.nodoid])

  // Calcular centro del mapa basado en el nodo seleccionado o en los nodos disponibles
  const previousCenterRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    // Si hay un nodo seleccionado con coordenadas válidas, usar ese como centro
    if (selectedNode && selectedNode.latitud != null && selectedNode.longitud != null) {
      const lat = typeof selectedNode.latitud === 'string' ? parseFloat(selectedNode.latitud) : selectedNode.latitud;
      const lng = typeof selectedNode.longitud === 'string' ? parseFloat(selectedNode.longitud) : selectedNode.longitud;
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const newCenter: [number, number] = [lat, lng];
        // Solo actualizar si el centro realmente cambió
        const prev = previousCenterRef.current;
        if (!prev || prev[0] !== newCenter[0] || prev[1] !== newCenter[1]) {
          setMapCenter(newCenter);
          previousCenterRef.current = newCenter;
        }
        return;
      }
    }
    
    // Si no hay nodo seleccionado, calcular centro basado en todos los nodos disponibles
    if (nodesWithGPS.length > 0) {
      const coords = nodesWithGPS.map(n => {
        const lat = typeof n.latitud === 'string' ? parseFloat(n.latitud) : (n.latitud || 0);
        const lng = typeof n.longitud === 'string' ? parseFloat(n.longitud) : (n.longitud || 0);
        return { lat, lng };
      }).filter(c => !isNaN(c.lat) && !isNaN(c.lng) && c.lat !== 0 && c.lng !== 0);
      
      if (coords.length > 0) {
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
        const newCenter: [number, number] = [avgLat, avgLng];
        // Solo actualizar si el centro realmente cambió
        const prev = previousCenterRef.current;
        if (!prev || prev[0] !== newCenter[0] || prev[1] !== newCenter[1]) {
          setMapCenter(newCenter);
          previousCenterRef.current = newCenter;
        }
      }
    }
  }, [selectedNode?.nodoid, nodesWithGPS.length])

  if (loading) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center" style={{ height: '100%' }}>
        <div className="text-center text-neutral-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-mono tracking-wider">Cargando mapa...</div>
        </div>
      </div>
    )
  }

  if (nodesWithGPS.length === 0) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center" style={{ height: '100%' }}>
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg font-medium mb-2">No hay nodos disponibles</div>
          <div className="text-sm">No se encontraron nodos con coordenadas GPS</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-0 relative" style={{ height: '100%', width: '100%', minHeight: '500px' }}>
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
            background: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .node-marker:hover {
            transform: scale(1.2);
            background: #2563eb;
          }
          
          .node-marker.selected {
            background: #f59e0b;
            border-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);
          }
          
          .node-marker.alert {
            background: #ef4444 !important;
            border-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
          }
          
          .node-marker.alert:hover {
            background: #dc2626 !important;
            transform: scale(1.2);
          }
          
          .node-marker.alert.selected {
            background: #ef4444 !important;
            border-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.5);
          }
          
          .node-marker.alert .node-pulse {
            background: #ef4444;
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
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        <MapController selectedNode={selectedNode} onAnimationComplete={openSelectedNodePopup} />
        
        {nodesWithGPS.map((node) => {
          const lat = typeof node.latitud === 'string' ? parseFloat(node.latitud) : (node.latitud || 0);
          const lng = typeof node.longitud === 'string' ? parseFloat(node.longitud) : (node.longitud || 0);
          
          console.log('🎨 InteractiveMap: Renderizando marker', {
            nodoid: node.nodoid,
            isSelected: selectedNode?.nodoid === node.nodoid,
            hasAlert: nodesWithAlerts.includes(node.nodoid)
          });
          
          return (
          <Marker
            key={node.nodoid}
            ref={(ref) => {
              if (ref) {
                markerRefs.current.set(node.nodoid, ref)
              } else {
                markerRefs.current.delete(node.nodoid)
              }
            }}
            position={[lat, lng]}
            icon={createNodeIcon(selectedNode?.nodoid === node.nodoid, nodesWithAlerts.includes(node.nodoid))}
            eventHandlers={{
              click: (e: any) => {
                e.originalEvent.stopPropagation();
                console.log('🗺️ InteractiveMap: Click en nodo', {
                  nodoid: node.nodoid,
                  nodo: node.nodo,
                  localizacion: node.localizacion,
                  coordenadas: `${node.latitud}, ${node.longitud}`
                });
                try {
                  onNodeSelect(node);
                  console.log('✅ InteractiveMap: onNodeSelect ejecutado correctamente');
                } catch (error) {
                  console.error('❌ InteractiveMap: Error al llamar onNodeSelect:', error);
                }
              }
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="space-y-1">
                  {node.localizacion ? (
                    <div className="font-bold"><strong>{t('dashboard.tooltip.localizacion')}</strong> {node.localizacion}</div>
                  ) : null}
                  <div><strong>{t('dashboard.tooltip.location')}</strong> {node.ubicacion.ubicacion}</div>
                  <div><strong>{t('dashboard.tooltip.fund')}</strong> {node.ubicacion.fundo.fundo}</div>
                  <div><strong>{t('dashboard.tooltip.company')}</strong> {node.ubicacion.fundo.empresa.empresa}</div>
                  <div><strong>{t('dashboard.tooltip.country')}</strong> {node.ubicacion.fundo.empresa.pais.pais}</div>
                  <div className="mt-2 pt-2 border-t border-neutral-600">
                    <div><strong>{t('dashboard.tooltip.coordinates')}</strong></div>
                    <div className="text-xs text-neutral-400">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
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
          );
        })}
      </MapContainer>
    </div>
  )
}
