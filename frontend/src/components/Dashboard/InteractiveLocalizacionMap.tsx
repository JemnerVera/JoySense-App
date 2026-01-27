import React, { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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

interface InteractiveLocalizacionMapProps {
  localizaciones: any[]
  selectedLocalizacion: any | null
  onLocalizacionSelect: (localizacion: any) => void
  loading?: boolean
}

// Componente para centrar el mapa en la localización seleccionada
function MapController({ 
  selectedLocalizacion, 
  onAnimationComplete 
}: { 
  selectedLocalizacion: any | null
  onAnimationComplete?: () => void 
}) {
  const map = useMap()
  const previousLocalizacionId = useRef<number | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Limpiar cualquier animación en curso
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    // Si no hay localización seleccionada, resetear el ref
    if (!selectedLocalizacion) {
      previousLocalizacionId.current = null
      return
    }

    // Obtener coordenadas desde múltiples fuentes (localización o nodo asociado)
    const lat = typeof selectedLocalizacion.latitud === 'string' 
      ? parseFloat(selectedLocalizacion.latitud)
      : (typeof selectedLocalizacion.nodo?.latitud === 'string'
        ? parseFloat(selectedLocalizacion.nodo.latitud)
        : (selectedLocalizacion.nodo?.latitud || selectedLocalizacion.latitud));
    
    const lng = typeof selectedLocalizacion.longitud === 'string' 
      ? parseFloat(selectedLocalizacion.longitud)
      : (typeof selectedLocalizacion.nodo?.longitud === 'string'
        ? parseFloat(selectedLocalizacion.nodo.longitud)
        : (selectedLocalizacion.nodo?.longitud || selectedLocalizacion.longitud));
      
    // Validar coordenadas
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      const currentLocalizacionId = selectedLocalizacion.localizacionid
      
      // Si cambió la localización
      if (previousLocalizacionId.current !== null && previousLocalizacionId.current !== currentLocalizacionId) {
        // Obtener posición actual del mapa
        const currentCenter = map.getCenter()
        const currentZoom = map.getZoom()
        
        // Animación de zoom
        if (currentZoom > 12) {
          // Paso 1: Alejar el zoom
          map.flyTo([currentCenter.lat, currentCenter.lng], 10, {
            duration: 1.0,
            easeLinearity: 0.3
          })
          
          // Paso 2: Volar a la nueva localización
          const timeout1 = setTimeout(() => {
            map.flyTo([lat, lng], 10, {
              duration: 1.2,
              easeLinearity: 0.3
            })
            
            // Paso 3: Acercar el zoom
            const timeout2 = setTimeout(() => {
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
            }, 1300)
            
            animationTimeoutRef.current = timeout2 as any
          }, 1100)
          
          animationTimeoutRef.current = timeout1 as any
        } else {
          // Zoom alejado: 2 pasos
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
        // Primera carga o misma localización
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
      
      // Actualizar el ref de la localización anterior
      previousLocalizacionId.current = currentLocalizacionId
    }

    // Cleanup
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
  }, [selectedLocalizacion?.localizacionid, selectedLocalizacion?.latitud, selectedLocalizacion?.longitud, map, onAnimationComplete])

  return null
}

