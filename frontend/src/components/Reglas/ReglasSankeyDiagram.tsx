/**
 * ReglasSankeyDiagram - Diagrama Sankey para visualizar relaciones de reglas
 * Muestra: Regla → Regla-Objeto, Regla → Regla-Umbral, Regla → Regla-Perfil
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { JoySenseService } from '../../services/backend-api'
import { LoadingSpinner } from '../../features/system-parameters/LoadingSpinner'

// ============================================================================
// INTERFACES
// ============================================================================

interface ReglasSankeyDiagramProps {
  themeColor?: 'red'
}

interface Regla {
  reglaid: number
  nombre: string
  prioridad: number
  statusid: number
}

interface ReglaObjeto {
  regla_objetoid: number
  reglaid: number
  origenid: number
  fuenteid: number
  objetoid: number | null
  statusid: number
}

interface ReglaUmbral {
  regla_umbralid: number
  reglaid: number
  umbralid: number
  operador_logico: string
  orden: number
  statusid: number
}

interface ReglaPerfil {
  regla_perfilid: number
  reglaid: number
  perfilid: number
  statusid: number
}

interface Origen {
  origenid: number
  origen: string
}

interface Fuente {
  fuenteid: number
  fuente: string
}

interface Umbral {
  umbralid: number
  umbral: string
}

interface Perfil {
  perfilid: number
  perfil: string
}

interface SankeyNode {
  id: string
  label: string
  type: 'regla' | 'objeto' | 'umbral' | 'perfil'
  x: number
  y: number
  width: number
  height: number
  value: number
  data?: any
}

interface SankeyLink {
  source: string
  target: string
  value: number
  color: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReglasSankeyDiagram({ themeColor = 'red' }: ReglasSankeyDiagramProps) {
  const { t } = useLanguage()

  // Estados
  const [reglasData, setReglasData] = useState<Regla[]>([])
  const [reglaObjetosData, setReglaObjetosData] = useState<ReglaObjeto[]>([])
  const [reglaUmbralesData, setReglaUmbralesData] = useState<ReglaUmbral[]>([])
  const [reglaPerfilesData, setReglaPerfilesData] = useState<ReglaPerfil[]>([])
  const [origenesData, setOrigenesData] = useState<Origen[]>([])
  const [fuentesData, setFuentesData] = useState<Fuente[]>([])
  const [umbralesData, setUmbralesData] = useState<Umbral[]>([])
  const [perfilesData, setPerfilesData] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  // Cargar datos
  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      setLoading(true)
      const [
        reglas,
        reglaObjetos,
        reglaUmbrales,
        reglaPerfiles,
        origenes,
        fuentes,
        umbrales,
        perfiles
      ] = await Promise.all([
        JoySenseService.getTableData('regla', 500),
        JoySenseService.getTableData('regla_objeto', 1000),
        JoySenseService.getTableData('regla_umbral', 1000),
        JoySenseService.getTableData('regla_perfil', 1000),
        JoySenseService.getTableData('origen', 100),
        JoySenseService.getTableData('fuente', 500),
        JoySenseService.getTableData('umbral', 500),
        JoySenseService.getTableData('perfil', 500)
      ])

      setReglasData(Array.isArray(reglas) ? reglas.filter((r: Regla) => r.statusid === 1) : [])
      setReglaObjetosData(Array.isArray(reglaObjetos) ? reglaObjetos.filter((ro: ReglaObjeto) => ro.statusid === 1) : [])
      setReglaUmbralesData(Array.isArray(reglaUmbrales) ? reglaUmbrales.filter((ru: ReglaUmbral) => ru.statusid === 1) : [])
      setReglaPerfilesData(Array.isArray(reglaPerfiles) ? reglaPerfiles.filter((rp: ReglaPerfil) => rp.statusid === 1) : [])
      setOrigenesData(Array.isArray(origenes) ? origenes : [])
      setFuentesData(Array.isArray(fuentes) ? fuentes : [])
      setUmbralesData(Array.isArray(umbrales) ? umbrales : [])
      setPerfilesData(Array.isArray(perfiles) ? perfiles : [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Construir diagrama Sankey
  const sankeyData = useMemo(() => {
    if (reglasData.length === 0) {
      return { nodes: [], links: [] }
    }

    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []

    // Calcular altura total necesaria basada en el contenido
    const reglasCount = reglasData.length
    const objetosCount = new Set(reglaObjetosData.map(ro => `${ro.origenid}-${ro.fuenteid}-${ro.objetoid || 'null'}`)).size
    const umbralesCount = new Set(reglaUmbralesData.map(ru => ru.umbralid)).size
    const perfilesCount = new Set(reglaPerfilesData.map(rp => rp.perfilid)).size
    
    const maxCount = Math.max(reglasCount, objetosCount, umbralesCount, perfilesCount)
    // Altura más compacta: máximo 100 unidades
    const totalHeight = Math.min(100, Math.max(60, maxCount * 3))

    // Columna 1: Reglas (izquierda) - Distribución vertical más compacta
    let currentY = 5 // Empezar desde arriba con margen
    const reglaSpacing = 2.5 // Espaciado fijo entre reglas
    
    reglasData.forEach((regla) => {
      const nodeId = `regla-${regla.reglaid}`
      
      // Contar relaciones
      const objetosCount = reglaObjetosData.filter(ro => ro.reglaid === regla.reglaid).length
      const umbralesCount = reglaUmbralesData.filter(ru => ru.reglaid === regla.reglaid).length
      const perfilesCount = reglaPerfilesData.filter(rp => rp.reglaid === regla.reglaid).length
      const totalRelations = objetosCount + umbralesCount + perfilesCount

      const nodeHeight = Math.max(1.5, Math.min(4, totalRelations * 0.2 + 1))

      nodes.push({
        id: nodeId,
        label: regla.nombre,
        type: 'regla',
        x: 5,
        y: currentY,
        width: 10,
        height: nodeHeight,
        value: totalRelations,
        data: regla
      })

      currentY += nodeHeight + reglaSpacing
    })

    // Columna 2: Objetos (centro-izquierda) - Posicionar cerca de las reglas que los conectan
    const objetosUnicos = new Map<string, { origen: string; fuente: string; objetoid: number | null; reglas: number[] }>()
    reglaObjetosData.forEach(ro => {
      const origen = origenesData.find(o => o.origenid === ro.origenid)
      const fuente = fuentesData.find(f => f.fuenteid === ro.fuenteid)
      if (origen && fuente) {
        const key = `${ro.origenid}-${ro.fuenteid}-${ro.objetoid || 'null'}`
        if (!objetosUnicos.has(key)) {
          objetosUnicos.set(key, {
            origen: origen.origen,
            fuente: fuente.fuente,
            objetoid: ro.objetoid,
            reglas: []
          })
        }
        objetosUnicos.get(key)!.reglas.push(ro.reglaid)
      }
    })

    const objetosArray = Array.from(objetosUnicos.entries())
    // Para cada objeto, calcular su posición basada en las reglas que lo conectan
    objetosArray.forEach(([key, obj]) => {
      const nodeId = `objeto-${key}`
      const label = obj.objetoid 
        ? `${obj.origen} - ${obj.fuente} (${obj.objetoid})`
        : `${obj.origen} - ${obj.fuente}`

      // Calcular posición Y promedio de las reglas que conectan a este objeto
      const reglasConectadas = obj.reglas.map(reglaid => {
        const reglaNode = nodes.find(n => n.id === `regla-${reglaid}`)
        return reglaNode ? reglaNode.y + reglaNode.height / 2 : null
      }).filter((y): y is number => y !== null)

      const avgY = reglasConectadas.length > 0
        ? reglasConectadas.reduce((sum, y) => sum + y, 0) / reglasConectadas.length
        : 50 // Fallback

      const count = obj.reglas.length
      const nodeHeight = Math.max(1.2, Math.min(3.5, count * 0.25 + 0.5))

      nodes.push({
        id: nodeId,
        label: label,
        type: 'objeto',
        x: 30,
        y: Math.max(2, Math.min(98, avgY - nodeHeight / 2)), // Asegurar que esté dentro del viewBox
        width: 10,
        height: nodeHeight,
        value: count,
        data: { key, ...obj }
      })
    })

    // Columna 3: Umbrales (centro-derecha) - Posicionar cerca de las reglas que los conectan
    const umbralesUnicos = new Map<number, { umbralid: number; nombre: string; reglas: number[] }>()
    reglaUmbralesData.forEach(ru => {
      if (!umbralesUnicos.has(ru.umbralid)) {
        const umbral = umbralesData.find(u => u.umbralid === ru.umbralid)
        umbralesUnicos.set(ru.umbralid, {
          umbralid: ru.umbralid,
          nombre: umbral?.umbral || `Umbral ${ru.umbralid}`,
          reglas: []
        })
      }
      umbralesUnicos.get(ru.umbralid)!.reglas.push(ru.reglaid)
    })

    const umbralesArray = Array.from(umbralesUnicos.values())
    // Para cada umbral, calcular su posición basada en las reglas que lo conectan
    umbralesArray.forEach(umbral => {
      const nodeId = `umbral-${umbral.umbralid}`
      
      // Calcular posición Y promedio de las reglas que conectan a este umbral
      const reglasConectadas = umbral.reglas.map(reglaid => {
        const reglaNode = nodes.find(n => n.id === `regla-${reglaid}`)
        return reglaNode ? reglaNode.y + reglaNode.height / 2 : null
      }).filter((y): y is number => y !== null)

      const avgY = reglasConectadas.length > 0
        ? reglasConectadas.reduce((sum, y) => sum + y, 0) / reglasConectadas.length
        : 50 // Fallback

      const count = umbral.reglas.length
      const nodeHeight = Math.max(1.2, Math.min(3.5, count * 0.25 + 0.5))

      nodes.push({
        id: nodeId,
        label: umbral.nombre,
        type: 'umbral',
        x: 55,
        y: Math.max(2, Math.min(98, avgY - nodeHeight / 2)), // Asegurar que esté dentro del viewBox
        width: 10,
        height: nodeHeight,
        value: count,
        data: umbral
      })
    })

    // Columna 4: Perfiles (derecha) - Posicionar cerca de las reglas que los conectan
    const perfilesUnicos = new Map<number, { perfilid: number; nombre: string; reglas: number[] }>()
    reglaPerfilesData.forEach(rp => {
      if (!perfilesUnicos.has(rp.perfilid)) {
        const perfil = perfilesData.find(p => p.perfilid === rp.perfilid)
        perfilesUnicos.set(rp.perfilid, {
          perfilid: rp.perfilid,
          nombre: perfil?.perfil || `Perfil ${rp.perfilid}`,
          reglas: []
        })
      }
      perfilesUnicos.get(rp.perfilid)!.reglas.push(rp.reglaid)
    })

    const perfilesArray = Array.from(perfilesUnicos.values())
    // Para cada perfil, calcular su posición basada en las reglas que lo conectan
    perfilesArray.forEach(perfil => {
      const nodeId = `perfil-${perfil.perfilid}`
      
      // Calcular posición Y promedio de las reglas que conectan a este perfil
      const reglasConectadas = perfil.reglas.map(reglaid => {
        const reglaNode = nodes.find(n => n.id === `regla-${reglaid}`)
        return reglaNode ? reglaNode.y + reglaNode.height / 2 : null
      }).filter((y): y is number => y !== null)

      const avgY = reglasConectadas.length > 0
        ? reglasConectadas.reduce((sum, y) => sum + y, 0) / reglasConectadas.length
        : 50 // Fallback

      const count = perfil.reglas.length
      const nodeHeight = Math.max(1.2, Math.min(3.5, count * 0.25 + 0.5))

      nodes.push({
        id: nodeId,
        label: perfil.nombre,
        type: 'perfil',
        x: 75,
        y: Math.max(2, Math.min(98, avgY - nodeHeight / 2)), // Asegurar que esté dentro del viewBox
        width: 10,
        height: nodeHeight,
        value: count,
        data: perfil
      })
    })

    // Crear links: Regla → Objeto
    reglaObjetosData.forEach(ro => {
      const reglaNode = nodes.find(n => n.id === `regla-${ro.reglaid}`)
      if (!reglaNode) return

      const origen = origenesData.find(o => o.origenid === ro.origenid)
      const fuente = fuentesData.find(f => f.fuenteid === ro.fuenteid)
      if (!origen || !fuente) return

      const key = `${ro.origenid}-${ro.fuenteid}-${ro.objetoid || 'null'}`
      const objetoNode = nodes.find(n => n.id === `objeto-${key}`)
      if (objetoNode) {
        links.push({
          source: reglaNode.id,
          target: objetoNode.id,
          value: 1,
          color: 'rgba(59, 130, 246, 0.6)' // Azul para objetos
        })
      }
    })

    // Crear links: Regla → Umbral
    reglaUmbralesData.forEach(ru => {
      const reglaNode = nodes.find(n => n.id === `regla-${ru.reglaid}`)
      const umbralNode = nodes.find(n => n.id === `umbral-${ru.umbralid}`)
      if (reglaNode && umbralNode) {
        links.push({
          source: reglaNode.id,
          target: umbralNode.id,
          value: 1,
          color: 'rgba(239, 68, 68, 0.6)' // Rojo para umbrales
        })
      }
    })

    // Crear links: Regla → Perfil
    reglaPerfilesData.forEach(rp => {
      const reglaNode = nodes.find(n => n.id === `regla-${rp.reglaid}`)
      const perfilNode = nodes.find(n => n.id === `perfil-${rp.perfilid}`)
      if (reglaNode && perfilNode) {
        links.push({
          source: reglaNode.id,
          target: perfilNode.id,
          value: 1,
          color: 'rgba(34, 197, 94, 0.6)' // Verde para perfiles
        })
      }
    })

    return { nodes, links }
  }, [reglasData, reglaObjetosData, reglaUmbralesData, reglaPerfilesData, origenesData, fuentesData, umbralesData, perfilesData])

  // Función para obtener color del nodo
  function getNodeColor(type: string): string {
    switch (type) {
      case 'regla':
        return '#ef4444' // Rojo
      case 'objeto':
        return '#3b82f6' // Azul
      case 'umbral':
        return '#f59e0b' // Amarillo/Naranja
      case 'perfil':
        return '#22c55e' // Verde
      default:
        return '#6b7280' // Gris
    }
  }

  // Renderizar path para link Sankey con forma tipo Sankey (curva suave)
  function renderSankeyPath(source: SankeyNode, target: SankeyNode, link: SankeyLink) {
    const sourceX = source.x + source.width
    const sourceY = source.y
    const sourceYBottom = source.y + source.height
    const targetX = target.x
    const targetY = target.y
    const targetYBottom = target.y + target.height

    // Calcular puntos de control para curva suave tipo Sankey
    const dx = targetX - sourceX
    const controlX1 = sourceX + dx * 0.33
    const controlX2 = sourceX + dx * 0.67

    // Crear path con forma de banda (Sankey style)
    const path = `
      M ${sourceX} ${sourceY}
      C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}
      L ${targetX} ${targetYBottom}
      C ${controlX2} ${targetYBottom}, ${controlX1} ${sourceYBottom}, ${sourceX} ${sourceYBottom}
      Z
    `

    const isHovered = hoveredLink === `${link.source}-${link.target}`

    return (
      <path
        key={`${link.source}-${link.target}`}
        d={path}
        fill={link.color}
        stroke="none"
        opacity={isHovered ? 0.8 : 0.4}
        className="transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setHoveredLink(`${link.source}-${link.target}`)}
        onMouseLeave={() => setHoveredLink(null)}
      />
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
        <LoadingSpinner message="Cargando datos de reglas..." />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      <h3 className="text-2xl font-bold mb-6 font-mono tracking-wider text-red-600 dark:text-red-400">
        DIAGRAMA DE RELACIONES DE REGLAS
      </h3>

      {sankeyData.nodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
          <p className="font-mono">No hay reglas configuradas</p>
        </div>
      ) : (
        <div className="relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-lg overflow-auto border-2 border-red-500/30 shadow-2xl" style={{ minHeight: '600px', height: '70vh' }}>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Renderizar links primero (detrás de los nodos) */}
            {sankeyData.links.map(link => {
              const sourceNode = sankeyData.nodes.find(n => n.id === link.source)
              const targetNode = sankeyData.nodes.find(n => n.id === link.target)
              if (!sourceNode || !targetNode) return null
              return renderSankeyPath(sourceNode, targetNode, link)
            })}

            {/* Renderizar nodos */}
            {sankeyData.nodes.map(node => (
              <g key={node.id}>
                {/* Rectángulo del nodo */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={getNodeColor(node.type)}
                  stroke="white"
                  strokeWidth="0.3"
                  rx="0.5"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-2"
                  filter="url(#glow)"
                />
                {/* Etiqueta del nodo - Regla abajo */}
                {node.type === 'regla' && (
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height + 2}
                    fill="white"
                    fontSize="1.6"
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    className="font-mono font-bold pointer-events-none"
                  >
                    {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                  </text>
                )}
                {(node.type === 'objeto' || node.type === 'umbral' || node.type === 'perfil') && (
                  <text
                    x={node.x + node.width + 0.5}
                    y={node.y + node.height / 2}
                    fill="white"
                    fontSize="1.4"
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="font-mono pointer-events-none"
                  >
                    {node.label.length > 18 ? node.label.substring(0, 18) + '...' : node.label}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Leyenda */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500/50">
            <div className="text-xs font-mono text-white/80 mb-1.5 text-center font-bold">TIPOS DE RELACIONES</div>
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Regla-Objeto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Regla-Umbral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" />
                <span className="text-white/90 text-xs font-mono">Regla-Perfil</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

