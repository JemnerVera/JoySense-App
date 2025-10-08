import React, { useState, useEffect, useRef } from 'react'
import { JoySenseService } from '../../services/backend-api'
import { InteractiveMap } from './InteractiveMap'
import { NodeData } from '../../types/NodeData'
import { useFilters } from '../../contexts/FilterContext'

interface NodeSelectorProps {
  selectedEntidadId: number | null
  selectedUbicacionId: number | null
  onNodeSelect: (nodeData: NodeData) => void
  onFiltersUpdate: (filters: { 
    entidadId: number; 
    ubicacionId: number;
    fundoId?: number | null;
    empresaId?: number | null;
    paisId?: number | null;
  }) => void
  // Callbacks para actualizar filtros del header
  onEntidadChange?: (entidad: any) => void
  onUbicacionChange?: (ubicacion: any) => void
}

export const NodeSelector: React.FC<NodeSelectorProps> = ({
  selectedEntidadId,
  selectedUbicacionId,
  onNodeSelect,
  onFiltersUpdate,
  onEntidadChange,
  onUbicacionChange
}) => {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [filteredNodes, setFilteredNodes] = useState<NodeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [nodeMediciones, setNodeMediciones] = useState<{ [nodeId: number]: number }>({})
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  // Hook para acceder a los filtros globales del sidebar y header
  const { 
    setPaisSeleccionado, 
    setEmpresaSeleccionada, 
    setFundoSeleccionado,
    setEntidadSeleccionada,
    setUbicacionSeleccionada
  } = useFilters()

  // Cargar nodos con localizaciones
  useEffect(() => {
    loadNodes()
    loadNodeMediciones()
  }, [])

  // Cargar conteo de mediciones por nodo
  const loadNodeMediciones = async () => {
    try {
      const data = await JoySenseService.getMediciones({ getAll: true })
      if (Array.isArray(data)) {
        const medicionesPorNodo: { [nodeId: number]: number } = {}
        data.forEach(medicion => {
          medicionesPorNodo[medicion.nodoid] = (medicionesPorNodo[medicion.nodoid] || 0) + 1
        })
        setNodeMediciones(medicionesPorNodo)
      }
    } catch (err) {
      console.error('Error loading node mediciones:', err)
    }
  }

  // Función para sincronizar todos los filtros cuando se selecciona un nodo
  const syncAllFilters = (node: NodeData) => {
    
    // 1. Actualizar filtros del sidebar (país, empresa, fundo)
    if (node.ubicacion.fundo.empresa.pais.paisid) {
      setPaisSeleccionado(node.ubicacion.fundo.empresa.pais.paisid.toString())
    }

    if (node.ubicacion.fundo.empresa.empresaid) {
      setEmpresaSeleccionada(node.ubicacion.fundo.empresa.empresaid.toString())
    }

    if (node.ubicacion.fundoid) {
      setFundoSeleccionado(node.ubicacion.fundoid.toString())
    }
    
    // 2. Actualizar filtros del header (entidad, ubicación) usando contexto global
    // Usar setTimeout para asegurar que el contexto se actualice en el siguiente tick
    setTimeout(() => {
      if (node.entidad) {
        setEntidadSeleccionada(node.entidad)
      }
      
      const ubicacion = {
        ubicacionid: node.ubicacionid,
        ubicacion: node.ubicacion.ubicacion,
        ubicacionabrev: node.ubicacion.ubicacionabrev,
        fundoid: node.ubicacion.fundoid
      }
      setUbicacionSeleccionada(ubicacion)
    }, 0)
  }

  // Filtrar nodos para el searchbar
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = nodes.filter(node => 
        node.nodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.deveui.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ubicacion.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ubicacion.fundo.fundo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ubicacion.fundo.empresa.empresa.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredNodes(filtered)
    } else {
      setFilteredNodes(nodes)
    }
  }, [searchTerm, nodes])

  const loadNodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await JoySenseService.getNodosConLocalizacion()
      console.log('🔍 NodeSelector: Datos recibidos:', data)
      
      // Los datos ya vienen procesados del backend
      setNodes(data || [])
      console.log('🔍 NodeSelector: Nodos cargados:', data?.length || 0)
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
    setIsSearchDropdownOpen(false)
    setSearchTerm('')
    
    // Sincronizar todos los filtros globales
    syncAllFilters(node)
    
    // Actualizar filtros del dashboard
    onFiltersUpdate({
      entidadId: node.entidad.entidadid,
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion.fundoid,
      empresaId: node.ubicacion.fundo.empresa.empresaid,
      paisId: node.ubicacion.fundo.empresa.pais.paisid
    })
  }

  const handleMapNodeClick = (node: NodeData) => {
    setSelectedNode(node)
    onNodeSelect(node)
    
    // Sincronizar todos los filtros globales
    syncAllFilters(node)
    
    // Actualizar filtros del dashboard
    onFiltersUpdate({
      entidadId: node.entidad.entidadid,
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion.fundoid,
      empresaId: node.ubicacion.fundo.empresa.empresaid,
      paisId: node.ubicacion.fundo.empresa.pais.paisid
    })
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-500 font-mono tracking-wider">SELECCIONAR NODO</h3>
        
        {/* Combobox con searchbar */}
        <div className="relative w-80" ref={searchDropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={selectedNode ? `${selectedNode.nodo} - ${selectedNode.ubicacion.ubicacion}` : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsSearchDropdownOpen(true)
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              placeholder="Buscar nodo por nombre, DevEUI, ubicación..."
              className="w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-4 h-4 text-gray-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Dropdown de resultados */}
          {isSearchDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto dashboard-scrollbar">
              {loading ? (
                <div className="px-4 py-3 text-center text-gray-600 dark:text-neutral-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="px-4 py-3 text-red-400">{error}</div>
              ) : filteredNodes.length === 0 ? (
                <div className="px-4 py-3 text-gray-600 dark:text-neutral-400">
                  {searchTerm.trim() ? 'No se encontraron nodos' : 'No hay nodos disponibles'}
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <button
                    key={node.nodoid}
                    onClick={() => handleNodeSelect(node)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors border-b border-gray-300 dark:border-neutral-600 last:border-b-0 group relative"
                    title={`DevEUI: ${node.deveui} | Ubicación: ${node.ubicacion.ubicacion} | Fundo: ${node.ubicacion.fundo.fundo} | Empresa: ${node.ubicacion.fundo.empresa.empresa} | País: ${node.ubicacion.fundo.empresa.pais.pais}${node.latitud && node.longitud ? ` | Coordenadas: ${node.latitud}, ${node.longitud}` : ''}`}
                  >
                    <div className="font-medium text-gray-800 dark:text-white">{node.nodo}</div>
                    <div className="text-sm text-gray-600 dark:text-neutral-400">
                      {node.ubicacion.ubicacion} - {node.ubicacion.fundo.fundo}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-500">
                      {node.ubicacion.fundo.empresa.empresa} - {node.ubicacion.fundo.empresa.pais.pais}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mapa siempre visible */}
      <InteractiveMap
        nodes={nodes}
        selectedNode={selectedNode}
        onNodeSelect={handleMapNodeClick}
        loading={loading}
        nodeMediciones={nodeMediciones}
      />

    </div>
  )
}
