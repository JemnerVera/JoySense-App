import React, { useState, useEffect, useRef } from 'react'
import { JoySenseService } from '../../services/backend-api'

interface NodeSelectorProps {
  selectedEntidadId: number | null
  selectedUbicacionId: number | null
  onNodeSelect: (nodeData: any) => void
  onFiltersUpdate: (filters: { entidadId: number; ubicacionId: number }) => void
}

interface NodeData {
  nodoid: number
  nodo: string
  deveui: string
  ubicacionid: number
  latitud: number
  longitud: number
  referencia: string
  ubicacion: {
    ubicacion: string
    ubicacionabrev: string
    fundo: {
      fundo: string
      fundoabrev: string
      empresa: {
        empresa: string
        empresabrev: string
        pais: {
          pais: string
          paisabrev: string
        }
      }
    }
  }
  entidad: {
    entidadid: number
    entidad: string
  }
}

export const NodeSelector: React.FC<NodeSelectorProps> = ({
  selectedEntidadId,
  selectedUbicacionId,
  onNodeSelect,
  onFiltersUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'dropdown' | 'map'>('dropdown')
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [filteredNodes, setFilteredNodes] = useState<NodeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar nodos con localizaciones
  useEffect(() => {
    loadNodes()
  }, [])

  // Filtrar nodos por ubicación actual
  useEffect(() => {
    if (selectedUbicacionId && nodes.length > 0) {
      const filtered = nodes.filter(node => node.ubicacionid === selectedUbicacionId)
      setFilteredNodes(filtered)
    } else {
      setFilteredNodes(nodes)
    }
  }, [selectedUbicacionId, nodes])

  const loadNodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await JoySenseService.getNodosConLocalizacion()
      setNodes(data)
      console.log('🔍 NodeSelector: Nodos cargados:', data.length)
    } catch (err) {
      setError('Error al cargar nodos')
      console.error('Error loading nodes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNodeSelect = (node: NodeData) => {
    setSelectedNode(node)
    onNodeSelect(node)
    setIsDropdownOpen(false)
  }

  const handleMapNodeClick = (node: NodeData) => {
    setSelectedNode(node)
    onNodeSelect(node)
    
    // Actualizar filtros globales si el nodo está en una ubicación diferente
    if (node.ubicacionid !== selectedUbicacionId) {
      onFiltersUpdate({
        entidadId: node.entidad.entidadid,
        ubicacionId: node.ubicacionid
      })
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-neutral-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-orange-500 font-mono tracking-wider">CONSOLA DE SELECCIÓN DE NODO</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('dropdown')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors font-mono tracking-wider ${
              activeTab === 'dropdown'
                ? 'bg-orange-500 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors font-mono tracking-wider ${
              activeTab === 'map'
                ? 'bg-orange-500 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            Mapa
          </button>
        </div>
      </div>

      {activeTab === 'dropdown' && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500 hover:bg-neutral-600 transition-colors font-mono"
          >
            {selectedNode ? (
              <div>
                <div className="font-medium">{selectedNode.nodo}</div>
                <div className="text-sm text-neutral-400">
                  {selectedNode.ubicacion.ubicacion} - {selectedNode.ubicacion.fundo.fundo}
                </div>
              </div>
            ) : (
              <span className="text-neutral-400">Seleccionar nodo...</span>
            )}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              {loading ? (
                <div className="px-4 py-3 text-center text-neutral-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="px-4 py-3 text-red-400">{error}</div>
              ) : filteredNodes.length === 0 ? (
                <div className="px-4 py-3 text-neutral-400">No hay nodos disponibles</div>
              ) : (
                filteredNodes.map((node) => (
                  <button
                    key={node.nodoid}
                    onClick={() => handleNodeSelect(node)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-600 transition-colors border-b border-neutral-600 last:border-b-0"
                  >
                    <div className="font-medium text-white">{node.nodo}</div>
                    <div className="text-sm text-neutral-400">
                      {node.ubicacion.ubicacion} - {node.ubicacion.fundo.fundo}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {node.ubicacion.fundo.empresa.empresa} - {node.ubicacion.fundo.empresa.pais.pais}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="bg-neutral-700 rounded-lg p-4 h-96 flex items-center justify-center">
          <div className="text-center text-neutral-400">
            <div className="text-4xl mb-4">🗺️</div>
            <div className="text-lg font-medium mb-2">Mapa Interactivo</div>
            <div className="text-sm">Funcionalidad de mapa en desarrollo</div>
            <div className="text-xs mt-2">
              {nodes.length} nodos disponibles con coordenadas GPS
            </div>
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="mt-4 p-3 bg-neutral-700 rounded-lg">
          <div className="text-sm text-neutral-300">
            <div className="font-medium text-white mb-1">Nodo Seleccionado:</div>
            <div><strong>ID:</strong> {selectedNode.nodoid}</div>
            <div><strong>Nombre:</strong> {selectedNode.nodo}</div>
            <div><strong>DevEUI:</strong> {selectedNode.deveui}</div>
            <div><strong>Ubicación:</strong> {selectedNode.ubicacion.ubicacion}</div>
            <div><strong>Fundo:</strong> {selectedNode.ubicacion.fundo.fundo}</div>
            <div><strong>Empresa:</strong> {selectedNode.ubicacion.fundo.empresa.empresa}</div>
            <div><strong>País:</strong> {selectedNode.ubicacion.fundo.empresa.pais.pais}</div>
            {selectedNode.latitud && selectedNode.longitud && (
              <div><strong>Coordenadas:</strong> {selectedNode.latitud}, {selectedNode.longitud}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
