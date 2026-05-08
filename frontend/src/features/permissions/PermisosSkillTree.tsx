import { STATUS } from '../../constants/status';

import React, { useState, useEffect, useMemo } from 'react'
import { JoySenseService } from '../../services/backend-api'
import { LoadingSpinner } from '../system-parameters/LoadingSpinner'
import { SelectWithPlaceholder } from '../../components/shared/selectors'

interface PermisosSkillTreeProps {
  themeColor?: 'purple'
  permisosTipo?: 'permisos-geo' | 'permisos-conf'
  paisesData?: any[]
  empresasData?: any[]
  fundosData?: any[]
  ubicacionesData?: any[]
  nodosData?: any[]
  localizacionesData?: any[]
  fuentesData?: any[]
  perfilesData?: any[]
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

interface Fuente {
  fuenteid: number
  fuente: string
  esquema: string
  statusid: number
}

const GEO_DATA_MAP: Record<string, { data: any[]; idField: string; nameField: string }> = {
  pais: { data: [], idField: 'paisid', nameField: 'pais' },
  empresa: { data: [], idField: 'empresaid', nameField: 'empresa' },
  fundo: { data: [], idField: 'fundoid', nameField: 'fundo' },
  ubicacion: { data: [], idField: 'ubicacionid', nameField: 'ubicacion' },
  nodo: { data: [], idField: 'nodoid', nameField: 'nodo' },
  localizacion: { data: [], idField: 'localizacionid', nameField: 'localizacion' },
}

export function PermisosSkillTree({
  themeColor = 'purple',
  permisosTipo,
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
  nodosData = [],
  localizacionesData = [],
  fuentesData = [],
  perfilesData: perfilesDataProp = []
}: PermisosSkillTreeProps) {

  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null)
  const [perfilesData, setPerfilesData] = useState<Perfil[]>([])
  const [origenesData, setOrigenesData] = useState<any[]>([])
  const [permisosData, setPermisosData] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedPerfilId) {
      loadPermisos(selectedPerfilId)
      setCurrentPage(1)
    } else {
      setPermisosData([])
    }
  }, [selectedPerfilId])

  async function loadInitialData() {
    try {
      setLoading(true)
      const [perfiles, origenes] = await Promise.all([
        JoySenseService.getTableData('perfil', 500),
        JoySenseService.getTableData('origen', 100)
      ])

      setPerfilesData(Array.isArray(perfiles) ? perfiles.filter((p: Perfil) => p.statusid === STATUS.ACTIVO) : [])
      setOrigenesData(Array.isArray(origenes) ? origenes.filter((o: any) => o.statusid === STATUS.ACTIVO) : [])
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
        (p: Permiso) => p.perfilid === perfilid && p.statusid === STATUS.ACTIVO
      )

      setPermisosData(permisosFiltrados)
    } catch (error) {
      console.error('Error cargando permisos:', error)
    } finally {
      setLoading(false)
    }
  }

  const origenFiltro = useMemo(() => {
    if (!permisosTipo) return null
    if (permisosTipo === 'permisos-geo') {
      return (nombre: string) => {
        const upper = nombre.toUpperCase().trim()
        return upper === 'GEOGRAFÍA' || upper === 'GEOGRAFIA'
      }
    }
    return (nombre: string) => nombre.toUpperCase().trim() === 'TABLA'
  }, [permisosTipo])

  const fuentesMap = useMemo(() => {
    const map: Record<string, Fuente> = {}
    const arr = Array.isArray(fuentesData) ? fuentesData : []
    arr.forEach((f: Fuente) => {
      if (f.fuenteid) map[f.fuenteid] = f
    })
    return map
  }, [fuentesData])

  const geoLookup = useMemo(() => {
    const map = { ...GEO_DATA_MAP }
    map.pais = { ...map.pais, data: paisesData || [] }
    map.empresa = { ...map.empresa, data: empresasData || [] }
    map.fundo = { ...map.fundo, data: fundosData || [] }
    map.ubicacion = { ...map.ubicacion, data: ubicacionesData || [] }
    map.nodo = { ...map.nodo, data: nodosData || [] }
    map.localizacion = { ...map.localizacion, data: localizacionesData || [] }
    return map
  }, [paisesData, empresasData, fundosData, ubicacionesData, nodosData, localizacionesData])

  function getObjetoNombre(fuenteid: number, objetoid: number | null): string {
    if (objetoid === null || objetoid === undefined) return '-'
    const fuente = fuentesMap[fuenteid]
    if (!fuente) return String(objetoid)
    const fuenteNombre = fuente.fuente?.toLowerCase().trim()
    const entry = geoLookup[fuenteNombre]
    if (!entry) return String(objetoid)
    const item = entry.data.find((d: any) => d[entry.idField] === objetoid)
    return item ? item[entry.nameField] : String(objetoid)
  }

  const permisosConInfo = useMemo(() => {
    return permisosData.map(p => {
      const origen = origenesData.find((o: any) => o.origenid === p.origenid)
      const fuente = fuentesMap[p.fuenteid]
      return {
        ...p,
        origenNombre: origen?.origen || 'Desconocido',
        fuenteNombre: fuente?.fuente || 'Desconocido',
        objetoNombre: getObjetoNombre(p.fuenteid, p.objetoid)
      }
    }).filter(p => {
      if (!origenFiltro) return true
      return origenFiltro(p.origenNombre)
    })
  }, [permisosData, origenesData, fuentesMap, origenFiltro])

  const totalPages = Math.ceil(permisosConInfo.length / itemsPerPage)

  const paginatedPermisos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return permisosConInfo.slice(startIndex, startIndex + itemsPerPage)
  }, [permisosConInfo, currentPage])

  const perfilesList = perfilesData.length > 0 ? perfilesData : perfilesDataProp

  const perfilOptions = useMemo(() => {
    return perfilesList.map((p: Perfil) => ({
      value: p.perfilid,
      label: `${p.perfil} (Nivel ${p.nivel})`
    }))
  }, [perfilesList])

  function getStatusBadge(activo: boolean) {
    if (activo) {
      return (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-900 text-green-300 border border-green-700 font-mono tracking-wider">
          ACTIVO
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-900 text-red-300 border border-red-700 font-mono tracking-wider">
        INACTIVO
      </span>
    )
  }

  function PermissionIcon(activo: boolean) {
    if (activo) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }

  const origenFilterLabel = permisosTipo === 'permisos-geo' ? 'GEOGRAFÍA' : permisosTipo === 'permisos-conf' ? 'TABLA' : null

  if (loading && !selectedPerfilId) {
    return (
      <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
        <LoadingSpinner message="Cargando datos..." />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      <div className="mb-6">
        <SelectWithPlaceholder
          value={selectedPerfilId}
          onChange={(value) => setSelectedPerfilId(value ? Number(value) : null)}
          options={perfilOptions}
          placeholder="VISUALIZAR POR PERFIL"
        />
      </div>

      {selectedPerfilId && loading && (
        <div className="mt-4">
          <LoadingSpinner message="Cargando permisos..." />
        </div>
      )}

      {selectedPerfilId && !loading && permisosConInfo.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
          <p className="font-mono">
            {origenFilterLabel
              ? `No se encontraron permisos con origen ${origenFilterLabel} para este perfil`
              : 'No se encontraron permisos para este perfil'}
          </p>
        </div>
      )}

      {selectedPerfilId && !loading && permisosConInfo.length > 0 && (
        <div className="bg-gray-200 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">FUENTE</th>
                  <th className="text-left py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">
                    {permisosTipo === 'permisos-geo' ? 'OBJETO' : 'OBJETO ID'}
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">VER</th>
                  <th className="text-center py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">INSERTAR</th>
                  <th className="text-center py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">ACTUALIZAR</th>
                  <th className="text-center py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">ELIMINAR</th>
                  <th className="text-center py-3 px-4 font-bold text-purple-500 font-mono tracking-wider">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPermisos.map((permiso) => (
                  <tr key={permiso.permisoid} className="border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-4 text-gray-800 dark:text-white font-mono text-xs align-middle">
                      {permiso.fuenteNombre}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-white font-mono text-xs align-middle">
                      {permisosTipo === 'permisos-geo' ? permiso.objetoNombre : (permiso.objetoid ?? '-')}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex items-center justify-center">
                        {PermissionIcon(permiso.puede_ver)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex items-center justify-center">
                        {PermissionIcon(permiso.puede_insertar)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex items-center justify-center">
                        {PermissionIcon(permiso.puede_actualizar)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex items-center justify-center">
                        {PermissionIcon(permiso.puede_eliminar)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex items-center justify-center">
                        {getStatusBadge(permiso.statusid === STATUS.ACTIVO)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 dark:border-neutral-700">
              <div className="text-sm text-neutral-400 font-mono">
                PÁGINA {currentPage} DE {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
                  title="Primera página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
                  title="Página anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
                  title="Página siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