// Icono personalizado para localizaciones
const createLocalizacionIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-localizacion-icon',
    html: `
      <div class="localizacion-marker ${isSelected ? 'selected' : ''}" style="">
        <div class="localizacion-icon">
          📍
        </div>
        <div class="localizacion-pulse"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

export const InteractiveLocalizacionMap: React.FC<InteractiveLocalizacionMapProps> = ({
  localizaciones,
  selectedLocalizacion,
  onLocalizacionSelect,
  loading = false
}) => {
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-13.745915, -76.122351])
  const markerRefs = useRef<Map<number, L.Marker>>(new Map())

  // Filtrar localizaciones con GPS válido
  // Las coordenadas pueden venir del nodo asociado a la localización
  const localizacionesWithGPS = useMemo(() => {
    return localizaciones.filter(loc => {
      // Intentar obtener lat/lng desde diferentes fuentes
      const lat = typeof loc.latitud === 'string' 
        ? parseFloat(loc.latitud) 
        : (typeof loc.nodo?.latitud === 'string' 
          ? parseFloat(loc.nodo.latitud)
          : (loc.nodo?.latitud || loc.latitud));
      
      const lng = typeof loc.longitud === 'string' 
        ? parseFloat(loc.longitud) 
        : (typeof loc.nodo?.longitud === 'string'
          ? parseFloat(loc.nodo.longitud)
          : (loc.nodo?.longitud || loc.longitud));
      
      const isValid = lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      return isValid;
    });
  }, [localizaciones])

  // Función para abrir el popup de la localización seleccionada
  const openSelectedLocalizacionPopup = () => {
    if (selectedLocalizacion) {
      const marker = markerRefs.current.get(selectedLocalizacion.localizacionid)
      if (marker) {
        marker.openPopup()
      }
    }
  }

  // Cerrar popup cuando se deselecciona la localización
  useEffect(() => {
    if (!selectedLocalizacion) {
      markerRefs.current.forEach((marker) => {
        marker.closePopup()
      })
    }
  }, [selectedLocalizacion])

  // Calcular centro del mapa
  const previousCenterRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    // Si hay una localización seleccionada con coordenadas válidas, usar ese como centro
    if (selectedLocalizacion) {
      const lat = typeof selectedLocalizacion.latitud === 'string' 
        ? parseFloat(selectedLocalizacion.latitud)
        : (typeof selectedLocalizacion.nodo?.latitud === 'string'
          ? parseFloat(selectedLocalizacion.nodo.latitud)
          : (selectedLocalizacion.nodo?.latitud || selectedLocalizacion.latitud));
      
      const lng = typeof selectedLocalizacion.longitud === 'string' 
        ? parseFloat(selectedLocalizacion.longitud)
        : (typeof selectedLocalizacion.nodo?.longitud === 'string'
          ? parseFloat(selectedLocalizacion.nodo.longitud)
          : (selectedLocalizacion.nodo?.longitud || selectedLocalizacion.longitud));
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const newCenter: [number, number] = [lat, lng];
        const prev = previousCenterRef.current;
        if (!prev || prev[0] !== newCenter[0] || prev[1] !== newCenter[1]) {
          setMapCenter(newCenter);
          previousCenterRef.current = newCenter;
        }
        return;
      }
    }
    
    // Si no hay seleccionada, calcular centro basado en todas las localizaciones con GPS
    if (localizacionesWithGPS.length > 0) {
      const coords = localizacionesWithGPS.map(loc => {
        const lat = typeof loc.latitud === 'string' 
          ? parseFloat(loc.latitud) 
          : (typeof loc.nodo?.latitud === 'string'
            ? parseFloat(loc.nodo.latitud)
            : (loc.nodo?.latitud || loc.latitud || 0));
        
        const lng = typeof loc.longitud === 'string' 
          ? parseFloat(loc.longitud) 
          : (typeof loc.nodo?.longitud === 'string'
            ? parseFloat(loc.nodo.longitud)
            : (loc.nodo?.longitud || loc.longitud || 0));
        
        return { lat, lng };
      }).filter(c => !isNaN(c.lat) && !isNaN(c.lng) && c.lat !== 0 && c.lng !== 0);
      
      if (coords.length > 0) {
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
        const newCenter: [number, number] = [avgLat, avgLng];
        const prev = previousCenterRef.current;
        if (!prev || prev[0] !== newCenter[0] || prev[1] !== newCenter[1]) {
          setMapCenter(newCenter);
          previousCenterRef.current = newCenter;
        }
      }
    }
  }, [selectedLocalizacion?.localizacionid, localizacionesWithGPS.length])

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

  if (localizacionesWithGPS.length === 0) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center" style={{ height: '100%' }}>
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg font-medium mb-2">No hay localizaciones disponibles</div>
          <div className="text-sm">No se encontraron localizaciones con coordenadas GPS</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-0 relative" style={{ height: '100%', width: '100%', minHeight: '500px' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-localizacion-icon {
            background: transparent !important;
            border: none !important;
          }
          
          .localizacion-marker {
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
          
          .localizacion-marker:hover {
            transform: scale(1.2);
            background: #2563eb;
          }
          
          .localizacion-marker.selected {
            background: #f59e0b;
            border-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);
          }
          
          .localizacion-icon {
            font-size: 14px;
            color: white;
            z-index: 2;
          }
          
          .localizacion-pulse {
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
          
          .localizacion-marker.selected .localizacion-pulse {
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
        
        <MapController 
          selectedLocalizacion={selectedLocalizacion} 
          onAnimationComplete={openSelectedLocalizacionPopup} 
        />
        
        {localizacionesWithGPS.map((localizacion) => {
          const lat = typeof localizacion.latitud === 'string' 
            ? parseFloat(localizacion.latitud)
            : (typeof localizacion.nodo?.latitud === 'string'
              ? parseFloat(localizacion.nodo.latitud)
              : (localizacion.nodo?.latitud || localizacion.latitud || 0));
          
          const lng = typeof localizacion.longitud === 'string' 
            ? parseFloat(localizacion.longitud)
            : (typeof localizacion.nodo?.longitud === 'string'
              ? parseFloat(localizacion.nodo.longitud)
              : (localizacion.nodo?.longitud || localizacion.longitud || 0));
          return (
            <Marker
              key={localizacion.localizacionid}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current.set(localizacion.localizacionid, ref)
                } else {
                  markerRefs.current.delete(localizacion.localizacionid)
                }
              }}
              position={[lat, lng]}
              icon={createLocalizacionIcon(selectedLocalizacion?.localizacionid === localizacion.localizacionid)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  try {
                    onLocalizacionSelect(localizacion);
                  } catch (error) {
                    console.error('InteractiveLocalizacionMap: Error al llamar onLocalizacionSelect:', error);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-blue-400 mb-2">{localizacion.localizacion}</div>
                  <div className="space-y-1">
                    <div><strong>Nodo:</strong> {localizacion.nodo?.nodo || 'N/A'}</div>
                    <div><strong>Ubicación:</strong> {localizacion.nodo?.ubicacion?.ubicacion || 'N/A'}</div>
                    <div className="mt-2 pt-2 border-t border-neutral-600">
                      <div><strong>Coordenadas:</strong></div>
                      <div className="text-xs text-neutral-400">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </div>
                    </div>
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
