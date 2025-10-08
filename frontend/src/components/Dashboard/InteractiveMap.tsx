import React, { useEffect, useState } from 'react'
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

// Componente para centrar el mapa en el nodo seleccionado
function MapController({ selectedNode }: { selectedNode: NodeData | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedNode) {
      map.setView([selectedNode.latitud, selectedNode.longitud], 16)
    }
  }, [selectedNode, map])

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

  // Calcular centro del mapa basado en los nodos disponibles
  useEffect(() => {
    if (nodes.length > 0) {
      const avgLat = nodes.reduce((sum, node) => sum + node.latitud, 0) / nodes.length
      const avgLng = nodes.reduce((sum, node) => sum + node.longitud, 0) / nodes.length
      setMapCenter([avgLat, avgLng])
    }
  }, [nodes])

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
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedNode={selectedNode} />
        
        {nodes.map((node) => (
          <Marker
            key={node.nodoid}
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
