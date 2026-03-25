import React, { useState, useRef, useMemo, useEffect } from 'react'
import { NodeData } from '../../types/NodeData'
import { useLanguage } from '../../contexts/LanguageContext'

interface SVGPlantMapProps {
  nodes: NodeData[]
  selectedNode: NodeData | null
  onNodeSelect: (node: NodeData) => void
  loading?: boolean
  fundoid: number
  nodesWithAlerts?: number[]
  defaultNodeColor?: string
}

// Mapeo de fundoid a archivo SVG
const FUNDO_SVG_MAP: Record<number, string> = {
  3: '/mapa_valerie.svg',    // Valerie
  8: '/mapa_zoe_uvas.svg'    // Zoe
}

// Componente para renderizar marcadores SVG
const SVGMarker: React.FC<{
  x: number
  y: number
  isSelected: boolean
  hasAlert: boolean
  onClick: () => void
  node: NodeData
  defaultColor: string
}> = ({ x, y, isSelected, hasAlert, onClick, node, defaultColor }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const markerColor = hasAlert ? '#ef4444' : isSelected ? '#f59e0b' : defaultColor
  const borderColor = hasAlert ? '#dc2626' : isSelected ? '#f59e0b' : 'white'

  return (
    <g key={`marker-${x}-${y}`}>
      {/* Sombra */}
      <circle
        cx={x}
        cy={y}
        r={32}
        fill="rgba(0, 0, 0, 0.2)"
        style={{ filter: 'blur(2px)' }}
      />

      {/* Marcador principal */}
      <circle
        cx={x}
        cy={y}
        r={28}
        fill={markerColor}
        stroke={borderColor}
        strokeWidth="2"
        style={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />

      {/* Ícono en el marcador */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16"
        fill="white"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        📡
      </text>

      {/* Pulso de alerta */}
      {hasAlert && (
        <circle
          cx={x}
          cy={y}
          r={28}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          opacity="0.5"
          style={{
            animation: 'pulse-alert 2s infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip SVG removido - ahora se usa un popup HTML flotante */}
    </g>
  )
}

export const SVGPlantMap: React.FC<SVGPlantMapProps> = ({
  nodes,
  selectedNode,
  onNodeSelect,
  loading = false,
  fundoid,
  nodesWithAlerts = [],
  defaultNodeColor = '#3b82f6'
}) => {
  const { t } = useLanguage()
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number } | null>(null)
  const [svgLoading, setSvgLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>('')

  // Monitor selectedNode prop changes
  useEffect(() => {
    console.log('[SVGPlantMap] Props received - selectedNode:', selectedNode?.nodo, 'fundoid:', fundoid)
  }, [selectedNode])

  // Obtener la ruta del SVG según el fundoid
  const svgPath = FUNDO_SVG_MAP[fundoid]

  // Cargar el contenido del SVG
  useEffect(() => {
    if (!svgPath) {
      console.warn(`[SVGPlantMap] No se encontró SVG para fundoid: ${fundoid}`)
      setSvgLoading(false)
      return
    }

    const loadSvg = async () => {
      setSvgLoading(true)
      try {
        const response = await fetch(svgPath)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const svgText = await response.text()
        setSvgContent(svgText)

        // Extraer dimensiones del SVG
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
        const svg = svgDoc.documentElement

        const viewBox = svg.getAttribute('viewBox')
        const width = svg.getAttribute('width')
        const height = svg.getAttribute('height')

        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number)
          setSvgDimensions({ width: vbWidth, height: vbHeight })
        } else if (width && height) {
          setSvgDimensions({
            width: parseFloat(width),
            height: parseFloat(height),
          })
        }
      } catch (error) {
        console.error(`[SVGPlantMap] Error cargando SVG:`, error)
        setSvgLoading(false)
      } finally {
        setSvgLoading(false)
      }
    }

    loadSvg()
  }, [svgPath])

  // Handler para zoom con scroll
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(1, Math.min(5, scale * delta))
    
    setScale(newScale)
  }

  // Agregar event listener con { passive: false } para permitir preventDefault en wheel
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [scale])

  // Abrir popup cuando selectedNode cambia
  useEffect(() => {
    if (!selectedNode) {
      setScale(1)
      setPan({ x: 0, y: 0 })
    }
  }, [selectedNode])

  // Resetear zoom y pan cuando cambia el fundoid
  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [fundoid])

  // Handler para los botones de zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev * 1.2))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(1, prev / 1.2))
  }

  const handleZoomReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  // Handler para los botones de pan
  const panDistance = 50 // píxeles a mover por click

  const handlePanUp = () => {
    setPan(prev => ({ ...prev, y: prev.y + panDistance }))
  }

  const handlePanDown = () => {
    setPan(prev => ({ ...prev, y: prev.y - panDistance }))
  }

  const handlePanLeft = () => {
    setPan(prev => ({ ...prev, x: prev.x + panDistance }))
  }

  const handlePanRight = () => {
    setPan(prev => ({ ...prev, x: prev.x - panDistance }))
  }

  // Filtrar nodos de esta ubicación (PLC)
  const plcNodes = useMemo(() => {
    return nodes.filter(n => {
      // Verificar que el nodo pertenezca a esta ubicación/planta
      const hasValidCoordinates = 
        n.latitud != null && 
        n.longitud != null && 
        String(n.latitud).trim() !== '' && 
        String(n.longitud).trim() !== '' &&
        !isNaN(Number(n.latitud)) && 
        !isNaN(Number(n.longitud)) &&
        Number(n.latitud) > 0 &&
        Number(n.longitud) > 0
      
      return n.ubicacion?.fundoid === fundoid && hasValidCoordinates
    })
  }, [nodes, fundoid])

  if (loading) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-mono tracking-wider">Cargando planta...</div>
        </div>
      </div>
    )
  }

  // Mostrar spinner mientras se carga el SVG
  if (svgLoading) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-mono tracking-wider">Cargando mapa de la planta...</div>
        </div>
      </div>
    )
  }

  if (!svgDimensions || !svgContent) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4">🏭</div>
          <div className="text-lg font-medium mb-2 font-mono">Planta no disponible</div>
          <div className="text-sm font-mono">No se pudo cargar el mapa de la planta</div>
        </div>
      </div>
    )
  }

  if (plcNodes.length === 0) {
    return (
      <div className="bg-neutral-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4">📍</div>
          <div className="text-lg font-medium mb-2 font-mono">Sin sensores PLC</div>
          <div className="text-sm font-mono">No hay sensores PLC ubicados en esta planta</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="bg-gray-100 dark:bg-gray-400 rounded-lg p-0 relative w-full h-full overflow-hidden"
      style={{ height: '100%', width: '100%' }}
    >
      <style>{`
        @keyframes pulse-alert {
          0% {
            r: 12px;
            opacity: 0.7;
          }
          100% {
            r: 20px;
            opacity: 0;
          }
        }

        .svg-plant-map-container {
          width: 100%;
          height: 100%;
        }

        .svg-plant-map-container svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .svg-plant-map-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: all;
        }

        .svg-marker-group {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .svg-marker-group:hover circle {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
        }

        .zoom-controls {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .zoom-btn {
          background: rgba(31, 41, 55, 0.9);
          border: 1px solid rgba(107, 114, 128, 0.5);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .zoom-btn:hover {
          background: rgba(31, 41, 55, 1);
          border-color: rgba(107, 114, 128, 0.8);
          transform: scale(1.05);
        }

        .pan-controls {
          position: absolute;
          left: 12px;
          top: 12px;
          display: grid;
          grid-template-columns: 32px 32px 32px;
          grid-gap: 4px;
          z-index: 10;
          width: 100px;
        }

        .pan-up {
          grid-column: 2;
          grid-row: 1;
        }

        .pan-left {
          grid-column: 1;
          grid-row: 2;
        }

        .pan-right {
          grid-column: 3;
          grid-row: 2;
        }

        .pan-down {
          grid-column: 2;
          grid-row: 3;
        }

        .pan-btn {
          background: rgba(31, 41, 55, 0.9);
          border: 1px solid rgba(107, 114, 128, 0.5);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .pan-btn:hover {
          background: rgba(31, 41, 55, 1);
          border-color: rgba(107, 114, 128, 0.8);
          transform: scale(1.05);
        }

        .zoom-info {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(31, 41, 55, 0.8);
          color: rgba(209, 213, 219, 0.8);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-mono: monospace;
          pointer-events: none;
        }
      `}</style>

      <div
        className="svg-plant-map-container relative w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : 'grab',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* SVG de fondo de la planta */}
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* SVG overlay para los marcadores */}
        <svg
          ref={svgRef}
          className="svg-plant-map-overlay absolute inset-0"
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Defs para estilos y filtros */}
          <defs>
            <filter id="marker-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Renderizar marcadores */}
          {plcNodes.map((node) => {
            // Convertir latitud/longitud (0-100%) a coordenadas SVG
            const x = (node.latitud / 100) * svgDimensions.width
            const y = (node.longitud / 100) * svgDimensions.height

            const isSelected = selectedNode?.nodoid === node.nodoid
            const hasAlert = nodesWithAlerts.includes(node.nodoid)

            const handleMarkerClick = () => {
              onNodeSelect(node)
              // El popup se abrirá automáticamente via useEffect cuando selectedNode prop actualice
            }

            return (
              <g key={`marker-group-${node.nodoid}`} onClick={handleMarkerClick}>
                <SVGMarker
                  x={x}
                  y={y}
                  isSelected={isSelected}
                  hasAlert={hasAlert}
                  onClick={handleMarkerClick}
                  node={node}
                  defaultColor={defaultNodeColor}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Botones de pan */}
      {scale > 1 && (
        <div className="pan-controls">
          <button
            className="pan-btn pan-up"
            onClick={handlePanUp}
            title="Pan up"
          >
            ↑
          </button>
          <button
            className="pan-btn pan-left"
            onClick={handlePanLeft}
            title="Pan left"
          >
            ←
          </button>
          <button
            className="pan-btn pan-right"
            onClick={handlePanRight}
            title="Pan right"
          >
            →
          </button>
          <button
            className="pan-btn pan-down"
            onClick={handlePanDown}
            title="Pan down"
          >
            ↓
          </button>
        </div>
      )}

      {/* Botones de zoom */}
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={handleZoomIn}
          title="Zoom in (Scroll to zoom)"
        >
          +
        </button>
        <button
          className="zoom-btn"
          onClick={handleZoomOut}
          title="Zoom out (Scroll to zoom)"
        >
          −
        </button>
        <button
          className="zoom-btn"
          onClick={handleZoomReset}
          title="Reset zoom"
        >
          ↺
        </button>
      </div>

      {/* Info de zoom */}
      {scale > 1 && (
        <div className="zoom-info">
          Zoom: {(scale * 100).toFixed(0)}%
        </div>
      )}

      {/* Popup renderizado con Portal fuera del árbol del componente */}
      {/* REMOVIDO - Funcionalidad de popup deshabilitada */}

      {/* Info bar inferior */}
      {selectedNode && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 text-sm font-mono">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold">{selectedNode.nodo}</span>
              {selectedNode.localizacion && <span> - {selectedNode.localizacion}</span>}
            </div>
            <div className="text-xs text-neutral-400">
              Pos: {selectedNode.latitud?.toFixed(1)}%, {selectedNode.longitud?.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
