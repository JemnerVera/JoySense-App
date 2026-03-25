import React, { useState, useEffect, useRef, useMemo } from 'react'
import { JoySenseService } from '../../services/backend-api'
import { InteractiveMap } from './InteractiveMap'
import { SVGPlantMap } from './SVGPlantMap'
import { NodeData } from '../../types/NodeData'
import { useFilters } from '../../contexts/FilterContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { filterNodesByGlobalFilters } from '../../utils/filterNodesUtils'

interface NodeSelectorProps {
  selectedUbicacionId: number | null
  selectedNodeFromParent?: NodeData | null
  onNodeSelect: (nodeData: NodeData) => void
  onNodeClear?: () => void
  onFiltersUpdate: (filters: {
    ubicacionId: number | null;
    fundoId?: number | null;
    empresaId?: number | null;
    paisId?: number | null;
  }) => void
  onUbicacionChange?: (ubicacion: any) => void
  autoSelectFirstNode?: boolean  // Nuevo: controlar si auto-seleccionar primer nodo
}

export const NodeSelector: React.FC<NodeSelectorProps> = ({
  selectedUbicacionId,
  selectedNodeFromParent,
  onNodeSelect,
  onNodeClear,
  onFiltersUpdate,
  onUbicacionChange,
  autoSelectFirstNode = true  // Por defecto enabled (comportamiento actual)
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
  const [tipos, setTipos] = useState<any[]>([])
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const lastProcessedUbicacionId = useRef<number | null>(null)
  const pendingUbicacion = useRef<{ ubicacionid: number; ubicacion: string; ubicacionabrev: string; fundoid: number } | null>(null)
  const nodeMedicionesLoadedRef = useRef<boolean>(false)



  // Hook para acceder a los filtros globales del sidebar y header
  const { 
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    setPaisSeleccionado, 
    setEmpresaSeleccionada, 
    setFundoSeleccionado,
    setUbicacionSeleccionada,
    setLocalizacionSeleccionada,
    showDetailedAnalysis
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
      
      // Cargar datos en paralelo
      const [nodesData, tiposData, sensoresData] = await Promise.all([
        JoySenseService.getNodosConLocalizacion(1000, filters),
        JoySenseService.getTipos(),
        JoySenseService.getSensores()
      ])

      // Guardar tipos para enriquecer nodos
      setTipos(tiposData || [])
      
      // Enriquecer nodos con tipoid desde sensores/localizaciones
      const enrichedNodes = (nodesData || []).map((node: any) => {
        // Intentar obtener tipoid desde las localizaciones del nodo
        // En una estructura real, esto vendría del backend, pero lo enriquecemos aquí como fallback
        return {
          ...node,
          tipoid: (node as any).tipoid || undefined // Si no viene del backend, dejarlo undefined
        } as NodeData
      })
      
      setNodes(enrichedNodes)
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
    // Solo limpiar si realmente cambiaron los filtros y no es por selección de nodo
    if (selectedNode && selectedNode.ubicacion?.fundo?.empresa?.pais?.paisid && selectedNode.ubicacion.fundo.empresa.empresaid && selectedNode.ubicacion.fundoid) {
      const selectedPais = selectedNode.ubicacion.fundo.empresa.pais.paisid.toString();
      const selectedEmpresa = selectedNode.ubicacion.fundo.empresa.empresaid.toString();
      const selectedFundo = selectedNode.ubicacion.fundoid.toString();
      
      // Si el nodo seleccionado aún pertenece a los filtros actuales, no limpiar
      if (paisSeleccionado === selectedPais && 
          empresaSeleccionada === selectedEmpresa && 
          fundoSeleccionado === selectedFundo) {
        return;
      }
    }
    
    // Limpiar la selección de nodo
    setSelectedNode(null);
    // Resetear términos de búsqueda
    setSearchTerm('');
    // Notificar al padre que se han reseteado los filtros
    onFiltersUpdate({
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

    // Si hay un nodo seleccionado, solo mostrar ese nodo
    if (selectedNode) {
      filtered = nodes.filter(node => node.nodoid === selectedNode.nodoid)
    }
    // Si no hay nodo seleccionado, aplicar solo filtro de ubicación
    else {
      if (selectedUbicacionId) {
        filtered = filtered.filter(node => node.ubicacionid === selectedUbicacionId)
      }
      
      // ⚠️ NOTA: NO aplicar filterNodesByGlobalFilters aquí porque el backend ya filtró los nodos
      // Si se pasaron fundoId/empresaId/paisId al backend, los nodos ya vienen filtrados.
      // Aplicar el filtro de nuevo aquí causaría pérdida de nodos si hay inconsistencias de datos.
      // Solo se aplica si NO se pasaron filtros al backend (legacy compatibility)
      // En este caso, como siempre pasamos filtros, NO es necesario.
    }

    // Aplicar filtro de búsqueda si hay término de búsqueda (priorizar localización)
    const term = searchTerm.toLowerCase().trim()
    if (term) {
      // Filtrar por localización primero, luego por otros campos
      filtered = filtered.filter(node => {
        const localizacionMatch = node.localizacion?.toLowerCase().includes(term);
        const nodoMatch = node.nodo.toLowerCase().includes(term);
        const ubicacionMatch = node.ubicacion.ubicacion.toLowerCase().includes(term);
        const fundoMatch = node.ubicacion.fundo.fundo.toLowerCase().includes(term);
        const empresaMatch = node.ubicacion.fundo.empresa.empresa.toLowerCase().includes(term);
        const paisMatch = node.ubicacion.fundo.empresa.pais.pais.toLowerCase().includes(term);
        const referenciaMatch = node.referencia?.toLowerCase().includes(term);

        return localizacionMatch || nodoMatch || ubicacionMatch || fundoMatch || empresaMatch || paisMatch || referenciaMatch;
      });

      // Ordenar para que los resultados que coinciden en localización aparezcan primero
      filtered.sort((a, b) => {
        const aLocalizacionMatch = a.localizacion?.toLowerCase().includes(term) ? 1 : 0;
        const bLocalizacionMatch = b.localizacion?.toLowerCase().includes(term) ? 1 : 0;
        return bLocalizacionMatch - aLocalizacionMatch;
      });
    }

    setFilteredNodes(filtered)
  }, [nodes, selectedNode, selectedUbicacionId, searchTerm, paisSeleccionado, empresaSeleccionada, fundoSeleccionado])

  // Detectar si hay nodos PLC vs LoRaWAN en los nodos filtrados
  const { hasPlcNodes, plcUbicacionIds, currentFundoid } = useMemo(() => {
    // Ubicaciones con sensores PLC (que mapean a SVG)
    const SVG_UBICACIONES = [230, 231, 234] // Planta 01 Valerie, Planta 02 Valerie, Planta 02 Zoe
    
    // Filtrar nodos PLC (en ubicaciones SVG con coordenadas relativas 0-100)
    const plcNodes = filteredNodes.filter(node => {
      const hasPlcUbicacion = SVG_UBICACIONES.includes(node.ubicacionid)
      const couldBePlc = (node.latitud != null && node.longitud != null && 
                         node.latitud >= 0 && node.latitud <= 100 && 
                         node.longitud >= 0 && node.longitud <= 100)
      return hasPlcUbicacion && couldBePlc
    })
    
    // Filtrar nodos LoRaWAN (con coordenadas GPS válidas fuera del rango 0-100)
    const loraNodes = filteredNodes.filter(node => {
      const lat = node.latitud
      const lng = node.longitud
      // GPS válido: debe estar fuera del rango 0-100 (rango típico de Perú es -18 a -0, -84 a -68)
      const isValidGps = lat != null && lng != null && 
                        (lat > 100 || lat < 0 || lng > 100 || lng < 0)
      return isValidGps
    })
    
    // CRÍTICO: Mostrar SVGPlantMap SOLO si hay PURO PLC (sin LoRaWAN)
    // Si hay ambos tipos, mostrar Leaflet por defecto
    const isPurePlc = plcNodes.length > 0 && loraNodes.length === 0
    
    const plcUbicacionIds = Array.from(new Set(plcNodes.map(n => n.ubicacionid)))
    const fundoid = plcNodes.length > 0 ? plcNodes[0].ubicacion?.fundoid : null
    
    return {
      hasPlcNodes: isPurePlc,  // ← CAMBIO: Solo true si es PURO PLC
      plcUbicacionIds,
      currentFundoid: fundoid
    }
  }, [filteredNodes])

  // Función para sincronizar todos los filtros cuando se selecciona un nodo
  const syncAllFilters = (node: NodeData) => {
    // GUARD: No sincronizar filtros cuando el análisis detallado está abierto
    // para evitar problemas de sincronización y cambios involuntarios de datos
    if (showDetailedAnalysis) {
      console.warn('[NodeSelector] Filtros bloqueados: análisis detallado abierto. Selección de nodo ignorada.')
      return
    }

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

    // 2. Actualizar ubicación usando contexto global
    setUbicacionSeleccionada({
      ubicacionid: node.ubicacionid,
      ubicacion: node.ubicacion.ubicacion,
      ubicacionabrev: node.ubicacion.ubicacionabrev,
      fundoid: node.ubicacion.fundoid
    })

    // 3. Actualizar localización para que MEDICIONES y STATUS DE NODOS la tengan preseleccionada
    setLocalizacionSeleccionada({
      nodoid: node.nodoid,
      localizacion: node.localizacion ?? node.nodo,
      nodo: node.nodo,
      localizacionid: (node as any).localizacionid ?? undefined
    })
  }

  const handleNodeSelect = (node: NodeData) => {
    // GUARD: Prevenir selección de nodo durante análisis detallado
    // para evitar cambios de estado conflictivos
    if (showDetailedAnalysis) {
      console.warn('[NodeSelector] Selección de nodo bloqueada: análisis detallado abierto');
      return;
    }

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
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion?.fundoid || 0,
      empresaId: node.ubicacion?.fundo?.empresa?.empresaid || 0,
      paisId: node.ubicacion?.fundo?.empresa?.pais?.paisid || 0
    })
  }

  // Seleccionar automáticamente el primer nodo cuando cambia la ubicación en el filtro
  // Solo se ejecuta cuando cambiaSelectedUbicacionId y hay nodos disponibles
  // SOLO si autoSelectFirstNode es true (controlado por prop)
  useEffect(() => {
    // Solo actuar si hay una ubicación seleccionada, hay nodos cargados, es una ubicación diferente, Y autoSelectFirstNode es true
    if (autoSelectFirstNode && selectedUbicacionId && nodes.length > 0 && lastProcessedUbicacionId.current !== selectedUbicacionId) {
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
  }, [selectedUbicacionId, nodes, autoSelectFirstNode]) // Dependencias: agregado autoSelectFirstNode

  const handleMapNodeClick = (node: NodeData) => {
    try {
      setSelectedNode(node)
      onNodeSelect(node)
      setIsSearchDropdownOpen(false)
      setSearchTerm('')
    } catch (error) {
      console.error('NodeSelector: handleMapNodeClick error:', error);
    }

    // Actualizar el ref de última ubicación procesada
    lastProcessedUbicacionId.current = node.ubicacionid

    // Sincronizar todos los filtros globales
    syncAllFilters(node)

    // Actualizar filtros del dashboard
    onFiltersUpdate({
      ubicacionId: node.ubicacionid,
      fundoId: node.ubicacion?.fundoid || 0,
      empresaId: node.ubicacion?.fundo?.empresa?.empresaid || 0,
      paisId: node.ubicacion?.fundo?.empresa?.pais?.paisid || 0
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
    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg px-2 py-1 mb-1 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <h3 className="text-sm font-bold text-blue-500 font-mono tracking-wider">{t('dashboard.select_node')}</h3>

        <div className="flex items-center gap-3">
          {/* Botón de cancelar selección - Al costado izquierdo del searchbar */}
          {selectedNode && (
            <button
              onClick={() => {
                setSelectedNode(null)
                onNodeSelect(null as any)

                onFiltersUpdate({
                  ubicacionId: null,
                  fundoId: null,
                  empresaId: null,
                  paisId: null
                })

                if (onUbicacionChange) onUbicacionChange(null)

                setUbicacionSeleccionada(null)
                
                lastProcessedUbicacionId.current = null
                pendingUbicacion.current = null
              }}
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-mono tracking-wider transition-colors flex items-center gap-1"
              title="Cancelar selección"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs">CANCELAR</span>
            </button>
          )}

          {/* Combobox con searchbar */}
        <div className="relative w-96" ref={searchDropdownRef}>
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
              className="w-full px-3 py-1 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-xs"
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
                <>
                  {/* Contador de resultados */}
                  <div className="sticky top-0 px-4 py-2 bg-gray-200 dark:bg-neutral-600 border-b border-gray-300 dark:border-neutral-500 text-xs font-semibold text-gray-700 dark:text-neutral-300">
                    {filteredNodes.length} resultado{filteredNodes.length !== 1 ? 's' : ''} encontrado{filteredNodes.length !== 1 ? 's' : ''}
                  </div>
                  {filteredNodes.map((node) => (
                    <button
                      key={node.nodoid}
                      onClick={() => handleNodeSelect(node)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors border-b border-gray-300 dark:border-neutral-600 last:border-b-0 group relative"
                      title={`${node.localizacion || node.nodo} | ${node.nodo} | ${t('dashboard.tooltip.location')} ${node.ubicacion.ubicacion} | ${t('dashboard.tooltip.fund')} ${node.ubicacion.fundo.fundo} | ${t('dashboard.tooltip.company')} ${node.ubicacion.fundo.empresa.empresa} | ${t('dashboard.tooltip.country')} ${node.ubicacion.fundo.empresa.pais.pais}${node.latitud && node.longitud ? ` | ${t('dashboard.tooltip.coordinates')} ${node.latitud}, ${node.longitud}` : ''}`}
                    >
                      {/* Línea 1: Localización - Nodo */}
                      <div className="font-medium text-gray-800 dark:text-white">
                        {node.localizacion ? (
                          <span>
                            {node.localizacion}
                            <span className="text-xs text-gray-500 dark:text-neutral-400 ml-2 font-normal">
                              {node.nodo}
                            </span>
                          </span>
                        ) : (
                          <span>{node.nodo}</span>
                        )}
                      </div>
                      {/* Línea 2: Ubicación - Fundo */}
                      <div className="text-sm text-gray-600 dark:text-neutral-400">
                        {node.ubicacion.ubicacion} - {node.ubicacion.fundo.fundo}
                      </div>
                      {/* Línea 3: Empresa - País */}
                      <div className="text-xs text-gray-500 dark:text-neutral-500">
                        {node.ubicacion.fundo.empresa.empresa} - {node.ubicacion.fundo.empresa.pais.pais}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>


      {/* Mapa con nodos filtrados */}
      <div className={`w-full flex-1 min-h-0 ${selectedNodeFromParent ? 'h-[30%]' : 'h-full'}`}>
        {/* Mostrar SVGPlantMap si hay nodos PLC, si no mostrar Leaflet */}
        {hasPlcNodes && currentFundoid ? (
          <SVGPlantMap
            nodes={filteredNodes}
            selectedNode={selectedNode}
            onNodeSelect={handleMapNodeClick}
            loading={loading}
            fundoid={currentFundoid}
            defaultNodeColor="#3b82f6"
          />
        ) : (
          <InteractiveMap
            nodes={filteredNodes}
            selectedNode={selectedNode}
            onNodeSelect={handleMapNodeClick}
            loading={loading}
            nodeMediciones={nodeMediciones}
          />
        )}
      </div>

    </div>
  )
}
