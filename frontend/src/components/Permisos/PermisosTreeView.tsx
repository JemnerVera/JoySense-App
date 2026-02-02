/**
 * PermisosTreeView - Vista tipo árbol/skill tree para visualizar permisos
 * Muestra permisos organizados por: Perfil → Origen → Fuente → Permisos
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { JoySenseService } from '../../services/backend-api'
import { LoadingSpinner } from '../SystemParameters/LoadingSpinner'
import { SelectWithPlaceholder } from '../selectors'

// ============================================================================
// INTERFACES
// ============================================================================

interface PermisosTreeViewProps {
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

interface PermisoGrouped {
  perfilid: number
  perfilNombre: string
  origenes: {
    origenid: number
    origenNombre: string
    fuentes: {
      fuenteid: number
      fuenteNombre: string
      permisos: Permiso[]
    }[]
  }[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PermisosTreeView({ themeColor = 'purple' }: PermisosTreeViewProps) {
  const { t } = useLanguage()

  // Estados
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null)
  const [perfilesData, setPerfilesData] = useState<Perfil[]>([])
  const [origenesData, setOrigenesData] = useState<Origen[]>([])
  const [fuentesData, setFuentesData] = useState<Fuente[]>([])
  const [permisosData, setPermisosData] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrigenes, setExpandedOrigenes] = useState<Set<number>>(new Set())
  const [expandedFuentes, setExpandedFuentes] = useState<Set<number>>(new Set())

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
      
      // Filtrar permisos del perfil seleccionado y activos
      const permisosFiltrados = permisosArray.filter(
        (p: Permiso) => p.perfilid === perfilid && p.statusid === 1
      )
      
      setPermisosData(permisosFiltrados)
      
      // Expandir automáticamente orígenes y fuentes que tienen permisos
      const origenesConPermisos = new Set(permisosFiltrados.map((p: Permiso) => p.origenid))
      const fuentesConPermisos = new Set(permisosFiltrados.map((p: Permiso) => p.fuenteid))
      setExpandedOrigenes(origenesConPermisos)
      setExpandedFuentes(fuentesConPermisos)
    } catch (error) {
      console.error('Error cargando permisos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar permisos por perfil → origen → fuente
  const permisosGrouped = useMemo(() => {
    if (!selectedPerfilId || permisosData.length === 0) {
      return null
    }

    const perfil = perfilesData.find(p => p.perfilid === selectedPerfilId)
    if (!perfil) return null

    // Agrupar por origen
    const origenesMap = new Map<number, {
      origenid: number
      origenNombre: string
      fuentes: Map<number, {
        fuenteid: number
        fuenteNombre: string
        permisos: Permiso[]
      }>
    }>()

    permisosData.forEach(permiso => {
      const origen = origenesData.find(o => o.origenid === permiso.origenid)
      const fuente = fuentesData.find(f => f.fuenteid === permiso.fuenteid)
      
      if (!origen || !fuente) return

      // Obtener o crear origen
      if (!origenesMap.has(permiso.origenid)) {
        origenesMap.set(permiso.origenid, {
          origenid: permiso.origenid,
          origenNombre: origen.origen,
          fuentes: new Map()
        })
      }

      const origenData = origenesMap.get(permiso.origenid)!
      
      // Obtener o crear fuente
      if (!origenData.fuentes.has(permiso.fuenteid)) {
        origenData.fuentes.set(permiso.fuenteid, {
          fuenteid: permiso.fuenteid,
          fuenteNombre: fuente.fuente,
          permisos: []
        })
      }

      const fuenteData = origenData.fuentes.get(permiso.fuenteid)!
      fuenteData.permisos.push(permiso)
    })

    // Convertir Maps a arrays
    const origenesArray = Array.from(origenesMap.values()).map(origen => ({
      ...origen,
      fuentes: Array.from(origen.fuentes.values())
    }))

    return {
      perfilid: perfil.perfilid,
      perfilNombre: perfil.perfil,
      origenes: origenesArray
    }
  }, [selectedPerfilId, permisosData, perfilesData, origenesData, fuentesData])

  // Toggle expandir/colapsar origen
  function toggleOrigen(origenid: number) {
    const newExpanded = new Set(expandedOrigenes)
    if (newExpanded.has(origenid)) {
      newExpanded.delete(origenid)
    } else {
      newExpanded.add(origenid)
    }
    setExpandedOrigenes(newExpanded)
  }

  // Toggle expandir/colapsar fuente
  function toggleFuente(fuenteid: number) {
    const newExpanded = new Set(expandedFuentes)
    if (newExpanded.has(fuenteid)) {
      newExpanded.delete(fuenteid)
    } else {
      newExpanded.add(fuenteid)
    }
    setExpandedFuentes(newExpanded)
  }

  // Obtener opciones de perfiles para el select
  const perfilOptions = useMemo(() => {
    return perfilesData.map(p => ({
      value: p.perfilid,
      label: `${p.perfil} (Nivel ${p.nivel})`
    }))
  }, [perfilesData])

  // Función para obtener color del tema
  function getThemeColor(type: 'bg' | 'text' | 'border' | 'hover'): string {
    const colors = {
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      }
    }
    return colors[themeColor][type]
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
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {t('forms.select_profile')?.toUpperCase() || 'SELECCIONAR PERFIL'}
        </label>
        <SelectWithPlaceholder
          value={selectedPerfilId}
          onChange={(value) => setSelectedPerfilId(value ? Number(value) : null)}
          options={perfilOptions}
          placeholder={t('forms.select_profile') || 'Seleccionar perfil'}
        />
      </div>

      {/* Árbol de permisos */}
      {selectedPerfilId && permisosGrouped && (
        <div className="space-y-4">
          {/* Título del perfil */}
          <div className={`${getThemeColor('bg')} text-white p-4 rounded-lg font-mono tracking-wider`}>
            <h2 className="text-xl font-bold">{permisosGrouped.perfilNombre}</h2>
            <p className="text-sm opacity-90">
              {permisosData.length} {permisosData.length === 1 ? 'permiso' : 'permisos'} configurado{permisosData.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Orígenes */}
          {permisosGrouped.origenes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
              <p className="font-mono">No hay permisos configurados para este perfil</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permisosGrouped.origenes.map(origen => {
                const isExpanded = expandedOrigenes.has(origen.origenid)
                return (
                  <div key={origen.origenid} className="border border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                    {/* Header del origen */}
                    <button
                      onClick={() => toggleOrigen(origen.origenid)}
                      className={`w-full flex items-center justify-between p-4 ${getThemeColor('bg')} ${getThemeColor('hover')} text-white transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-mono font-bold tracking-wider">{origen.origenNombre}</span>
                        <span className="text-sm opacity-75">
                          ({origen.fuentes.length} {origen.fuentes.length === 1 ? 'fuente' : 'fuentes'})
                        </span>
                      </div>
                    </button>

                    {/* Fuentes del origen */}
                    {isExpanded && (
                      <div className="bg-gray-50 dark:bg-neutral-800 p-4 space-y-3">
                        {origen.fuentes.map(fuente => {
                          const isFuenteExpanded = expandedFuentes.has(fuente.fuenteid)
                          // Agrupar permisos por objetoid (si aplica)
                          const permisosPorObjeto = new Map<number | null, Permiso[]>()
                          fuente.permisos.forEach(p => {
                            const key = p.objetoid
                            if (!permisosPorObjeto.has(key)) {
                              permisosPorObjeto.set(key, [])
                            }
                            permisosPorObjeto.get(key)!.push(p)
                          })

                          return (
                            <div key={fuente.fuenteid} className="border border-gray-200 dark:border-neutral-600 rounded-lg overflow-hidden">
                              {/* Header de la fuente */}
                              <button
                                onClick={() => toggleFuente(fuente.fuenteid)}
                                className={`w-full flex items-center justify-between p-3 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors`}
                              >
                                <div className="flex items-center gap-3">
                                  <svg
                                    className={`w-4 h-4 transition-transform ${isFuenteExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="font-mono font-semibold text-gray-800 dark:text-neutral-200">
                                    {fuente.fuenteNombre}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-neutral-400">
                                    ({fuente.permisos.length} {fuente.permisos.length === 1 ? 'permiso' : 'permisos'})
                                  </span>
                                </div>
                              </button>

                              {/* Permisos de la fuente */}
                              {isFuenteExpanded && (
                                <div className="bg-white dark:bg-neutral-900 p-4 space-y-3">
                                      {Array.from(permisosPorObjeto.entries()).map(([objetoid, permisos]) => {
                                        // Consolidar permisos: si hay múltiples, mostrar el que tenga más permisos activos
                                        const permisoConsolidado = permisos.reduce((acc, p) => {
                                          const accCount = (acc.puede_ver ? 1 : 0) + (acc.puede_insertar ? 1 : 0) + 
                                                          (acc.puede_actualizar ? 1 : 0) + (acc.puede_eliminar ? 1 : 0)
                                          const pCount = (p.puede_ver ? 1 : 0) + (p.puede_insertar ? 1 : 0) + 
                                                        (p.puede_actualizar ? 1 : 0) + (p.puede_eliminar ? 1 : 0)
                                          return pCount > accCount ? p : acc
                                        }, permisos[0])
                                        
                                        return (
                                          <div key={objetoid ?? 'null'} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
                                            {objetoid && (
                                              <div className="mb-3 text-xs font-mono text-gray-500 dark:text-neutral-400 border-b border-gray-200 dark:border-neutral-700 pb-2">
                                                Objeto ID: {objetoid}
                                              </div>
                                            )}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              {/* Ver */}
                                              <div className={`flex items-center gap-3 p-2 rounded-lg border-2 ${
                                                permisoConsolidado.puede_ver 
                                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                                                  : 'bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600'
                                              }`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                  permisoConsolidado.puede_ver 
                                                    ? 'bg-green-500' 
                                                    : 'bg-gray-300 dark:bg-neutral-600'
                                                }`}>
                                                  {permisoConsolidado.puede_ver && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                  )}
                                                </div>
                                                <span className={`text-sm font-mono font-semibold ${
                                                  permisoConsolidado.puede_ver 
                                                    ? 'text-green-700 dark:text-green-300' 
                                                    : 'text-gray-500 dark:text-neutral-400'
                                                }`}>
                                                  Ver
                                                </span>
                                              </div>
                                              
                                              {/* Insertar */}
                                              <div className={`flex items-center gap-3 p-2 rounded-lg border-2 ${
                                                permisoConsolidado.puede_insertar 
                                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                                                  : 'bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600'
                                              }`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                  permisoConsolidado.puede_insertar 
                                                    ? 'bg-blue-500' 
                                                    : 'bg-gray-300 dark:bg-neutral-600'
                                                }`}>
                                                  {permisoConsolidado.puede_insertar && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                  )}
                                                </div>
                                                <span className={`text-sm font-mono font-semibold ${
                                                  permisoConsolidado.puede_insertar 
                                                    ? 'text-blue-700 dark:text-blue-300' 
                                                    : 'text-gray-500 dark:text-neutral-400'
                                                }`}>
                                                  Insertar
                                                </span>
                                              </div>
                                              
                                              {/* Actualizar */}
                                              <div className={`flex items-center gap-3 p-2 rounded-lg border-2 ${
                                                permisoConsolidado.puede_actualizar 
                                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' 
                                                  : 'bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600'
                                              }`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                  permisoConsolidado.puede_actualizar 
                                                    ? 'bg-yellow-500' 
                                                    : 'bg-gray-300 dark:bg-neutral-600'
                                                }`}>
                                                  {permisoConsolidado.puede_actualizar && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                  )}
                                                </div>
                                                <span className={`text-sm font-mono font-semibold ${
                                                  permisoConsolidado.puede_actualizar 
                                                    ? 'text-yellow-700 dark:text-yellow-300' 
                                                    : 'text-gray-500 dark:text-neutral-400'
                                                }`}>
                                                  Actualizar
                                                </span>
                                              </div>
                                              
                                              {/* Eliminar */}
                                              <div className={`flex items-center gap-3 p-2 rounded-lg border-2 ${
                                                permisoConsolidado.puede_eliminar 
                                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                                                  : 'bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600'
                                              }`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                  permisoConsolidado.puede_eliminar 
                                                    ? 'bg-red-500' 
                                                    : 'bg-gray-300 dark:bg-neutral-600'
                                                }`}>
                                                  {permisoConsolidado.puede_eliminar && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                  )}
                                                </div>
                                                <span className={`text-sm font-mono font-semibold ${
                                                  permisoConsolidado.puede_eliminar 
                                                    ? 'text-red-700 dark:text-red-300' 
                                                    : 'text-gray-500 dark:text-neutral-400'
                                                }`}>
                                                  Eliminar
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedPerfilId && loading && (
        <div className="mt-4">
          <LoadingSpinner message="Cargando permisos..." />
        </div>
      )}

      {selectedPerfilId && !loading && !permisosGrouped && (
        <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
          <p className="font-mono">No se encontraron permisos para este perfil</p>
        </div>
      )}
    </div>
  )
}

