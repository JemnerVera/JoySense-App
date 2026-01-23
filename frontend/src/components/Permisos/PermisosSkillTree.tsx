/**
 * PermisosSkillTree - Vista tipo skill tree de RPG para visualizar permisos
 * Diseño visual con nodos conectados: Perfil → Origen → Fuente → Permisos
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { JoySenseService } from '../../services/backend-api'
import { LoadingSpinner } from '../SystemParameters/LoadingSpinner'
import SelectWithPlaceholder from '../selectors/SelectWithPlaceholder'

// ============================================================================
// INTERFACES
// ============================================================================

interface PermisosSkillTreeProps {
  themeColor?: 'purple'
}

interface Permiso {
  permisoid: number
  perfilid: number
  origenid: number
  fuenteid: number
  objetoid: number | null
  puede_ver: boolean
  puede_insertar: boolean
  puede_actualizar: boolean
  puede_eliminar: boolean
  statusid: number
}

interface Perfil {
  perfilid: number
  perfil: string
  nivel: number
  statusid: number
}

interface Origen {
  origenid: number
  origen: string
  statusid: number
}

interface Fuente {
  fuenteid: number
  fuente: string
  esquema: string
  statusid: number
}

interface SkillNode {
  id: string
  type: 'perfil' | 'origen' | 'fuente' | 'permiso'
  label: string
  level?: number
  x: number
  y: number
  children: string[]
  parent?: string
  data?: any
  permissions?: {
    ver: boolean
    insertar: boolean
    actualizar: boolean
    eliminar: boolean
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PermisosSkillTree({ themeColor = 'purple' }: PermisosSkillTreeProps) {
  const { t } = useLanguage()

  // Estados
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null)
  const [perfilesData, setPerfilesData] = useState<Perfil[]>([])
  const [origenesData, setOrigenesData] = useState<Origen[]>([])
  const [fuentesData, setFuentesData] = useState<Fuente[]>([])
  const [permisosData, setPermisosData] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Cargar permisos cuando cambia el perfil seleccionado
  useEffect(() => {
    if (selectedPerfilId) {
      loadPermisos(selectedPerfilId)
    } else {
      setPermisosData([])
    }
  }, [selectedPerfilId])

  async function loadInitialData() {
    try {
      setLoading(true)
      const [perfiles, origenes, fuentes] = await Promise.all([
        JoySenseService.getTableData('perfil', 500),
        JoySenseService.getTableData('origen', 100),
        JoySenseService.getTableData('fuente', 500)
      ])

      setPerfilesData(Array.isArray(perfiles) ? perfiles.filter((p: Perfil) => p.statusid === 1) : [])
      setOrigenesData(Array.isArray(origenes) ? origenes.filter((o: Origen) => o.statusid === 1) : [])
      setFuentesData(Array.isArray(fuentes) ? fuentes.filter((f: Fuente) => f.statusid === 1) : [])
    } catch (error) {
      console.error('Error cargando datos iniciales:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPermisos(perfilid: number) {
    try {
      setLoading(true)
      const permisos = await JoySenseService.getTableData('permiso', 5000)
      const permisosArray = Array.isArray(permisos) ? permisos : []
      
      const permisosFiltrados = permisosArray.filter(
        (p: Permiso) => p.perfilid === perfilid && p.statusid === 1
      )
      
      setPermisosData(permisosFiltrados)
    } catch (error) {
      console.error('Error cargando permisos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Construir el árbol de nodos tipo skill tree
  const skillTree = useMemo(() => {
    if (!selectedPerfilId || permisosData.length === 0) {
      return { nodes: [], connections: [] }
    }

    const perfil = perfilesData.find(p => p.perfilid === selectedPerfilId)
    if (!perfil) return { nodes: [], connections: [] }

    const nodes: SkillNode[] = []
    const connections: Array<{ from: string; to: string }> = []

    // Nodo raíz: Perfil
    const perfilNodeId = `perfil-${perfil.perfilid}`
    nodes.push({
      id: perfilNodeId,
      type: 'perfil',
      label: perfil.perfil,
      level: perfil.nivel,
      x: 50, // Centro horizontal
      y: 5,  // Parte superior
      children: [],
      data: perfil
    })

    // Agrupar permisos por origen
    const permisosPorOrigen = new Map<number, Permiso[]>()
    permisosData.forEach(p => {
      if (!permisosPorOrigen.has(p.origenid)) {
        permisosPorOrigen.set(p.origenid, [])
      }
      permisosPorOrigen.get(p.origenid)!.push(p)
    })

    // Calcular posiciones para orígenes (distribuidos horizontalmente)
    const origenesArray = Array.from(permisosPorOrigen.entries())
    const origenesCount = origenesArray.length
    // Distribuir orígenes en el ancho disponible (dejando márgenes más amplios)
    const margin = 8
    const availableWidth = 100 - (2 * margin)
    const origenSpacing = origenesCount > 1 ? availableWidth / (origenesCount - 1) : 50

    // Calcular altura dinámica basada en el número de fuentes
    let maxFuentesPorOrigen = 0
    origenesArray.forEach(([, permisos]) => {
      const fuentesUnicas = new Set(permisos.map(p => p.fuenteid))
      maxFuentesPorOrigen = Math.max(maxFuentesPorOrigen, fuentesUnicas.size)
    })

    // Ajustar espaciado vertical según la cantidad de contenido
    const baseYOrigen = 20
    const baseYFuente = baseYOrigen + 15 + (maxFuentesPorOrigen > 10 ? 5 : 0)
    const baseYPermiso = baseYFuente + 12 + (maxFuentesPorOrigen > 10 ? 3 : 0)

    origenesArray.forEach(([origenid, permisos], index) => {
      const origen = origenesData.find(o => o.origenid === origenid)
      if (!origen) return

      const origenNodeId = `origen-${origenid}`
      const origenX = origenesCount > 1 ? margin + (index * origenSpacing) : 50
      
      nodes.push({
        id: origenNodeId,
        type: 'origen',
        label: origen.origen,
        x: origenX,
        y: baseYOrigen,
        children: [],
        parent: perfilNodeId,
        data: origen
      })

      connections.push({ from: perfilNodeId, to: origenNodeId })

      // Agrupar permisos por fuente dentro de este origen
      const permisosPorFuente = new Map<number, Permiso[]>()
      permisos.forEach(p => {
        if (!permisosPorFuente.has(p.fuenteid)) {
          permisosPorFuente.set(p.fuenteid, [])
        }
        permisosPorFuente.get(p.fuenteid)!.push(p)
      })

      // Calcular posiciones para fuentes (distribuidas horizontalmente con mejor espaciado)
      const fuentesArray = Array.from(permisosPorFuente.entries())
      const fuentesCount = fuentesArray.length
      
      // Mejorar distribución cuando hay muchas fuentes
      let fuenteSpacing: number
      let baseX: number
      
      if (fuentesCount === 1) {
        baseX = origenX
        fuenteSpacing = 0
      } else if (fuentesCount <= 5) {
        // Pocas fuentes: distribuir alrededor del origen
        fuenteSpacing = Math.min(12, 80 / fuentesCount)
        baseX = Math.max(5, Math.min(95, origenX - (fuenteSpacing * (fuentesCount - 1)) / 2))
      } else {
        // Muchas fuentes: usar distribución más amplia
        fuenteSpacing = Math.min(8, 90 / fuentesCount)
        baseX = Math.max(5, Math.min(95, origenX - (fuenteSpacing * (fuentesCount - 1)) / 2))
      }

      fuentesArray.forEach(([fuenteid, fuentePermisos], fuenteIndex) => {
        const fuente = fuentesData.find(f => f.fuenteid === fuenteid)
        if (!fuente) return

        const fuenteNodeId = `fuente-${fuenteid}`
        const fuenteX = fuentesCount > 1 
          ? baseX + (fuenteIndex * fuenteSpacing)
          : origenX
        
        // Consolidar permisos de esta fuente
        const permisoConsolidado = fuentePermisos.reduce((acc, p) => {
          return {
            ver: acc.ver || p.puede_ver,
            insertar: acc.insertar || p.puede_insertar,
            actualizar: acc.actualizar || p.puede_actualizar,
            eliminar: acc.eliminar || p.puede_eliminar
          }
        }, { ver: false, insertar: false, actualizar: false, eliminar: false })

        nodes.push({
          id: fuenteNodeId,
          type: 'fuente',
          label: fuente.fuente,
          x: fuenteX,
          y: baseYFuente,
          children: [],
          parent: origenNodeId,
          data: fuente,
          permissions: permisoConsolidado
        })

        connections.push({ from: origenNodeId, to: fuenteNodeId })

        // Nodo de permisos (consolidado) - solo mostrar si hay permisos activos
        if (permisoConsolidado.ver || permisoConsolidado.insertar || 
            permisoConsolidado.actualizar || permisoConsolidado.eliminar) {
          const permisoNodeId = `permiso-${fuenteid}`
          nodes.push({
            id: permisoNodeId,
            type: 'permiso',
            label: 'Permisos',
            x: fuenteX,
            y: baseYPermiso,
            children: [],
            parent: fuenteNodeId,
            permissions: permisoConsolidado
          })

          connections.push({ from: fuenteNodeId, to: permisoNodeId })
        }
      })
    })

    return { nodes, connections }
  }, [selectedPerfilId, permisosData, perfilesData, origenesData, fuentesData])

  // Obtener opciones de perfiles para el select
  const perfilOptions = useMemo(() => {
    return perfilesData.map(p => ({
      value: p.perfilid,
      label: `${p.perfil} (Nivel ${p.nivel})`
    }))
  }, [perfilesData])

  // Función para obtener color del tema
  function getThemeColor(type: 'bg' | 'text' | 'border' | 'hover' | 'glow'): string {
    const colors = {
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700',
        glow: 'shadow-purple-500/50'
      }
    }
    return colors[themeColor][type]
  }

  // Renderizar nodo
  function renderNode(node: SkillNode) {
    const isHovered = hoveredNode === node.id
    const nodeSizes = {
      perfil: { width: '8rem', height: '8rem', fontSize: 'text-lg' },
      origen: { width: '6rem', height: '6rem', fontSize: 'text-sm' },
      fuente: { width: '5rem', height: '5rem', fontSize: 'text-xs' },
      permiso: { width: '7rem', height: '7rem', fontSize: 'text-xs' }
    }
    
    const nodeColors = {
      perfil: `bg-purple-600 hover:bg-purple-700 ${isHovered ? 'ring-4 ring-purple-400' : ''}`,
      origen: `bg-blue-600 hover:bg-blue-700 ${isHovered ? 'ring-4 ring-blue-400' : ''}`,
      fuente: `bg-green-600 hover:bg-green-700 ${isHovered ? 'ring-4 ring-green-400' : ''}`,
      permiso: `bg-yellow-600 hover:bg-yellow-700 ${isHovered ? 'ring-4 ring-yellow-400' : ''}`
    }

    const size = nodeSizes[node.type]
    const color = nodeColors[node.type]

    const nodeStyle = {
      left: `${node.x}%`,
      top: `${node.y}%`,
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.3s ease',
      width: size.width,
      height: size.height
    }

    return (
      <div
        key={node.id}
        className={`absolute rounded-full flex flex-col items-center justify-center border-4 border-white dark:border-neutral-800 cursor-pointer transition-all text-white ${color} ${isHovered ? 'scale-110 shadow-2xl z-50' : 'shadow-lg z-10'}`}
        style={nodeStyle}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        title={node.type === 'permiso' && node.permissions 
          ? `Ver: ${node.permissions.ver ? '✓' : '✗'}, Insertar: ${node.permissions.insertar ? '✓' : '✗'}, Actualizar: ${node.permissions.actualizar ? '✓' : '✗'}, Eliminar: ${node.permissions.eliminar ? '✓' : '✗'}`
          : node.label
        }
      >
        {node.type === 'perfil' && (
          <>
            <div className={`${size.fontSize} font-bold font-mono mb-1 text-center px-2`}>{node.label}</div>
            {node.level !== undefined && (
              <div className="text-xs opacity-90 font-mono">Nivel {node.level}</div>
            )}
          </>
        )}
        {node.type === 'origen' && (
          <div className={`${size.fontSize} font-bold font-mono text-center px-2 leading-tight`}>{node.label}</div>
        )}
        {node.type === 'fuente' && (
          <div className={`${size.fontSize} font-bold font-mono text-center px-1 leading-tight`}>{node.label}</div>
        )}
        {node.type === 'permiso' && node.permissions && (
          <div className="flex flex-col items-center gap-1.5 p-1">
            <div className="text-xs font-bold font-mono mb-0.5">Permisos</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {node.permissions.ver && (
                <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-md" title="Ver" />
              )}
              {node.permissions.insertar && (
                <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-md" title="Insertar" />
              )}
              {node.permissions.actualizar && (
                <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white shadow-md" title="Actualizar" />
              )}
              {node.permissions.eliminar && (
                <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-md" title="Eliminar" />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading && !selectedPerfilId) {
    return (
      <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
        <LoadingSpinner message="Cargando datos..." />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      {/* Selector de perfil */}
      <div className="mb-6">
        <SelectWithPlaceholder
          value={selectedPerfilId}
          onChange={(value) => setSelectedPerfilId(value ? Number(value) : null)}
          options={perfilOptions}
          placeholder="VISUALIZAR POR PERFIL"
        />
      </div>

      {/* Skill Tree Canvas */}
      {selectedPerfilId && skillTree.nodes.length > 0 && (
        <div className="relative w-full bg-gradient-to-b from-neutral-800 via-neutral-850 to-neutral-900 rounded-lg overflow-auto border-2 border-purple-500/30 shadow-2xl" style={{ minHeight: '600px', height: '70vh', maxHeight: '80vh' }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
                <stop offset="100%" stopColor="rgba(139, 92, 246, 0.3)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {skillTree.connections.map(connection => {
              const fromNode = skillTree.nodes.find(n => n.id === connection.from)
              const toNode = skillTree.nodes.find(n => n.id === connection.to)
              
              if (!fromNode || !toNode) return null

              const fromX = fromNode.x
              const fromY = fromNode.y
              const toX = toNode.x
              const toY = toNode.y

              // Calcular puntos de conexión (bordes de los círculos)
              const angle = Math.atan2(toY - fromY, toX - fromX)
              const fromRadius = fromNode.type === 'perfil' ? 8 : fromNode.type === 'origen' ? 6 : 5
              const toRadius = toNode.type === 'perfil' ? 8 : toNode.type === 'origen' ? 6 : 5
              
              const fromXOffset = Math.cos(angle) * fromRadius
              const fromYOffset = Math.sin(angle) * fromRadius
              const toXOffset = -Math.cos(angle) * toRadius
              const toYOffset = -Math.sin(angle) * toRadius

              const x1 = fromX + fromXOffset
              const y1 = fromY + fromYOffset
              const x2 = toX + toXOffset
              const y2 = toY + toYOffset

              return (
                <line
                  key={`${connection.from}-${connection.to}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#connectionGradient)"
                  strokeWidth="0.5"
                  filter="url(#glow)"
                  className="transition-opacity duration-300"
                />
              )
            })}
          </svg>

          {/* Nodos (renderizados encima de las líneas) */}
          <div className="absolute inset-0">
            {skillTree.nodes.map(node => renderNode(node))}
          </div>

          {/* Leyenda de permisos activos - Centrada en la parte inferior */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/50">
            <div className="text-xs font-mono text-white/80 mb-1.5 text-center font-bold">PERMISOS ACTIVOS</div>
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-400 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Ver</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-400 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Insertar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Actualizar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Eliminar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPerfilId && loading && (
        <div className="mt-4">
          <LoadingSpinner message="Cargando permisos..." />
        </div>
      )}

      {selectedPerfilId && !loading && skillTree.nodes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
          <p className="font-mono">No se encontraron permisos para este perfil</p>
        </div>
      )}
    </div>
  )
}

