import React, { useState, useEffect, useRef } from 'react'
import { JoySenseService } from '../../services/backend-api'
import { InteractiveMap } from './InteractiveMap'
import { NodeData } from '../../types/NodeData'
import { useFilters } from '../../contexts/FilterContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { filterNodesByGlobalFilters } from '../../utils/filterNodesUtils'

interface NodeSelectorProps {
  selectedEntidadId: number | null
  selectedUbicacionId: number | null
  onNodeSelect: (nodeData: NodeData) => void
  onNodeClear?: () => void  // ← Nuevo callback
  onFiltersUpdate: (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
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
  onNodeClear,
  onFiltersUpdate,
  onEntidadChange,
  onUbicacionChange
}) => {
  const { t } = useLanguage();
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [filteredNodes, setFilteredNodes] = useState<NodeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [nodeMediciones, setNodeMediciones] = useState<{ [nodeId: number]: number }>({})
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const lastProcessedUbicacionId = useRef<number | null>(null)
  const pendingUbicacion = useRef<{ ubicacionid: number; ubicacion: string; ubicacionabrev: string; fundoid: number } | null>(null)
  const nodeMedicionesLoadedRef = useRef<boolean>(false)

  // Log para monitorear cambios en selectedNode
  useEffect(() => {
    console.log('🎭 NodeSelector: selectedNode cambió', {
      selectedNodeId: selectedNode?.nodoid,
      selectedNodeName: selectedNode?.nodo,
      timestamp: new Date().toISOString()
    });
  }, [selectedNode])

  // Hook para acceder a los filtros globales del sidebar y header
  const { 
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    setPaisSeleccionado, 
    setEmpresaSeleccionada, 
    setFundoSeleccionado,
    setEntidadSeleccionada,
    setUbicacionSeleccionada,
    entidadSeleccionada
  } = useFilters()

  const loadNodes = async () => {
    setLoading(true)
    setError(null)
    try {
      // Construir filtros: si fundoId está definido, usarlo; sino empresaId; sino paisId
      // Esto asegura que el backend filtre correctamente en la jerarquía
      const filters = fundoSeleccionado
        ? { fundoId: fundoSeleccionado }
        : empresaSeleccionada
        ? { empresaId: empresaSeleccionada }
        : paisSeleccionado
        ? { paisId: paisSeleccionado }
        : undefined;
      const data = await JoySenseService.getNodosConLocalizacion(1000, filters)
      // Los datos ya vienen procesados del backend
      setNodes(data || [])
    } catch (err) {
      setError('Error al cargar nodos')
      console.error('[NodeSelector] loadNodes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Limpiar filtros de entidad y ubicación cuando cambian los filtros globales
  // Esto asegura que el mapa siempre muestre los nodos correctos del filtro global
  useEffect(() => {
    console.log('🔄 NodeSelector: Cambiaron filtros globales', {
      pais: paisSeleccionado,
      empresa: empresaSeleccionada,
      fundo: fundoSeleccionado
    });
    
    // Solo limpiar si realmente cambiaron los filtros y no es por selección de nodo
    if (selectedNode && selectedNode.ubicacion?.fundo?.empresa?.pais?.paisid && selectedNode.ubicacion.fundo.empresa.empresaid && selectedNode.ubicacion.fundoid) {
      const selectedPais = selectedNode.ubicacion.fundo.empresa.pais.paisid.toString();
      const selectedEmpresa = selectedNode.ubicacion.fundo.empresa.empresaid.toString();
      const selectedFundo = selectedNode.ubicacion.fundoid.toString();
      
      // Si el nodo seleccionado aún pertenece a los filtros actuales, no limpiar
      if (paisSeleccionado === selectedPais && 
          empresaSeleccionada === selectedEmpresa && 
          fundoSeleccionado === selectedFundo) {
        console.log('🎯 NodeSelector: Nodo seleccionado aún pertenece a filtros, no limpiar');
        return;
      }
    }
    
    // Limpiar la selección de nodo
    console.log('🧹 NodeSelector: Limpiando selección de nodo');
    setSelectedNode(null);
    // Resetear términos de búsqueda
    setSearchTerm('');
    // Notificar al padre que se han reseteado los filtros
    onFiltersUpdate({
      entidadId: null,
      ubicacionId: null
    });
    // Notificar al padre que se ha limpiado el nodo
    onNodeClear?.();
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

  // Cargar nodos con localizaciones (re-cargar cuando cambian los filtros globales)
  useEffect(() => {
    loadNodes()
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado])


  // Filtrar nodos basado en filtros seleccionados y nodo seleccionado
  useEffect(() => {
    let filtered = nodes
    
    console.log('🔍 NodeSelector: Iniciando filtrado de nodos', {
      totalNodes: nodes.length,
      selectedNodeId: selectedNode?.nodoid,
      selectedNodeName: selectedNode?.nodo,
      selectedEntidadId,
      selectedUbicacionId,
      searchTerm
    });

    // Si hay un nodo seleccionado, solo mostrar ese nodo
    if (selectedNode) {
      filtered = nodes.filter(node => node.nodoid === selectedNode.nodoid)
      console.log('🎯 NodeSelector: Filtrado por nodo seleccionado', {
        nodoId: selectedNode.nodoid,
        nodosFiltrados: filtered.length,
        nodos: filtered.map(n => ({ id: n.nodoid, nombre: n.nodo })),
        timestamp: new Date().toISOString()
      });
    }
    // Si no hay nodo seleccionado, aplicar filtros de entidad y ubicación
    else {
      if (selectedEntidadId) {
        filtered = filtered.filter(node => node.entidad?.entidadid === selectedEntidadId)
        console.log('🏢 NodeSelector: Filtrado por entidad', {
          entidadId: selectedEntidadId,
          nodosRestantes: filtered.length
        });
      }

      if (selectedUbicacionId) {
        filtered = filtered.filter(node => node.ubicacionid === selectedUbicacionId)
        console.log('📍 NodeSelector: Filtrado por ubicación', {
          ubicacionId: selectedUbicacionId,
          nodosRestantes: filtered.length
        });
      }
      
      // ⚠️ NOTA: NO aplicar filterNodesByGlobalFilters aquí porque el backend ya filtró los nodos
      // Si se pasaron fundoId/empresaId/paisId al backend, los nodos ya vienen filtrados.
      // Aplicar el filtro de nuevo aquí causaría pérdida de nodos si hay inconsistencias de datos.
      // Solo se aplica si NO se pasaron filtros al backend (legacy compatibility)
      // En este caso, como siempre pasamos filtros, NO es necesario.
    }

    // Aplicar filtro de búsqueda si hay término de búsqueda (incluye localización y referencia como en MEDICIÓN)
    const term = searchTerm.toLowerCase().trim()
    if (term) {
      const beforeSearch = filtered.length
      filtered = filtered.filter(node =>
        node.nodo.toLowerCase().includes(term) ||
        node.ubicacion.ubicacion.toLowerCase().includes(term) ||
        (node.localizacion?.toLowerCase().includes(term)) ||
        (node.referencia?.toLowerCase().includes(term)) ||
        node.ubicacion.fundo.fundo.toLowerCase().includes(term) ||
        node.ubicacion.fundo.empresa.empresa.toLowerCase().includes(term)
      )
      console.log('🔍 NodeSelector: Filtrado por término de búsqueda', {
        termino: term,
        antes: beforeSearch,
        despues: filtered.length
      });
    }

    console.log('✅ NodeSelector: Filtrado completado', {
      nodosFinales: filtered.length,
      nodos: filtered.map(n => ({ id: n.nodoid, nombre: n.nodo, ubicacion: n.ubicacion?.ubicacion }))
    });

    setFilteredNodes(filtered)
  }, [nodes, selectedNode, selectedEntidadId, selectedUbicacionId, searchTerm, paisSeleccionado, empresaSeleccionada, fundoSeleccionado])

  // Cargar conteo de mediciones por nodo (solo una vez, optimizado)
  useEffect(() => {
    // Evitar cargar múltiples veces
    if (nodeMedicionesLoadedRef.current) return
    
    const loadNodeMediciones = async () => {
      try {
        nodeMedicionesLoadedRef.current = true
        // No cargar todas las mediciones - esto es muy costoso
        // Si necesitas el conteo por nodo, usa un endpoint optimizado o countOnly
        // Por ahora, simplemente no cargar para evitar el problema de rendimiento
        setNodeMediciones({})
      } catch (err) {
        console.error('Error loading node mediciones:', err)
        nodeMedicionesLoadedRef.current = false
      }
    }

    loadNodeMediciones()
  }, [])

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
    // Primero actualizar entidad para que las ubicaciones se recarguen
    if (node.entidad) {
      setEntidadSeleccionada(node.entidad)
      
      // Guardar la ubicación pendiente para establecerla después de que se recarguen las ubicaciones
      pendingUbicacion.current = {
        ubicacionid: node.ubicacionid,
        ubicacion: node.ubicacion.ubicacion,
        ubicacionabrev: node.ubicacion.ubicacionabrev,
        fundoid: node.ubicacion.fundoid
      }
    }
  }

  // useEffect para establecer la ubicación después de que la entidad se haya actualizado y las ubicaciones se hayan recargado
  useEffect(() => {
    // Solo establecer ubicación si hay una pendiente y la entidad está seleccionada
    if (pendingUbicacion.current && entidadSeleccionada) {
      // Esperar un tiempo para que el useEffect de ubicaciones en DashboardFilters se ejecute
      const timeoutId = setTimeout(() => {
        if (pendingUbicacion.current) {
          setUbicacionSeleccionada(pendingUbicacion.current)
          pendingUbicacion.current = null // Limpiar después de establecer
        }
      }, 400) // Delay suficiente para que se recarguen las ubicaciones

      return () => clearTimeout(timeoutId)
    }
  }, [entidadSeleccionada, setUbicacionSeleccionada])

  const handleNodeSelect = (node: NodeData) => {
    console.log('🖱️ NodeSelector: handleNodeSelect iniciado', {
      nodoid: node.nodoid,
      nodo: node.nodo,
      localizacion: node.localizacion,
      ubicacion: node.ubicacion.ubicacion
    });
    
    setSelectedNode(node)
    onNodeSelect(node)
    setIsSearchDropdownOpen(false)
    setSearchTerm('')
    
    // Actualizar el ref de última ubicación procesada
    lastProcessedUbicacionId.current = node.ubicacionid
    
    // Sincronizar todos los filtros globales
    syncAllFilters(node)
    
    // Actualizar filtros del dashboard
    onFiltersUpdate({
      entidadId: node.entidad?.entidadid || 0,
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion?.fundoid || 0,
      empresaId: node.ubicacion?.fundo?.empresa?.empresaid || 0,
      paisId: node.ubicacion?.fundo?.empresa?.pais?.paisid || 0
    })
    
    console.log('✅ NodeSelector: handleNodeSelect completado');
  }

  // Seleccionar automáticamente el primer nodo cuando cambia la ubicación en el filtro
  // Solo se ejecuta cuando cambia selectedUbicacionId y hay nodos disponibles
  useEffect(() => {
    // Solo actuar si hay una ubicación seleccionada, hay nodos cargados, y es una ubicación diferente a la última procesada
    if (selectedUbicacionId && nodes.length > 0 && lastProcessedUbicacionId.current !== selectedUbicacionId) {
      // Verificar si el nodo actual pertenece a la ubicación seleccionada
      const currentNodeMatches = selectedNode && selectedNode.ubicacionid === selectedUbicacionId
      
      // Si no hay nodo seleccionado o el nodo actual no coincide con la ubicación, buscar el primer nodo de esa ubicación
      if (!currentNodeMatches) {
        // Buscar nodos de la ubicación seleccionada
        const nodesInUbicacion = nodes.filter(node => node.ubicacionid === selectedUbicacionId)
        
        // Si hay nodos en esa ubicación, seleccionar el primero
        if (nodesInUbicacion.length > 0) {
          const firstNode = nodesInUbicacion[0]
          // Actualizar el ref antes de seleccionar para evitar bucles
          lastProcessedUbicacionId.current = selectedUbicacionId
          handleNodeSelect(firstNode)
        }
      } else {
        // Si el nodo actual ya coincide, solo actualizar el ref
        lastProcessedUbicacionId.current = selectedUbicacionId
      }
    }
  }, [selectedUbicacionId, nodes]) // Dependencias: solo selectedUbicacionId y nodes para evitar bucles

  const handleMapNodeClick = (node: NodeData) => {
    console.log('🖱️ NodeSelector: handleMapNodeClick iniciado', {
      nodoid: node.nodoid,
      nodo: node.nodo,
      localizacion: node.localizacion,
      ubicacion: node.ubicacion.ubicacion
    });
    
    try {
      console.log('✓ NodeSelector: Seteando selectedNode ANTES de sincronizar');
      setSelectedNode(node)
      
      console.log('✓ NodeSelector: Llamando a onNodeSelect del padre');
      onNodeSelect(node)
      
      console.log('✓ NodeSelector: Cerrando dropdown y limpiando search');
      setIsSearchDropdownOpen(false)
      setSearchTerm('')
    } catch (error) {
      console.error('❌ NodeSelector: handleMapNodeClick error:', error);
    }

    // Actualizar el ref de última ubicación procesada
    lastProcessedUbicacionId.current = node.ubicacionid

    console.log('🔄 NodeSelector: Sincronizando filtros globales (esto podría causar reset)');
    // Sincronizar todos los filtros globales
    syncAllFilters(node)

    console.log('📤 NodeSelector: Actualizando filtros del dashboard');
    // Actualizar filtros del dashboard
    onFiltersUpdate({
      entidadId: node.entidad?.entidadid || 0,
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion?.fundoid || 0,
      empresaId: node.ubicacion?.fundo?.empresa?.empresaid || 0,
      paisId: node.ubicacion?.fundo?.empresa?.pais?.paisid || 0
    })
    
    // Verificar que el selectedNode no se perdió
    setTimeout(() => {
      console.log('🔍 NodeSelector: Verificando selectedNode después de sincronización', {
        selectedNodeId: selectedNode?.nodoid,
        timestamp: new Date().toISOString()
      });
    }, 100);
    
    console.log('✅ NodeSelector: handleMapNodeClick completado');
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
        <h3 className="text-lg font-bold text-blue-500 font-mono tracking-wider">{t('dashboard.select_node')}</h3>

        <div className="flex items-center gap-3">
          {/* Botón de cancelar selección - Al costado izquierdo del searchbar */}
          {selectedNode && (
            <button
              onClick={() => {
                setSelectedNode(null)
                onNodeSelect(null as any) // Notificar que se canceló la selección

                // Limpiar filtros del dashboard para mostrar todos los nodos disponibles
                onFiltersUpdate({
                  entidadId: null, // Sin filtro de entidad
                  ubicacionId: null, // Sin filtro de ubicación
                  fundoId: null,
                  empresaId: null,
                  paisId: null
                })

                // También limpiar los filtros del header
                if (onEntidadChange) onEntidadChange(null)
                if (onUbicacionChange) onUbicacionChange(null)

                // Limpiar también el contexto global de filtros
                setEntidadSeleccionada(null)
                setUbicacionSeleccionada(null)
                
                // Limpiar el ref de última ubicación procesada y ubicación pendiente
                lastProcessedUbicacionId.current = null
                pendingUbicacion.current = null
              }}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-mono tracking-wider transition-colors flex items-center gap-2"
              title="Cancelar selección"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm">CANCELAR</span>
            </button>
          )}

          {/* Combobox con searchbar */}
        <div className="relative w-80" ref={searchDropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={selectedNode ? `${selectedNode.ubicacion.ubicacion}${selectedNode.localizacion ? ` - ${selectedNode.localizacion}` : ''}` : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsSearchDropdownOpen(true)
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              placeholder={t('dashboard.search_node_placeholder')}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-4 h-4 text-gray-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Dropdown de resultados */}
          {isSearchDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto dashboard-scrollbar-blue">
              {loading ? (
                <div className="px-4 py-3 text-center text-gray-600 dark:text-neutral-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
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
                    title={`${node.nodo} | ${t('dashboard.tooltip.location')} ${node.ubicacion.ubicacion} | ${t('dashboard.tooltip.fund')} ${node.ubicacion.fundo.fundo} | ${t('dashboard.tooltip.company')} ${node.ubicacion.fundo.empresa.empresa} | ${t('dashboard.tooltip.country')} ${node.ubicacion.fundo.empresa.pais.pais}${node.latitud && node.longitud ? ` | ${t('dashboard.tooltip.coordinates')} ${node.latitud}, ${node.longitud}` : ''}`}
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
      </div>


      {/* Mapa con nodos filtrados */}
      <div className="w-full" style={{ height: '600px', minHeight: '600px' }}>
        <InteractiveMap
          nodes={filteredNodes}
          selectedNode={selectedNode}
          onNodeSelect={handleMapNodeClick}
          loading={loading}
          nodeMediciones={nodeMediciones}
        />
      </div>

    </div>
  )
}
